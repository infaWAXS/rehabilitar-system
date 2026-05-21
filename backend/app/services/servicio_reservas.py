# Responsable: Francis - Logica de negocio de reservas
# HU: Inscribirse a actividad fija / Inscribirse a actividad individual
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.reservation import Reservation
from app.models.user import User
from app.exceptions.http_exceptions import user_not_found_exception


# Crea una nueva reserva para un usuario en una actividad.
# payment_method: subscription | full_payment | partial_payment | credit
# Reglas de negocio (HU actividad fija/individual):
#   - subscription, full_payment, credit  -> confirmada + pago completado
#   - partial_payment (sena 50%)          -> pendiente  + pago parcial
def create_reservation(user_id: int, activity_id: int, reservation_type: str,
                       reservation_date: datetime, db: Session,
                       payment_method: str = "full_payment"):
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

    return new_reservation


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


# Obtiene una reserva específica
def get_reservation_by_id(reservation_id: int, db: Session):
    """Obtiene una reserva por ID"""
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    
    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada"
        )
    
    return reservation


# Cancela una reserva
def cancel_reservation(reservation_id: int, db: Session):
    """Cancela una reserva existente"""
    reservation = get_reservation_by_id(reservation_id, db)
    
    if reservation.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="La reserva ya ha sido cancelada"
        )
    
    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    
    return reservation


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
