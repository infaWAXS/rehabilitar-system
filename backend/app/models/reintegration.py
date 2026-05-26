# Responsable: Nahuel - Modelo de solicitudes de reintegro de cuenta
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.connection import Base

class ReintegrationRequest(Base):
    __tablename__ = "reintegration_requests"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    motivo = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
