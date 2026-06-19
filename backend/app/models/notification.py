# Modelo de notificaciones internas del sistema (in-app)
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.connection import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    read = Column(Boolean, nullable=False, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
