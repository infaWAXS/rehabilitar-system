# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
import uuid
from datetime import date, timedelta
from sqlalchemy.orm import Session
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

def get_my_plans(user_id: int, db: Session):
    """Devuelve todas las suscripciones (activas, vencidas o canceladas) del usuario,
    con la cantidad de clases fijas ya usadas de las 4 incluidas en cada plan."""
    from app.utils.subscriptions import count_subscription_classes_used, MAX_SUBSCRIPTION_FIXED_CLASSES

    hoy = date.today()
    planes = (
        db.query(UserPlan)
        .filter(UserPlan.user_id == user_id)
        .order_by(UserPlan.start_date.desc())
        .all()
    )

    resultado = []
    for up in planes:
        if up.status == "cancelled":
            estado = "cancelled"
        elif up.end_date < hoy:
            estado = "expired"
        else:
            estado = "active"

        usadas = count_subscription_classes_used(up.id, db)
        resultado.append({
            "id": up.id,
            "plan_name": up.plan.name,
            "specialization": up.specialization,
            "start_date": str(up.start_date),
            "end_date": str(up.end_date),
            "status": estado,
            "classes_used": usadas,
            "classes_max": MAX_SUBSCRIPTION_FIXED_CLASSES,
            "classes_remaining": max(0, MAX_SUBSCRIPTION_FIXED_CLASSES - usadas),
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

    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.status == "active").first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado o inactivo.")
    user = db.query(User).filter(User.id == user_id).first()

    # No permitir adquirir un plan en una especialidad en la que ya se tiene una suscripción activa.
    if find_active_plan_for_specialization(user_id, specialization, db):
        raise HTTPException(
            status_code=400,
            detail=f"Ya tenés una suscripción activa en la especialidad '{specialization}'.",
        )

    if test_scenario == "success":
        hoy = date.today()

        # Descuentos disponibles (no acumulativos: se aplica el mayor):
        #  - por cancelación previa: beneficio pendiente del abonado (pending_discount_percent)
        #  - por edad: 20% para clientes de 65 años o más
        descuento_cancelacion = (user.pending_discount_percent or 0) if user else 0
        descuento_edad = get_age_discount_percent(user, hoy)
        descuento = max(descuento_cancelacion, descuento_edad)
        # El descuento por edad es la razón aplicada solo si es estrictamente el mayor;
        # si el de cancelación empata o supera, ese es el que se consume.
        descuento_por_edad_aplicado = descuento_edad > descuento_cancelacion
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
        # El beneficio pendiente por cancelación se consume solo si fue el descuento
        # aplicado; si se aplicó el de edad (mayor), el cliente lo conserva.
        if descuento and user and not descuento_por_edad_aplicado:
            user.pending_discount_percent = 0
        register_audit(
            db=db,
            user_id=user_id,
            type=AuditType.PAYMENT,
            action=AuditAction.SUBSCRIPTION,
            result=AuditResult.SUCCESS,
            detail=f"Pago aprobado para el usuario {user.name} {user.lastname}, plan '{plan.name}' en {specialization}. Precio final: ${precio_final:.2f}.",
        )
        db.commit()

        motivo_descuento = "por ser adulto mayor (65 años o más)" if descuento_por_edad_aplicado else "por cancelación previa"

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

