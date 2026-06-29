# Esquemas de notificaciones internas del sistema (in-app)
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    """Esquema de respuesta de notificación"""
    id: int
    title: str
    body: str
    read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferenceRequest(BaseModel):
    """Esquema para actualizar la preferencia de notificaciones del sistema (in-app)."""
    enabled: bool


class NotificationPreferenceResponse(BaseModel):
    """Esquema de respuesta de la preferencia de notificaciones del sistema (in-app)."""
    enabled: bool
