# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
import uuid
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException

from app.models.plan import Plan
from app.models.user_plan import UserPlan
from app.models.user import User

from app.models.audit_log import AuditType, AuditAction, AuditResult
from app.services.servicio_auditoria import register_audit


# ── Ver planes ────────────────────────────────────────────────────────────────

def get_active_plans(db: Session):
    """Devuelve todos los planes con status='active'."""
    return db.query(Plan).filter(Plan.status == "active").all()


# ── Ver mis suscripciones (un cliente puede tener varias) ────────────────────

def _contar_clases_fijas_anotables(user_id: int, specialization: str, restantes: int, db: Session) -> int:
    """Clases fijas de esa especialidad a las que el cliente todavía se puede anotar.

    No alcanza con el cupo que queda en el plan: ese es solo el techo. Lo que el cliente
    necesita saber es cuántas clases hay realmente para anotarse, porque puede estar
    suscripto a una especialidad sin ninguna actividad y el plan se le vence sin usar.

    Se cuentan las ocurrencias futuras, activas, con cupo libre y en las que todavía no
    está inscripto, y se acota al cupo que le queda en el plan.
    """
    if restantes <= 0:
        return 0

    from app.models.activity import Activity
    from app.models.reservation import Reservation

    hoy = date.today()
    actividades = db.query(Activity).filter(
        Activity.activity_type == "fixed",
        Activity.status == "active",
        Activity.specialization == specialization,
        # Las fijas legacy (una sola fila para todos los turnos) no tienen fecha: se
        # cuentan igual, porque siguen siendo anotables.
        or_(Activity.specific_date.is_(None), Activity.specific_date >= hoy),
    ).all()

    total = 0
    for act in actividades:
        ya_inscripto = db.query(Reservation).filter(
            Reservation.user_id == user_id,
            Reservation.activity_id == act.id,
            Reservation.status != "cancelled",
        ).first()
        if ya_inscripto:
            continue

        if act.specific_date is not None:
            # Fila = una ocurrencia concreta: sus reservas son las de ese turno.
            ocupados = db.query(func.count(Reservation.id)).filter(
                Reservation.activity_id == act.id,
                Reservation.status != "cancelled",
            ).scalar() or 0
            if (act.capacity or 0) - ocupados <= 0:
                continue

        total += 1

    return min(total, restantes)


def _clases_del_token(user_plan_id: int, db: Session):
    """Las clases a las que el cliente quedó inscripto al gastar este token.

    Son las reservas imputadas al plan: como el token se gasta en una sola actividad,
    normalmente son las clases de un mes de esa actividad. Se ordenan por fecha porque
    es como el cliente las va a cursar.
    """
    from app.models.activity import Activity
    from app.models.reservation import Reservation

    filas = (
        db.query(Reservation, Activity)
        .join(Activity, Reservation.activity_id == Activity.id)
        .filter(
            Reservation.user_plan_id == user_plan_id,
            Reservation.status != "cancelled",
        )
        .order_by(Reservation.reservation_date.asc())
        .all()
    )
    return [
        {
            "activity_name": act.name,
            "reservation_date": r.reservation_date.isoformat() if r.reservation_date else None,
            "time_slot": act.time_slot,
        }
        for r, act in filas
    ]


def get_my_plans(user_id: int, db: Session):
    """Devuelve las suscripciones del usuario. Cada una es un token de un solo uso.

    Los tokens NO vencen: el estado depende de si se usó o no, nunca de la fecha. Por eso
    no hay estado "vencida" y las fechas quedan solo como registro de la compra.
    """
    from app.utils.subscriptions import (
        count_subscription_classes_used, is_token_usado, MAX_SUBSCRIPTION_FIXED_CLASSES,
    )

    planes = (
        db.query(UserPlan)
        .filter(UserPlan.user_id == user_id)
        .order_by(UserPlan.start_date.desc())
        .all()
    )

    resultado = []
    for up in planes:
        usadas = count_subscription_classes_used(up.id, db)
        if up.status == "cancelled":
            estado = "cancelled"
        elif is_token_usado(up.id, db):
            estado = "used"
        else:
            estado = "available"

        resultado.append({
            "id": up.id,
            "plan_name": up.plan.name,
            "specialization": up.specialization,
            "start_date": str(up.start_date),
            "status": estado,
            "classes_used": usadas,
            "classes_max": MAX_SUBSCRIPTION_FIXED_CLASSES,
            # Clases que realmente hay para anotarse con este token. Si la especialidad
            # no tiene actividades es 0: el token queda sin poder usarse y no hay que
            # decirle al cliente que puede anotarse a 4.
            "enrollable_fixed_classes": (
                _contar_clases_fijas_anotables(user_id, up.specialization, MAX_SUBSCRIPTION_FIXED_CLASSES, db)
                if estado == "available" else 0
            ),
            # Clases que le dio el token: qué actividad y qué días. Solo hay algo que
            # mostrar si ya lo usó.
            "enrolled_classes": _clases_del_token(up.id, db) if estado == "used" else [],
        })
    return resultado


# ── Simulación Mercado Pago ───────────────────────────────────────────────────

