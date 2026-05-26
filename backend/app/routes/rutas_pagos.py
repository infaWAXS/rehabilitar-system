# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.schemas.esquema_planes import PlanRespuesta, PagoMercadoPagoRequest, PagoMercadoPagoResponse
from app.services.servicio_pagos import get_active_plans, simulate_mercadopago_payment

router = APIRouter(prefix="/payments", tags=["Pagos"])


# HU: Ver suscripciones (Ezequiel)
@router.get("/plans", response_model=list[PlanRespuesta])
def listar_planes(db: Session = Depends(get_db)):
    """Devuelve todos los planes activos. No requiere autenticación."""
    return get_active_plans(db)


# HU: Pagar Mercado Pago (Ezequiel)
@router.post("/mercadopago/checkout", response_model=PagoMercadoPagoResponse)
def checkout_mercadopago(
    body: PagoMercadoPagoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Simula el proceso de pago con Mercado Pago."""
    return simulate_mercadopago_payment(body.plan_id, body.test_scenario, db)

