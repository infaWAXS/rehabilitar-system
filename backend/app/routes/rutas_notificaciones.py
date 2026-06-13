# Rutas de notificaciones internas del sistema (in-app)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from app.schemas.esquema_notificaciones import (
    NotificationResponse,
    NotificationPreferenceRequest,
    NotificationPreferenceResponse,
)
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


@router.get("/preferences", response_model=NotificationPreferenceResponse)
def obtener_preferencia_notificaciones(token: str, db: Session = Depends(get_db)):
    """Indica si el usuario autenticado tiene habilitadas las notificaciones del sistema (in-app).

    El envío de emails no depende de esta preferencia y nunca se puede desactivar.
    """
    current_user = get_current_user(token, db)
    return {"enabled": servicio_notificaciones.obtener_preferencia(current_user.id, db)}


@router.put("/preferences", response_model=NotificationPreferenceResponse)
def actualizar_preferencia_notificaciones(request: NotificationPreferenceRequest, token: str, db: Session = Depends(get_db)):
    """Habilita o deshabilita las notificaciones del sistema (in-app) del usuario autenticado.

    El envío de emails no depende de esta preferencia y nunca se puede desactivar.
    """
    current_user = get_current_user(token, db)
    enabled = servicio_notificaciones.actualizar_preferencia(current_user.id, request.enabled, db)
    return {"enabled": enabled}

