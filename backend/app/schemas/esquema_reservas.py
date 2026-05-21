# Responsable: Francis - Esquemas de Reservas y Lista de Espera
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


# ===== SCHEMAS DE RESERVAS =====

class ReservationCreate(BaseModel):
    """Esquema para crear una reserva"""
    activity_id: int
    reservation_type: str  # "fixed" o "individual"
    reservation_date: datetime
    payment_method: Optional[str] = "full_payment"  # subscription | full_payment | partial_payment | credit


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

    class Config:
        from_attributes = True


# ===== SCHEMAS DE LISTA DE ESPERA =====

class WaitlistCreate(BaseModel):
    """Esquema para añadir a lista de espera"""
    activity_id: int


class WaitlistResponse(BaseModel):
    """Esquema de respuesta de lista de espera"""
    id: int
    user_id: int
    activity_id: int
    status: str
    position: int
    waitlist_type: str  # "priority" (abonados) | "general"
    created_at: datetime

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
