# Responsable: Nahuel - Esquemas de Clientes
from typing import Optional
from pydantic import BaseModel, Field


class SuspendRequest(BaseModel):
    # Escenario 3 HU Suspender: motivo vacio -> error de validacion automatico
    motivo: str = Field(min_length=1, description="Motivo de suspension. Obligatorio.")


class ReinstateRequest(BaseModel):
    motivo: Optional[str] = None  # Opcional segun HU: Reintegrar cuenta


class ReintegrationRequest(BaseModel):
    # Escenario 2 HU Solicitar reintegro: motivo vacio -> error de validacion automatico
    motivo: str = Field(min_length=1, description="Motivo de la solicitud de reintegro. Obligatorio.")
