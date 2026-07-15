# Responsable: Francis - Logica de negocio de reservas
# HU: Inscribirse a actividad fija / Inscribirse a actividad individual
from threading import Thread
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.reservation import Reservation
from app.models.user import User
from app.models.activity import Activity
from app.exceptions.http_exceptions import user_not_found_exception, medical_certificate_not_approved_exception
from app.utils.credits import get_monthly_balance, spend_credit, grant_credit, was_paid_with_credit
from database.connection import SessionLocal

from app.models.audit_log import AuditType, AuditAction, AuditResult
from app.services.servicio_auditoria import register_audit

# Crea una nueva reserva para un usuario en una actividad.
# payment_method: subscription | full_payment | partial_payment | credit
# Reglas de negocio (HU actividad fija/individual):
#   - subscription, full_payment, credit  -> confirmada + pago completado
#   - partial_payment (sena 50-100%)      -> pendiente  + pago parcial
def create_reservation(user_id: int, activity_id: int, reservation_type: str,
                       reservation_date: datetime, db: Session,
                       payment_method: str = "full_payment",
                       test_scenario: str = "success",
                       deposit_percent: int = None):
    user = db.query(User).filter(User.id == user_id).first()
    activity = db.query(Activity).filter(Activity.id == activity_id).first()

    if not user:
        raise user_not_found_exception()

    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # Regla de negocio: sin apto físico aprobado el cliente no puede inscribirse a
    # ninguna actividad.
    if user.medical_certificate_status != "approved":
        raise medical_certificate_not_approved_exception()

    if reservation_type not in ("fixed", "individual"):
        raise HTTPException(status_code=400,
                            detail="El tipo de reserva debe ser 'fixed' o 'individual'")

    valid_methods = ("subscription", "full_payment", "partial_payment", "credit")
    if payment_method not in valid_methods:
        raise HTTPException(status_code=400,
                            detail=f"Metodo de pago invalido. Debe ser uno de: {', '.join(valid_methods)}")

    # Validar disponibilidad de crédito (el descuento se registra luego de crear la reserva)
    if payment_method == "credit":
        if get_monthly_balance(user_id, db) <= 0:
            raise HTTPException(status_code=400, detail="No tenés créditos disponibles para usar este mes.")

    # Validar disponibilidad de cupo en la suscripción (máximo 4 clases fijas por plan)
    user_plan_usado = None
    if payment_method == "subscription":
        from app.utils.subscriptions import find_active_plan_for_specialization, MAX_SUBSCRIPTION_FIXED_CLASSES
        if reservation_type != "fixed":
            raise HTTPException(status_code=400, detail="La suscripción solo aplica a clases fijas.")
        user_plan_usado = find_active_plan_for_specialization(user_id, activity.specialization, db, require_capacity=True)
        if not user_plan_usado:
            raise HTTPException(
                status_code=400,
                detail=f"No tenés cupo disponible en tu suscripción para esta especialidad (máximo {MAX_SUBSCRIPTION_FIXED_CLASSES} clases fijas por plan).",
            )

    # % efectivamente abonado (solo relevante para pagos monetarios; se usa luego para
    # calcular el reintegro exacto si el cliente cancela)
    deposit_percent_val = None
    if payment_method == "full_payment":
        deposit_percent_val = 100
    elif payment_method == "partial_payment":
        deposit_percent_val = deposit_percent if deposit_percent is not None else 50
        if not (50 <= deposit_percent_val <= 100):
            raise HTTPException(status_code=400, detail="La seña debe ser un porcentaje entre 50 y 100.")

    # Simulación Mercado Pago para pagos monetarios (full y partial)
    if payment_method in ("full_payment", "partial_payment"):
        escenario = test_scenario or "success"
        if escenario == "insufficient_funds":
            register_audit(
                db=db,
                user_id=user_id,
                type=AuditType.PAYMENT,
                action=AuditAction.INDIVIDUAL,
                result=AuditResult.ERROR,
                detail=f"Pago rechazado por fondos insuficientes para el usuario {user.name} {user.lastname} para la actividad {activity.name} (id {activity.id})."
            )
            db.commit()
            raise HTTPException(status_code=402, detail="Pago rechazado: fondos insuficientes en la cuenta.")
        elif escenario == "connection_error":
            raise HTTPException(status_code=503, detail="Error de conexión con el servidor del banco. Intentá nuevamente.")
        # escenario == "success" → continuar normalmente

    # Estado de la reserva segun metodo de pago
    if payment_method in ("subscription", "full_payment", "credit"):
        status = "confirmed"
        payment_status_val = "completed"
    else:  # partial_payment (sena)
        status = "pending"
        payment_status_val = "partial"

    if payment_method in ("full_payment", "partial_payment"):
        total = activity.price * deposit_percent_val / 100
        register_audit(
            db=db,
            user_id=user_id,
            type=AuditType.PAYMENT,
            action=AuditAction.INDIVIDUAL,
            result=AuditResult.SUCCESS,
            detail=f"Usuario {user.name} {user.lastname} pagó una reserva para la actividad {activity.name} (id {activity.id}). Pago: ${total:.2f}."
        )

    new_reservation = Reservation(
        user_id=user_id,
        activity_id=activity_id,
        reservation_type=reservation_type,
        status=status,
        payment_status=payment_status_val,
        reservation_date=reservation_date,
        deposit_percent=deposit_percent_val,
        user_plan_id=user_plan_usado.id if user_plan_usado else None,
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    if payment_method == "credit":
        spend_credit(user_id, db, reservation_id=new_reservation.id)

    uid_copia = new_reservation.user_id
    aid_copia = new_reservation.activity_id

    def _notif_async(uid: int, aid: int) -> None:
        from app.utils.notifications import notify_reservation_created
        db_n = SessionLocal()
        try:
            notify_reservation_created(uid, aid, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(uid_copia, aid_copia), daemon=True).start()

    return {
        "id": new_reservation.id,
        "user_id": new_reservation.user_id,
        "activity_id": new_reservation.activity_id,
        "reservation_type": new_reservation.reservation_type,
        "status": new_reservation.status,
        "payment_status": new_reservation.payment_status,
        "reservation_date": new_reservation.reservation_date,
        "created_at": new_reservation.created_at,
        "deposit_percent": new_reservation.deposit_percent,
    }


# Obtiene todas las reservas de un usuario
def get_user_reservations(user_id: int, db: Session):
    """Obtiene todas las reservas activas de un usuario"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise user_not_found_exception()
    
    reservations = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.status != "cancelled"
    ).all()
    
    return reservations


# HU: Ver mis reservas - devuelve reservas activas con datos de la actividad
def get_user_reservations_enriched(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise user_not_found_exception()

    rows = (
        db.query(Reservation, Activity)
        .join(Activity, Reservation.activity_id == Activity.id)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status != "cancelled",
        )
        .all()
    )

    result = []
    for reservation, activity in rows:
        result.append({
            "id": reservation.id,
            "activity_id": activity.id,
            "activity_name": activity.name,
            "activity_type": activity.activity_type,
            "schedule": activity.schedule,
            "specific_date": str(activity.specific_date) if activity.specific_date else None,
            "time_slot": activity.time_slot,
            "reservation_type": reservation.reservation_type,
            "status": reservation.status,
            "payment_status": reservation.payment_status,
            "deposit_percent": reservation.deposit_percent,
            "reservation_date": reservation.reservation_date,
            "created_at": reservation.created_at,
        })
    return result
def get_reservation_by_id(reservation_id: int, db: Session):
    """Obtiene una reserva por ID"""
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    
    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada"
        )
    
    return reservation


# Cancela una reserva (stub simple, sin lógica de negocio)
def cancel_reservation(reservation_id: int, db: Session):
    """Cancela una reserva existente (sin aplicar políticas)"""
    reservation = get_reservation_by_id(reservation_id, db)

    if reservation.status == "cancelled":
        raise HTTPException(status_code=400, detail="La reserva ya ha sido cancelada")

    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    return reservation


# HU: Cancelar turno — aplica reglas de negocio según tipo de cliente y anticipación
def cancel_reservation_with_policy(reservation_id: int, user_id: int, db: Session):
    """
    Cancela una reserva aplicando la política según:
    - si el cliente es abonado o no
    - cuántas horas faltan para la clase
    - cantidad de cancelaciones en la franja 24-48h ya registradas en el mes (solo abonados)

    Resultados posibles:
      credit           → abonado + > 48 h (sujeto a tope mensual de 3 créditos)
      discount_20      → abonado + 24-48 h, 1ra vez en el mes → 20% para el próximo pago de suscripción
      discount_30      → abonado + 24-48 h, 2da vez en el mes → 30% TOTAL (no acumulativo) para el próximo pago
      no_benefit       → abonado + < 24 h  | abonado + 24-48h y 3ra vez en el mes (pierde el beneficio)
      deposit_returned → no abonado + > 24 h → se reintegra el % exacto abonado (seña o total)
      no_refund        → no abonado + ≤ 24 h → pierde la seña, sin reintegro
    """
    from datetime import datetime, date as date_cls
    from app.utils.subscriptions import is_abonado, find_active_plan_for_specialization
    from app.models.user_plan import UserPlan

    reservation = get_reservation_by_id(reservation_id, db)

    if reservation.user_id != user_id:
        raise HTTPException(status_code=403, detail="No tenés permiso para cancelar esta reserva")

    if reservation.status == "cancelled":
        raise HTTPException(status_code=400, detail="La reserva ya fue cancelada")

    now = datetime.now()
    class_start = reservation.reservation_date

    # Escenario 6: clase ya comenzó o finalizó
    if class_start <= now:
        raise HTTPException(status_code=400, detail="No se puede cancelar: la clase está en curso o ya finalizó")

    hours_until = (class_start - now).total_seconds() / 3600

    abonado = is_abonado(user_id, db)
    user = db.query(User).filter(User.id == user_id).first()
    activity = db.query(Activity).filter(Activity.id == reservation.activity_id).first()
    plan = None
    if abonado:
        # El usuario puede tener varios planes activos: se usa el que efectivamente
        # pagó esta reserva y, si no aplicó suscripción, el que coincide con la
        # especialidad de la actividad (si existe).
        if reservation.user_plan_id:
            plan = db.query(UserPlan).filter(UserPlan.id == reservation.user_plan_id).first()
        if not plan:
            plan = find_active_plan_for_specialization(user_id, activity.specialization, db)

    # Contar cancelaciones en la franja 24-48h ya registradas este mes (solo abonados)
    today = date_cls.today()
    inicio_mes = datetime(today.year, today.month, 1)
    discount_band_count = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.cancellation_result.in_(["discount_20", "discount_30"]),
        Reservation.updated_at >= inicio_mes,
    ).count()

    # ── Reglas de negocio ──────────────────────────────────────────────────────
    if abonado and plan and plan.specialization == activity.specialization:
        if hours_until > 48:
            if was_paid_with_credit(reservation.id, db):
                result = "no_benefit"
                message = "Turno cancelado. No se otorga crédito: esta clase fue reservada usando un crédito."
            else:
                actividad = db.query(Activity).filter(Activity.id == reservation.activity_id).first()
                otorgado = grant_credit(
                    user_id, db,
                    activity_type=actividad.specialization if actividad else None,
                    reservation_id=reservation.id,
                    reason="cancellation_48h",
                )
                if otorgado:
                    result = "credit"
                    message = "Turno cancelado. Se te otorgó un crédito para tu próxima clase."
                else:
                    result = "no_benefit"
                    message = "Turno cancelado. Ya alcanzaste el límite de 3 créditos este mes."
        elif hours_until >= 24:
            if discount_band_count == 0:
                result = "discount_20"
                message = "Turno cancelado. Tendrás un 20% de descuento en el pago de tu próxima suscripción mensual."
                user.pending_discount_percent = 20
            elif discount_band_count == 1:
                result = "discount_30"
                message = "Turno cancelado. Tendrás un 30% de descuento (total, no acumulativo) en el pago de tu próxima suscripción mensual."
                user.pending_discount_percent = 30
            else:
                result = "no_benefit"
                message = "Turno cancelado. Perdiste el beneficio de descuento por cancelaciones repetidas este mes."
                user.pending_discount_percent = 0
        else:
            result = "no_benefit"
            message = "Turno cancelado. No recibís crédito ni devolución: cancelaste con menos de 24 hs de anticipación."
    else:
        percent = reservation.deposit_percent or 100
        if hours_until > 24:
            total_refund = activity.price * percent / 100
            register_audit(
                db=db,
                user_id=user_id,
                type=AuditType.PAYMENT,
                action=AuditAction.REFUND,
                result=AuditResult.SUCCESS,
                detail=f"Se hace un reintegro a {user.name} {user.lastname} de la actividad {activity.name} (id {activity.id}) de {total_refund:.2f}.",
            )
            result = "deposit_returned"
            message = f"Turno cancelado. Se te reintegra el {percent}% que habías abonado."
        else:
            result = "no_refund"
            message = "Turno cancelado. No se reintegra lo abonado: cancelaste con menos de 24 hs de anticipación."

    reservation.status = "cancelled"
    reservation.cancellation_result = result
    db.commit()
    db.refresh(reservation)

    from app.services.servicio_lista_espera import promote_next_waitlist_entry
    nueva_reserva = promote_next_waitlist_entry(reservation.activity_id, db)
    if nueva_reserva:
        uid_promovido = nueva_reserva.user_id
        aid_promovido = nueva_reserva.activity_id

        def _notif_async(uid: int, aid: int) -> None:
            from app.utils.notifications import notify_waitlist_promoted
            db_n = SessionLocal()
            try:
                notify_waitlist_promoted(uid, aid, db_n)
            except Exception:
                pass
            finally:
                db_n.close()

        Thread(target=_notif_async, args=(uid_promovido, aid_promovido), daemon=True).start()

    return {
        "id": reservation.id,
        "result": result,
        "message": message,
        "hours_until_class": round(hours_until, 1),
    }


# Actualiza el estado de pago de una reserva
def update_reservation_payment_status(reservation_id: int, payment_status: str, db: Session):
    """Actualiza el estado de pago de una reserva"""
    reservation = get_reservation_by_id(reservation_id, db)
    
    valid_statuses = ["pending", "partial", "completed"]
    if payment_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Estado de pago debe ser uno de: {', '.join(valid_statuses)}"
        )
    
    reservation.payment_status = payment_status
    db.commit()
    db.refresh(reservation)
    
    return reservation


# Confirma una reserva (después de realizar el pago)
def confirm_reservation(reservation_id: int, db: Session):
    """Confirma una reserva después del pago"""
    reservation = get_reservation_by_id(reservation_id, db)
    
    if reservation.payment_status != "completed":
        raise HTTPException(
            status_code=400,
            detail="No se puede confirmar una reserva sin pago completo"
        )
    
    reservation.status = "confirmed"
    db.commit()
    db.refresh(reservation)
    
    return reservation


def check_subscription_availability(user_id: int, activity_id: int, db: Session):
    """
    Verifica si el usuario puede inscribirse a una actividad usando su suscripción activa.
    Un plan es mensual (30 días) e incluye como máximo MAX_SUBSCRIPTION_FIXED_CLASSES
    clases fijas de su especialidad; el usuario puede tener varios planes activos.
    Retorna:
    {
        "can_use_subscription": bool,
        "has_age_discount": bool,  # >65 años
        "plan_specialization": str,  # especialidad del plan encontrado (con o sin cupo)
        "activity_specialization": str,  # especialidad de la actividad
        "classes_used": int | None,
        "classes_max": int,
        "classes_remaining": int | None,
    }
    """
    from datetime import date as date_cls
    from app.utils.subscriptions import (
        find_active_plan_for_specialization,
        count_subscription_classes_used,
        MAX_SUBSCRIPTION_FIXED_CLASSES,
    )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise user_not_found_exception()

    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # Verificar edad del usuario (>65 años)
    today = date_cls.today()
    if user.birth_date:
        age = today.year - user.birth_date.year - ((today.month, today.day) < (user.birth_date.month, user.birth_date.day))
        has_age_discount = age > 65
    else:
        has_age_discount = False

    can_use_subscription = False
    plan_specialization = None
    classes_used = None
    classes_remaining = None

    if activity.activity_type == "fixed":
        plan_con_cupo = find_active_plan_for_specialization(user_id, activity.specialization, db, require_capacity=True)
        if plan_con_cupo:
            plan_specialization = plan_con_cupo.specialization
            classes_used = count_subscription_classes_used(plan_con_cupo.id, db)
            classes_remaining = MAX_SUBSCRIPTION_FIXED_CLASSES - classes_used
            can_use_subscription = True
        else:
            # Puede tener un plan de esa especialidad pero sin cupo restante
            plan_sin_cupo = find_active_plan_for_specialization(user_id, activity.specialization, db, require_capacity=False)
            if plan_sin_cupo:
                plan_specialization = plan_sin_cupo.specialization
                classes_used = count_subscription_classes_used(plan_sin_cupo.id, db)
                classes_remaining = 0

    return {
        "can_use_subscription": can_use_subscription,
        "has_age_discount": has_age_discount,
        "plan_specialization": plan_specialization,
        "activity_specialization": activity.specialization,
        "classes_used": classes_used,
        "classes_max": MAX_SUBSCRIPTION_FIXED_CLASSES,
        "classes_remaining": classes_remaining,
    }
