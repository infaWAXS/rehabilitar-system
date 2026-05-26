# Helper compartido: lógica de abonado
# Un cliente es "abonado" si tiene un UserPlan con status="active" y end_date >= hoy.
from datetime import date
from sqlalchemy.orm import Session
from app.models.user_plan import UserPlan


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
    """Devuelve el UserPlan activo del usuario (o None)."""
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
