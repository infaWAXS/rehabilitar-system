# Helper compartido: lógica de abonado
# Un cliente es "abonado" si tiene un UserPlan con status="active" y end_date >= hoy.
# Un mismo cliente puede tener varios UserPlan activos a la vez (por ejemplo, uno
# por cada especialidad en la que se suscribió). Cada plan es mensual (30 días) e
# incluye como máximo MAX_SUBSCRIPTION_FIXED_CLASSES clases fijas de su especialidad.
from datetime import date
from sqlalchemy.orm import Session
from app.models.user_plan import UserPlan

MAX_SUBSCRIPTION_FIXED_CLASSES = 4


def is_abonado(user_id: int, db: Session) -> bool:
    hoy = date.today()
    return (
        db.query(UserPlan)
        .filter(
            UserPlan.user_id == user_id,
            UserPlan.status == "active",
            UserPlan.end_date >= hoy,
        )
        .first()
        is not None
    )


def get_active_user_plan(user_id: int, db: Session):
    """Devuelve un UserPlan activo del usuario (o None). Si tiene varios, no
    garantiza cuál; usar get_active_user_plans o find_active_plan_for_specialization
    cuando importe distinguir por especialidad."""
    hoy = date.today()
    return (
        db.query(UserPlan)
        .filter(
            UserPlan.user_id == user_id,
            UserPlan.status == "active",
            UserPlan.end_date >= hoy,
        )
        .first()
    )


def get_active_user_plans(user_id: int, db: Session):
    """Devuelve todos los UserPlan activos y vigentes del usuario (puede tener varios)."""
    hoy = date.today()
    return (
        db.query(UserPlan)
        .filter(
            UserPlan.user_id == user_id,
            UserPlan.status == "active",
            UserPlan.end_date >= hoy,
        )
        .order_by(UserPlan.end_date.asc())
        .all()
    )


def count_subscription_classes_used(user_plan_id: int, db: Session) -> int:
    """Cantidad de clases fijas ya reservadas usando este plan puntual (no canceladas)."""
    from app.models.reservation import Reservation
    return (
        db.query(Reservation)
        .filter(Reservation.user_plan_id == user_plan_id, Reservation.status != "cancelled")
        .count()
    )


def find_active_plan_for_specialization(user_id: int, specialization: str, db: Session,
                                         require_capacity: bool = False):
    """
    Entre los planes activos y vigentes del usuario, devuelve el primero que
    coincide con `specialization`. Si `require_capacity` es True, ignora los
    planes que ya alcanzaron el máximo de clases incluidas.
    """
    for plan in get_active_user_plans(user_id, db):
        if plan.specialization != specialization:
            continue
        if require_capacity and count_subscription_classes_used(plan.id, db) >= MAX_SUBSCRIPTION_FIXED_CLASSES:
            continue
        return plan
    return None
