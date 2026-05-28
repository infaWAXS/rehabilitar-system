# Responsable: Francis - Logica de negocio de reservas
# HU: Inscribirse a actividad fija / Inscribirse a actividad individual
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.reservation import Reservation
from app.models.user import User
from app.models.activity import Activity
from app.exceptions.http_exceptions import user_not_found_exception


# Crea una nueva reserva para un usuario en una actividad.
# payment_method: subscription | full_payment | partial_payment | credit
# Reglas de negocio (HU actividad fija/individual):
#   - subscription, full_payment, credit  -> confirmada + pago completado
#   - partial_payment (sena 50%)          -> pendiente  + pago parcial
def create_reservation(user_id: int, activity_id: int, reservation_type: str,
                       reservation_date: datetime, db: Session,
                       payment_method: str = "full_payment",
                       test_scenario: str = "success"):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise user_not_found_exception()

    if reservation_type not in ("fixed", "individual"):
        raise HTTPException(status_code=400,
                            detail="El tipo de reserva debe ser 'fixed' o 'individual'")

    valid_methods = ("subscription", "full_payment", "partial_payment", "credit")
    if payment_method not in valid_methods:
        raise HTTPException(status_code=400,
                            detail=f"Metodo de pago invalido. Debe ser uno de: {', '.join(valid_methods)}")

    # Validar y descontar crédito si corresponde
    if payment_method == "credit":
        if user.credits <= 0:
            raise HTTPException(status_code=400, detail="No tenés créditos disponibles para usar.")
        user.credits -= 1

    # Consumir descuento pendiente por cancelación (solo pagos monetarios)
    discount_applied = 0
    if payment_method in ("full_payment", "partial_payment"):
        if user.pending_discount_percent > 0:
            discount_applied = user.pending_discount_percent
            user.pending_discount_percent = 0

    # Simulación Mercado Pago para pagos monetarios (full y partial)
    if payment_method in ("full_payment", "partial_payment"):
        escenario = test_scenario or "success"
        if escenario == "insufficient_funds":
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

    new_reservation = Reservation(
        user_id=user_id,
        activity_id=activity_id,
        reservation_type=reservation_type,
        status=status,
        payment_status=payment_status_val,
        reservation_date=reservation_date
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    return {
        "id": new_reservation.id,
        "user_id": new_reservation.user_id,
        "activity_id": new_reservation.activity_id,
        "reservation_type": new_reservation.reservation_type,
        "status": new_reservation.status,
        "payment_status": new_reservation.payment_status,
        "reservation_date": new_reservation.reservation_date,
        "created_at": new_reservation.created_at,
        "discount_applied": discount_applied,
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
    - cantidad de cancelaciones previas en el mes (solo para abonados en franja 24-48h)

    Resultados posibles:
      credit           → abonado + > 48 h
      discount_30      → abonado + 24-48 h, primera cancelación del mes
      discount_20      → abonado + 24-48 h, segunda cancelación del mes
      no_benefit       → abonado + < 24 h  | abonado + ≥ 3 cancelaciones del mes
      deposit_returned → no abonado + > 24 h
      no_refund        → no abonado + ≤ 24 h
    """
    from datetime import datetime, date as date_cls
    from app.utils.subscriptions import is_abonado

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

    # Contar cancelaciones previas del mes actual (para abonados en franja 24-48 h)
    today = date_cls.today()
    inicio_mes = datetime(today.year, today.month, 1)
    prev_cancellations = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.status == "cancelled",
        Reservation.updated_at >= inicio_mes,
    ).count()

    # ── Reglas de negocio ──────────────────────────────────────────────────────
    if abonado:
        if hours_until > 48:
            result = "credit"
            message = "Turno cancelado. Se te otorgó un crédito para tu próxima clase."
            user.credits += 1
        elif hours_until >= 24:
            if prev_cancellations == 0:
                result = "discount_30"
                message = "Turno cancelado. Tendrás un 30 % de descuento en tu próximo pago monetario."
                user.pending_discount_percent = max(user.pending_discount_percent or 0, 30)
            elif prev_cancellations == 1:
                result = "discount_20"
                message = "Turno cancelado. Tendrás un 20 % de descuento en tu próximo pago monetario."
                user.pending_discount_percent = max(user.pending_discount_percent or 0, 20)
            else:
                result = "no_benefit"
                message = "Turno cancelado. No aplica descuento (ya cancelaste 2 o más veces este mes)."
        else:
            result = "no_benefit"
            message = "Turno cancelado. No aplica devolución: cancelaste con menos de 24 hs de anticipación."
    else:
        if hours_until > 24:
            result = "deposit_returned"
            message = "Turno cancelado. Se te devuelve la seña."
        else:
            result = "no_refund"
            message = "Turno cancelado. No se devuelve la seña: cancelaste con menos de 24 hs de anticipación."

    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)

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
