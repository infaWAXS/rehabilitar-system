# Servicio de notificaciones internas del sistema (in-app)
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.notification import Notification


def crear_notificacion(user_id: int, title: str, body: str, db: Session) -> Notification:
    """Crea una notificación in-app para un usuario."""
    notificacion = Notification(user_id=user_id, title=title, body=body)
    db.add(notificacion)
    db.commit()
    db.refresh(notificacion)
    return notificacion


def listar_notificaciones(user_id: int, db: Session) -> List[Notification]:
    """Lista las notificaciones de un usuario, de la más reciente a la más antigua."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def marcar_leida(notification_id: int, user_id: int, db: Session) -> Notification:
    """Marca una notificación del usuario como leída."""
    notificacion = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notificacion.read = True
    db.commit()
    db.refresh(notificacion)
    return notificacion
