# Esquemas de notificaciones internas del sistema (in-app)
from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    """Esquema de respuesta de notificación"""
    id: int
    title: str
    body: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True
