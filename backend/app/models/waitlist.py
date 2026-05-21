# Responsable: Francis - Modelo de Lista de Espera
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from database.connection import Base
import enum


class WaitlistStatus(str, enum.Enum):
    """Estados posibles en la lista de espera"""
    waiting = "waiting"
    notified = "notified"
    converted = "converted"  # Se convirtió a reserva
    cancelled = "cancelled"


class Waitlist(Base):
    __tablename__ = "waitlist"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_id = Column(Integer, nullable=False)  # Se vinculará con Activity
    status = Column(String, nullable=False, default="waiting")
    position = Column(Integer, nullable=False)  # Posición dentro de su cola
    # Cola a la que pertenece: "priority" (abonados, actividad fija) | "general" (resto)
    # TODO: cuando exista Activity model, validar que solo actividades fijas usan "priority"
    waitlist_type = Column(String, nullable=False, default="general", server_default="general")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
