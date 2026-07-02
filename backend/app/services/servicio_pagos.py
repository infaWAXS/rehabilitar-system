# Responsable: Ezequiel
# HU: Ver suscripciones + Pagar Mercado Pago
import uuid
from datetime import date, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.plan import Plan
from app.models.user_plan import UserPlan
from app.models.user import User

from app.models.audit_log import AuditType, AuditAction, AuditResult
from app.services.servicio_auditoria import register_audit


# ── Ver planes ────────────────────────────────────────────────────────────────

def get_active_plans(db: Session):
    """Devuelve todos los planes con status='active'."""
    return db.query(Plan).filter(Plan.status == "active").all()


# ── Simulación Mercado Pago ───────────────────────────────────────────────────

def simulate_mercadopago_payment(plan_id: int, specialization: str, test_scenario: str, user_id: int, db: Session):
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
        # Consumir el descuento acumulado por cancelación (beneficio del abonado para
        # su próximo pago de suscripción)
        user = db.query(User).filter(User.id == user_id).first()
        descuento = (user.pending_discount_percent or 0) if user else 0
        precio_final = float(plan.price) * (1 - descuento / 100) if descuento else float(plan.price)

        # Crear (o renovar) el UserPlan del usuario
        hoy = date.today()
        user_plan = UserPlan(
            user_id=user_id,
            plan_id=plan.id,
            specialization=specialization,
            start_date=hoy,
            end_date=hoy + timedelta(days=plan.duration_days),
            status="active",
        )
        db.add(user_plan)
        if descuento and user:
            user.pending_discount_percent = 0
        register_audit(
            db=db,
            user_id=user_id,
            type=AuditType.PAYMENT,
            action=AuditAction.SUBSCRIPTION,
            result=AuditResult.SUCCESS,
            detail=f"Pago aprobado para el usuario {user.name} {user.lastname}, plan '{plan.name}' en {specialization}. Precio final: ${precio_final:.2f}.",
        )
        db.commit()

        mensaje = f"Pago aprobado. Te suscribiste al plan '{plan.name}' en {specialization}."
        if descuento:
            mensaje += f" Se aplicó un {descuento}% de descuento por cancelación previa (pagaste ${precio_final:.2f} en lugar de ${float(plan.price):.2f})."

        return {
            "success": True,
            "message": mensaje,
            "transaction_id": str(uuid.uuid4()),
            "status": "approved",
            "price_paid": precio_final,
            "discount_applied": descuento,
        }
    elif test_scenario == "insufficient_funds":
        register_audit(
            db=db,
            user_id=user_id,
            type=AuditType.PAYMENT,
            action=AuditAction.SUBSCRIPTION,
            result=AuditResult.ERROR,
            detail=f"Pago rechazado por fondos insuficientes para el usuario {user.name} {user.lastname}, plan '{plan.name}' en {specialization}.",
        )
        db.commit()
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

