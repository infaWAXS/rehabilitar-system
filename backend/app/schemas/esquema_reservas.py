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
    created_at: datetime

    class Config:
        from_attributes = True
