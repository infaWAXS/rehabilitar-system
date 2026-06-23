# Responsable: Francis
# HU: Inscribirse a actividad fija / Inscribirse a actividad individual
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from app.models.reservation import Reservation
from app.schemas.esquema_reservas import ReservationCreate, ReservationResponse, ReservationUpdate, ReservationConActividad
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.services.servicio_reservas import (
    create_reservation,
    get_user_reservations,
    get_user_reservations_enriched,
    get_reservation_by_id,
    cancel_reservation,
    cancel_reservation_with_policy,
    update_reservation_payment_status,
    confirm_reservation,
    check_subscription_availability,
)

router = APIRouter(prefix="/reservations", tags=["Reservas"])


# Verificar opciones de inscripción disponibles (HU: Inscribirse a actividad)
@router.get("/activity/{activity_id}/inscription-options")
def get_inscription_options(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna las opciones de inscripción disponibles para una actividad.
    - can_use_subscription: si el usuario puede usar su suscripción activa
    - has_age_discount: si el usuario tiene >65 años (descuento automático)
    - plan_specialization: especialidad del plan del usuario
    - activity_specialization: especialidad de la actividad
    """
    return check_subscription_availability(current_user.id, activity_id, db)


# Crear una nueva reserva
@router.post("", response_model=ReservationResponse)
def create_new_reservation(
    request: ReservationCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_reservation(
        current_user.id, 
        request.activity_id,
        request.reservation_type,
        request.reservation_date,
        db
    )


# Crear reserva para actividad fija (HU: Inscribirse a actividad fija)
@router.post("/fixed", response_model=ReservationResponse)
def inscribe_fixed_activity(
    request: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_reservation(
        current_user.id,
        request.activity_id,
        "fixed",
        request.reservation_date,
        db,
        request.payment_method or "full_payment",
        request.test_scenario or "success",
        request.deposit_percent,
    )


# Crear reserva para actividad individual (HU: Inscribirse a actividad individual)
@router.post("/individual", response_model=ReservationResponse)
def inscribe_individual_activity(
    request: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_reservation(
        current_user.id,
        request.activity_id,
        "individual",
        request.reservation_date,
        db,
        request.payment_method or "full_payment",
        request.test_scenario or "success",
        request.deposit_percent,
    )


# HU: Ver mis reservas (Ezequiel)
@router.get("/me", response_model=list[ReservationConActividad])
def get_my_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_reservations_enriched(current_user.id, db)


# Obtener reserva específica
@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = get_reservation_by_id(reservation_id, db)
    
    # Verificar que el usuario sea el propietario o admin
    if reservation.user_id != current_user.id and current_user.role != "admin":
        from app.exceptions.http_exceptions import forbidden_exception
        raise forbidden_exception()
    
    return reservation


# HU: Cancelar turno — aplica políticas según tipo de cliente y anticipación
@router.put("/{reservation_id}/cancel")
def cancel_user_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return cancel_reservation_with_policy(reservation_id, current_user.id, db)


# Actualizar estado de pago
@router.put("/{reservation_id}/payment", response_model=ReservationResponse)
def update_payment_status(
    reservation_id: int,
    request: ReservationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = get_reservation_by_id(reservation_id, db)
    
    # Solo admin puede actualizar pagos
    if current_user.role != "admin":
        from app.exceptions.http_exceptions import forbidden_exception
        raise forbidden_exception()
    
    return update_reservation_payment_status(reservation_id, request.payment_status, db)


# Confirmar reserva
@router.put("/{reservation_id}/confirm", response_model=ReservationResponse)
def confirm_user_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = get_reservation_by_id(reservation_id, db)
    
    # Verificar que el usuario sea el propietario o admin
    if reservation.user_id != current_user.id and current_user.role != "admin":
        from app.exceptions.http_exceptions import forbidden_exception
        raise forbidden_exception()
    
    return confirm_reservation(reservation_id, db)


@router.get("/health", tags=["Health"])
def reservations_module_health():
    return {"module": "reservations", "status": "ready"}

