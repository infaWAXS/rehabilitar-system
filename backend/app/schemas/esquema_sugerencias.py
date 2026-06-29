from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime


class SuggestionCreate(BaseModel):
    room_id: int
    name: str
    specialization: str
    activity_type: str              # "fixed" | "individual"
    schedule: Optional[str] = None        # clases fijas
    specific_date: Optional[date] = None  # clases individuales o primera fecha de las fijas
    time_slot: Optional[str] = None       # clases individuales
    dates: Optional[List[date]] = None    # clases fijas: fechas concretas (mes + día de semana)
    capacity: int
    description: Optional[str] = None
    requirements: Optional[str] = None

    @field_validator("activity_type")
    @classmethod
    def validar_tipo(cls, v):
        if v not in ("fixed", "individual"):
            raise ValueError("activity_type debe ser 'fixed' o 'individual'")
        return v

    @field_validator("capacity")
    @classmethod
    def validar_cupos(cls, v):
        if v <= 0:
            raise ValueError("capacity debe ser mayor a 0")
        return v


class SuggestionResponse(BaseModel):
    id: int
    professor_id: int
    professor_name: str
    room_id: int
    room_name: str
    name: Optional[str]
    specialization: str
    activity_type: str
    schedule: Optional[str]
    specific_date: Optional[date]
    time_slot: Optional[str]
    dates: Optional[List[date]] = None
    capacity: int
    description: Optional[str]
    requirements: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SuggestionAccept(BaseModel):
    price: Decimal

    @field_validator("price")
    @classmethod
    def validar_precio(cls, v):
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return v