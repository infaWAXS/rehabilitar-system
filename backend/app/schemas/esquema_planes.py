# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


# ── Planes ────────────────────────────────────────────────────────────────────

class PlanRespuesta(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    duration_days: int
    coverage_type: str
    status: str

    class Config:
        from_attributes = True


# ── Pago Mercado Pago (simulado) ──────────────────────────────────────────────

class PagoMercadoPagoRequest(BaseModel):
    plan_id: int
    specialization: str  # especialidad que el usuario elige para el plan
    test_scenario: str  # "success" | "insufficient_funds" | "connection_error"


class PagoMercadoPagoResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None
    status: str  # "approved" | "rejected" | "error"
