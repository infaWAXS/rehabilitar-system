# Responsable: Francis - Esquemas de Reservas y Lista de Espera
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


# ===== SCHEMAS DE RESERVAS =====

class ReservationCreate(BaseModel):
    """Esquema para crear una reserva"""
    activity_id: int
    reservation_type: str  # "fixed" o "individual"
    reservation_date: datetime
    payment_method: Optional[str] = "full_payment"  # subscription | full_payment | partial_payment | credit
    test_scenario: Optional[str] = "success"        # Simulación MP: success | insufficient_funds | connection_error
    deposit_percent: Optional[int] = None           # % a abonar (50-100), solo aplica a partial_payment


class ReservationUpdate(BaseModel):
    """Esquema para actualizar una reserva"""
    status: Optional[str] = None
    payment_status: Optional[str] = None


class ReservationResponse(BaseModel):
    """Esquema de respuesta de reserva"""
    id: int
    user_id: int
    activity_id: int
    reservation_type: str
    status: str
    payment_status: str
    reservation_date: datetime
    created_at: datetime
    deposit_percent: Optional[int] = None  # % abonado al reservar (solo full/partial payment)

    # Inscripción por suscripción a una clase fija: el plan cubre el mes, así que anota
    # también al resto de las clases del mes. Vacío/1 en el resto de los métodos de pago.
    month_enrolled_count: int = 1                      # clases anotadas, incluida la elegida
    month_enrolled_dates: List[str] = []               # fechas del resto del mes que se reservaron
    month_waitlisted_dates: List[str] = []             # las que estaban llenas y fueron a lista de espera
    month_skipped_dates: List[str] = []                # las que no entraron (tope del plan)

    class Config:
        from_attributes = True


class ReservationConActividad(BaseModel):
    """Respuesta enriquecida de reserva con datos de la actividad"""
    id: int
    activity_id: int
    activity_name: str
    activity_type: str
    schedule: Optional[str] = None
    specific_date: Optional[str] = None
    time_slot: Optional[str] = None
    reservation_type: str
    status: str
    payment_status: str
    deposit_percent: Optional[int] = None
    reservation_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ===== SCHEMAS DE LISTA DE ESPERA =====

class WaitlistCreate(BaseModel):
    """Esquema para añadir a lista de espera"""
    activity_id: int
    # % que abona el cliente para reservar su lugar en la cola (50-100). El abonado no
    # paga y lo manda vacío; al no abonado el backend se lo exige.
    deposit_percent: Optional[int] = None


class WaitlistResponse(BaseModel):
    """Esquema de respuesta de lista de espera"""
    id: int
    user_id: int
    activity_id: int
    status: str
    position: int
    waitlist_type: str  # "priority" (abonados) | "general"
    payment_status: str = "none"        # "none" (abonado) | "completed" | "partial"
    deposit_percent: Optional[int] = None
    created_at: datetime
    # Datos de actividad (incluidos solo en GET /waitlist/me)
    activity_name: Optional[str] = None
    activity_schedule: Optional[str] = None

    class Config:
        from_attributes = True


class ClientConditionResponse(BaseModel):
    """HU Listar condiciones de cliente (Nahuel)
    E1: hay inscriptos → lista con condición de acceso por cliente
    E2: sin inscriptos → lista vacía
    """
    user_id: int
    name: str
    lastname: str
    email: str
    reservation_type: str   # "fixed" | "individual"
    payment_status: str     # "pending" | "partial" | "completed"
    es_abonado: bool        # True si reservation_type == "fixed"

    class Config:
        from_attributes = True


class WaitlistDetailResponse(BaseModel):
    """Esquema de respuesta detallada de lista de espera con datos de contacto del cliente.
    HU: Listar lista de espera - dos colas separadas con datos de contacto.
    """
    id: int
    activity_id: int
    status: str
    position: int
    waitlist_type: str  # "priority" (abonados, fija) | "general" (resto)
    created_at: datetime
    cliente_id: int
    nombre: str
    email: str
    es_abonado: bool  # True si waitlist_type == "priority"
