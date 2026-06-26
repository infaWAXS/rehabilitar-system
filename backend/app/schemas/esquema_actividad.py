from pydantic import BaseModel, field_validator
from typing import Optional, List
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
    dates: Optional[List[date]] = None    # lista explícita de fechas (nuevo modelo mes+dia)

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
    """Edición de actividad: solo se permite reasignar sala y/o profesor.
    El resto de los datos (nombre, horario, precio, etc.) son fijos una vez creada."""
    room_id: Optional[int] = None
    professor: Optional[str] = None   # None = sin profesor asignado


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
