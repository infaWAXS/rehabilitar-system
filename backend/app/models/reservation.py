# Responsable: Francis - Modelo de Reservas
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from database.connection import Base
import enum


class ReservationStatus(str, enum.Enum):
    """Estados posibles de una reserva"""
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_id = Column(Integer, nullable=False)  # Se vinculará con Activity cuando esté creado
    reservation_type = Column(String, nullable=False)  # "fixed" o "individual"
    status = Column(String, nullable=False, default="pending")
    payment_status = Column(String, default="pending")  # "pending", "partial", "completed"
    reservation_date = Column(DateTime, nullable=False)
    # % del precio abonado al reservar (50-100). None para subscription/credit, donde no aplica.
    deposit_percent = Column(Integer, nullable=True)
    # Resultado de la política de cancelación aplicada (credit, discount_20, discount_30,
    # no_benefit, deposit_returned, no_refund, center_credit, center_refund). None si no se canceló.
    cancellation_result = Column(String, nullable=True)
    # Suscripción puntual usada para pagar esta reserva (payment_method == "subscription").
    # Permite contar cuántas de las 4 clases fijas incluidas en ESE plan ya se usaron.
    user_plan_id = Column(Integer, ForeignKey("user_plans.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