def simulate_mercadopago_payment(plan_id: int, specialization: str, test_scenario: str, user_id: int, db: Session):
    """
    Simula el flujo de pago con Mercado Pago.
    test_scenario:
      - "success"            → E1: conexión OK, saldo suficiente → pago aprobado + crea UserPlan
      - "insufficient_funds" → E2: conexión OK, saldo insuficiente → pago rechazado
      - "connection_error"   → E3: falla de conexión con el banco → error de conexión
    """
    from app.utils.subscriptions import find_active_plan_for_specialization, get_age_discount_percent
    from app.exceptions.http_exceptions import medical_certificate_not_approved_exception

    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.status == "active").first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado o inactivo.")
    user = db.query(User).filter(User.id == user_id).first()

    # Regla de negocio: sin apto físico aprobado el cliente no puede suscribirse a
    # ningún plan (misma restricción que para inscribirse a actividades).
    if not user or user.medical_certificate_status != "approved":
        raise medical_certificate_not_approved_exception()

    # Un token sin usar por especialidad: hasta gastarlo no se puede comprar otro de la
    # misma. require_capacity=True es lo que mira que el token siga entero; sin eso
    # bloquearía también a quien ya lo gastó y quiere volver a comprar.
    if find_active_plan_for_specialization(user_id, specialization, db, require_capacity=True):
        raise HTTPException(
            status_code=400,
            detail=f"Ya tenés una suscripción sin usar en la especialidad '{specialization}'. Usala antes de comprar otra.",
        )

    if test_scenario == "success":
        hoy = date.today()

        # Descuentos disponibles (no acumulativos: se aplica el mayor):
        #  - por cancelación previa: beneficio pendiente del abonado (pending_discount_percent)
        #  - por edad: 20% para clientes de 65 años o más
        descuento_pendiente = (user.pending_discount_percent or 0) if user else 0
        motivo_pendiente = (user.pending_discount_reason if user else None) or "cancelacion"
        descuento_edad = get_age_discount_percent(user, hoy)
        descuento = max(descuento_pendiente, descuento_edad)
        # El descuento por edad es la razón aplicada solo si es estrictamente el mayor;
        # si el pendiente empata o supera, ese es el que se consume.
        descuento_por_edad_aplicado = descuento_edad > descuento_pendiente
        precio_final = float(plan.price) * (1 - descuento / 100) if descuento else float(plan.price)

        # Crear (o renovar) el UserPlan del usuario
        user_plan = UserPlan(
            user_id=user_id,
            plan_id=plan.id,
            specialization=specialization,
            start_date=hoy,
            end_date=hoy + timedelta(days=plan.duration_days),
            status="active",
        )
        db.add(user_plan)
        # El beneficio pendiente se consume solo si fue el descuento aplicado; si se
        # aplicó el de edad (mayor), el cliente lo conserva.
        if descuento and user and not descuento_por_edad_aplicado:
            user.pending_discount_percent = 0
            user.pending_discount_reason = None
        register_audit(
            db=db,
            user_id=user_id,
            type=AuditType.PAYMENT,
            action=AuditAction.SUBSCRIPTION,
            result=AuditResult.SUCCESS,
            detail=f"Pago aprobado para el usuario {user.name} {user.lastname}, plan '{plan.name}' en {specialization}. Precio final: ${precio_final:.2f}.",
        )
        db.commit()

        if descuento_por_edad_aplicado:
            motivo_descuento = "por ser adulto mayor (65 años o más)"
        elif motivo_pendiente == "mes_corto":
            motivo_descuento = "porque tu plan anterior cubrió un mes con menos clases"
        else:
            motivo_descuento = "por cancelación previa"

        # Notificar al cliente (sistema + mail) que su suscripción quedó confirmada
        try:
            from app.utils.notifications import notify_subscription_confirmed
            notify_subscription_confirmed(
                user_id=user_id,
                plan_name=plan.name,
                specialization=specialization,
                end_date=user_plan.end_date,
                price_paid=precio_final,
                discount_percent=descuento,
                discount_reason=motivo_descuento,
                db=db,
            )
        except Exception:
            # La confirmación del pago no debe fallar si la notificación no se pudo enviar.
            pass

        mensaje = f"Pago aprobado. Te suscribiste al plan '{plan.name}' en {specialization}."
        if descuento:
            mensaje += f" Se aplicó un {descuento}% de descuento {motivo_descuento} (pagaste ${precio_final:.2f} en lugar de ${float(plan.price):.2f})."

        return {
            "success": True,
            "message": mensaje,
            "transaction_id": str(uuid.uuid4()),
            "status": "approved",
            "price_paid": precio_final,
            "discount_applied": descuento,
        }
    elif test_scenario == "insufficient_funds":
        register_audit(
            db=db,
            user_id=user_id,
            type=AuditType.PAYMENT,
            action=AuditAction.SUBSCRIPTION,
            result=AuditResult.ERROR,
            detail=f"Pago rechazado por fondos insuficientes para el usuario {user.name} {user.lastname}, plan '{plan.name}' en {specialization}.",
        )
        db.commit()
        return {
            "success": False,
            "message": "Pago rechazado: fondos insuficientes en la cuenta.",
            "transaction_id": None,
            "status": "rejected",
        }
    elif test_scenario == "connection_error":
        raise HTTPException(
            status_code=503,
            detail="Error de conexión con el servidor del banco. Intente nuevamente.",
        )
    else:
        raise HTTPException(status_code=400, detail="Escenario de prueba no válido.")

