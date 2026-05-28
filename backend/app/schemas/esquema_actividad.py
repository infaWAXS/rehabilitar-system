from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import date


class ActivityCreate(BaseModel):
    room_id: int
    name: str
    specialization: str
    activity_type: str          # "fixed" | "individual"
    schedule: Optional[str] = None        # solo para display en actividades fijas legacy
    specific_date: Optional[date] = None  # fecha de inicio (fijas) o fecha puntual (individuales)
    time_slot: Optional[str] = None       # ej: "15:00"
    professor: Optional[str] = None
    price: Decimal
    capacity: int
    description: Optional[str] = None
    requirements: Optional[str] = None
    repetitions: Optional[int] = 1        # actividades fijas: cuántas semanas consecutivas crear

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


class ActivityUpdate(BaseModel):
    room_id: Optional[int] = None
    name: Optional[str] = None
    specialization: Optional[str] = None
    activity_type: Optional[str] = None
    schedule: Optional[str] = None
    specific_date: Optional[date] = None
    time_slot: Optional[str] = None
    professor: Optional[str] = None   # None = sin profesor asignado
    price: Optional[Decimal] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    status: Optional[str] = None

    @field_validator("activity_type")
    @classmethod
    def validar_tipo(cls, v):
        if v is not None and v not in ("fixed", "individual"):
            raise ValueError("activity_type debe ser 'fixed' o 'individual'")
        return v

    @field_validator("status")
    @classmethod
    def validar_estado(cls, v):
        if v is not None and v not in ("active", "cancelled"):
            raise ValueError("status debe ser 'active' o 'cancelled'")
        return v


class ActivityResponse(BaseModel):
    id: int
    room_id: int
    name: str
    specialization: str
    activity_type: str
    schedule: Optional[str]
    specific_date: Optional[date]
    time_slot: Optional[str]
    professor: Optional[str]
    price: Decimal
    capacity: int
    description: Optional[str]
    requirements: Optional[str]
    status: str

    class Config:
        from_attributes = True


class ActivityAvailabilityResponse(BaseModel):
    activity_id: int
    capacity: int
    reserved_count: int
    available_spots: int

    class Config:
        from_attributes = True
