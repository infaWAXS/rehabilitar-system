# Sistema de créditos para abonados.
#
# Política de negocio:
# - Un abonado gana 1 crédito al cancelar una clase con >48 hs de anticipación.
# - Un abonado gana 1 crédito si el centro cancela su clase por falta de profesor (<12 hs).
# - Tope: máximo 3 créditos por mes calendario (ganados, no saldo). El tope se renueva
#   el día 1 de cada mes — los créditos no usados NO se acumulan al mes siguiente, ya que
#   el saldo disponible se calcula solo con movimientos del mes calendario actual.
# - El crédito ganado se etiqueta con el tipo de actividad de origen (solo para registro),
#   pero puede gastarse en cualquier tipo de actividad.
# - Si la reserva que se cancela fue pagada con un crédito, esa cancelación no genera
#   un nuevo crédito (no hay "devolución de la devolución").
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.credit_transaction import CreditTransaction

MONTHLY_CREDIT_CAP = 3


def _month_start(today: date = None) -> datetime:
    today = today or date.today()
    return datetime(today.year, today.month, 1)


def get_monthly_earned(user_id: int, db: Session) -> int:
    """Cantidad de créditos ganados (movimientos positivos) en el mes calendario actual."""
    total = (
        db.query(func.sum(CreditTransaction.amount))
        .filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.amount > 0,
            CreditTransaction.created_at >= _month_start(),
        )
        .scalar()
    )
    return total or 0


def get_monthly_balance(user_id: int, db: Session) -> int:
    """Saldo disponible para gastar: suma de movimientos (ganados - gastados) del mes actual."""
    total = (
        db.query(func.sum(CreditTransaction.amount))
        .filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.created_at >= _month_start(),
        )
        .scalar()
    )
    return max(0, total or 0)


def get_monthly_balance_by_type(user_id: int, db: Session) -> dict:
    """Desglose de créditos ganados este mes por tipo de actividad de origen (solo informativo)."""
    rows = (
        db.query(CreditTransaction.activity_type, func.sum(CreditTransaction.amount))
        .filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.amount > 0,
            CreditTransaction.activity_type.isnot(None),
            CreditTransaction.created_at >= _month_start(),
        )
        .group_by(CreditTransaction.activity_type)
        .all()
    )
    return {activity_type: amount for activity_type, amount in rows}


def can_earn_credit(user_id: int, db: Session) -> bool:
    return get_monthly_earned(user_id, db) < MONTHLY_CREDIT_CAP


def grant_credit(user_id: int, db: Session, activity_type: str = None,
                  reservation_id: int = None, reason: str = "cancellation_48h") -> bool:
    """Otorga 1 crédito si no se superó el tope mensual. Devuelve True si se otorgó."""
    if not can_earn_credit(user_id, db):
        return False
    db.add(CreditTransaction(
        user_id=user_id,
        amount=1,
        activity_type=activity_type,
        reservation_id=reservation_id,
        reason=reason,
    ))
    db.commit()
    return True


def spend_credit(user_id: int, db: Session, reservation_id: int = None,
                  reason: str = "spent_reservation") -> None:
    """Registra el gasto de 1 crédito. El llamador debe validar saldo > 0 antes de invocar."""
    db.add(CreditTransaction(
        user_id=user_id,
        amount=-1,
        reservation_id=reservation_id,
        reason=reason,
    ))
    db.commit()


def was_paid_with_credit(reservation_id: int, db: Session) -> bool:
    """True si la reserva fue pagada usando un crédito (movimiento de gasto registrado)."""
    return (
        db.query(CreditTransaction)
        .filter(
            CreditTransaction.reservation_id == reservation_id,
            CreditTransaction.amount < 0,
            CreditTransaction.reason == "spent_reservation",
        )
        .first()
        is not None
    )
