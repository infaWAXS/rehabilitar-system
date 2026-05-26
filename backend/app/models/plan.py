# Responsable: Ezequiel
# HU: Ver suscripciones (Ver planes y abonos)
from sqlalchemy import Column, Integer, String, Numeric, CheckConstraint
from database.connection import Base


class Plan(Base):
    """
    Plan de suscripción o abono disponible en el sistema.
    Los clientes pueden consultar los planes activos y suscribirse.
    """
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    description = Column(String(500), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    duration_days = Column(Integer, nullable=False)        # duración en días (30, 90, 180, etc.)
    coverage_type = Column(String(120), nullable=False)    # ej: "Acceso ilimitado", "2 clases/semana"
    status = Column(String(20), nullable=False, default="active")  # "active" | "inactive"

    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="chk_plan_status"),
        CheckConstraint("duration_days > 0", name="chk_plan_duration"),
    )
