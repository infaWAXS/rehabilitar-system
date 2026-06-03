# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.schemas.esquema_planes import PlanRespuesta, PagoMercadoPagoRequest, PagoMercadoPagoResponse
from app.services.servicio_pagos import get_active_plans, simulate_mercadopago_payment
from app.utils.subscriptions import get_active_user_plan

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
    return simulate_mercadopago_payment(body.plan_id, body.specialization, body.test_scenario, current_user.id, db)


# HU: Consultar si el usuario logueado es abonado
@router.get("/my-plan")
def get_my_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve el plan activo del usuario o null si no es abonado."""
    user_plan = get_active_user_plan(current_user.id, db)
    if not user_plan:
        return {"es_abonado": False, "plan": None, "credits": current_user.credits, "pending_discount_percent": current_user.pending_discount_percent}
    return {
        "es_abonado": True,
        "credits": current_user.credits,
        "pending_discount_percent": current_user.pending_discount_percent,
        "plan": {
            "id": user_plan.plan.id,
            "name": user_plan.plan.name,
            "coverage_type": user_plan.plan.coverage_type,
            "specialization": user_plan.specialization,
            "end_date": str(user_plan.end_date),
        },
    }

