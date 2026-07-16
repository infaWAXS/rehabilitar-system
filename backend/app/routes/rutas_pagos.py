# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.schemas.esquema_planes import PlanRespuesta, PagoMercadoPagoRequest, PagoMercadoPagoResponse
from app.services.servicio_pagos import get_active_plans, simulate_mercadopago_payment, get_my_plans
from app.utils.subscriptions import is_abonado, get_age_discount_percent
from app.utils.credits import get_monthly_balance, get_monthly_balance_by_type, MONTHLY_CREDIT_CAP

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
    """Devuelve si el usuario logueado es abonado (tiene al menos un plan activo),
    sus créditos disponibles y su descuento pendiente por cancelación.
    El detalle de cada suscripción (puede tener varias) se consulta en /payments/my-plans."""
    credits = get_monthly_balance(current_user.id, db)
    credits_by_type = get_monthly_balance_by_type(current_user.id, db)
    age_discount = get_age_discount_percent(current_user)
    return {
        "es_abonado": is_abonado(current_user.id, db),
        "credits": credits,
        "credits_cap": MONTHLY_CREDIT_CAP,
        "credits_by_type": credits_by_type,
        "pending_discount_percent": current_user.pending_discount_percent,
        # Motivo del descuento pendiente ("cancelacion" | "mes_corto"): el monto es uno
        # solo pero el texto que ve el cliente cambia según por qué se lo debemos.
        "pending_discount_reason": current_user.pending_discount_reason,
        "age_discount_percent": age_discount,
    }


# HU: Ver mis suscripciones (un cliente puede tener varias)
@router.get("/my-plans")
def listar_mis_planes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve todas las suscripciones del usuario logueado (activas, vencidas o canceladas)."""
    return get_my_plans(current_user.id, db)

