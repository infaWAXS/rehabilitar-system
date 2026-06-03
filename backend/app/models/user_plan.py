# Responsable: Ezequiel
# HU: Adquirir plan → relación Usuario-Plan activo
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base


class UserPlan(Base):
    """
    Suscripción activa de un usuario a un plan.
    Se crea cuando el pago con Mercado Pago es exitoso.
    """
    __tablename__ = "user_plans"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    specialization = Column(String(120), nullable=False)  # especialidad que el usuario eligió
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="active")  # "active" | "expired" | "cancelled"

    user = relationship("User", back_populates="user_plans")
    plan = relationship("Plan")
