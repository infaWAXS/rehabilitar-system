# Rutas de notificaciones internas del sistema (in-app)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from app.schemas.esquema_notificaciones import NotificationResponse
from app.utils.dependencies import get_current_user
from app.services import servicio_notificaciones

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def listar_notificaciones(token: str, db: Session = Depends(get_db)):
    """Lista las notificaciones del usuario autenticado (cliente o profesor)."""
    current_user = get_current_user(token, db)
    return servicio_notificaciones.listar_notificaciones(current_user.id, db)


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def marcar_notificacion_leida(notification_id: int, token: str, db: Session = Depends(get_db)):
    """Marca una notificación del usuario autenticado como leída."""
    current_user = get_current_user(token, db)
    return servicio_notificaciones.marcar_leida(notification_id, current_user.id, db)
