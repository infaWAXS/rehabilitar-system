# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
import uuid
from datetime import date, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.plan import Plan
from app.models.user_plan import UserPlan


# ── Ver planes ────────────────────────────────────────────────────────────────

def get_active_plans(db: Session):
    """Devuelve todos los planes con status='active'."""
    return db.query(Plan).filter(Plan.status == "active").all()


# ── Simulación Mercado Pago ───────────────────────────────────────────────────

def simulate_mercadopago_payment(plan_id: int, test_scenario: str, user_id: int, db: Session):
    """
    Simula el flujo de pago con Mercado Pago.
    test_scenario:
      - "success"            → E1: conexión OK, saldo suficiente → pago aprobado + crea UserPlan
      - "insufficient_funds" → E2: conexión OK, saldo insuficiente → pago rechazado
      - "connection_error"   → E3: falla de conexión con el banco → error de conexión
    """
    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.status == "active").first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado o inactivo.")

    if test_scenario == "success":
        # Crear (o renovar) el UserPlan del usuario
        hoy = date.today()
        user_plan = UserPlan(
            user_id=user_id,
            plan_id=plan.id,
            start_date=hoy,
            end_date=hoy + timedelta(days=plan.duration_days),
            status="active",
        )
        db.add(user_plan)
        db.commit()

        return {
            "success": True,
            "message": f"Pago aprobado. Te suscribiste al plan '{plan.name}'.",
            "transaction_id": str(uuid.uuid4()),
            "status": "approved",
        }
    elif test_scenario == "insufficient_funds":
        return {
            "success": False,
            "message": "Pago rechazado: fondos insuficientes en la cuenta.",
            "transaction_id": None,
            "status": "rejected",
        }
    elif test_scenario == "connection_error":
        raise HTTPException(
            status_code=503,
            detail="Error de conexión con el servidor del banco. Intente nuevamente.",
        )
    else:
        raise HTTPException(status_code=400, detail="Escenario de prueba no válido.")

