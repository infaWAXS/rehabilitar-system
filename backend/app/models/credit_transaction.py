# Responsable: Sistema de créditos
# Ledger de créditos: cada fila es un movimiento (+1 ganado, -1 gastado).
# El saldo disponible de un usuario es la suma de sus movimientos del mes calendario
# actual (los créditos no usados se pierden al cambiar de mes).
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.connection import Base


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # +1 ganado | -1 gastado
    activity_type = Column(String(120), nullable=True)  # especialidad de origen (solo créditos ganados)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True)
    reason = Column(String(50), nullable=False)  # cancellation_48h | spent_reservation | center_cancellation
    created_at = Column(DateTime, server_default=func.now())
