# Responsable: Ezequiel
# HU: Adquirir plan → relación Usuario-Plan activo
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base


class UserPlan(Base):
    """
    Suscripción de un usuario a un plan: un TOKEN de un solo uso para una especialidad.
    Se crea cuando el pago con Mercado Pago es exitoso.

    El token NO vence: el cliente lo usa cuando quiere. Al gastarlo se inscribe a una
    actividad fija y queda anotado a las clases que esa actividad tenga en ese mes
    (hasta MAX_SUBSCRIPTION_FIXED_CLASSES). "Plan Mensual" no son 30 días: son las 4
    clases de un mes.

    Que el token esté gastado NO se guarda acá: se deriva de si existe alguna Reservation
    imputada a este plan, incluidas las canceladas (ver subscriptions.is_token_usado).
    Gastarlo es irreversible: cancelar los turnos no devuelve el token, al cliente lo
    compensa la política de cancelación (créditos y descuentos).
    """
    __tablename__ = "user_plans"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    specialization = Column(String(120), nullable=False)  # especialidad que el usuario eligió
    # Fecha de compra. Ya no define vigencia (los tokens no vencen): queda como registro.
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="active")  # "active" | "cancelled"

    user = relationship("User", back_populates="user_plans")
    plan = relationship("Plan")
