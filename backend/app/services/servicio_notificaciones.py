# Servicio de notificaciones internas del sistema (in-app)
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.notification import Notification
from app.models.user import User


def crear_notificacion(user_id: int, title: str, body: str, db: Session, link: Optional[str] = None) -> Optional[Notification]:
    """Crea una notificación in-app para un usuario, salvo que las haya deshabilitado."""
    usuario = db.query(User).filter(User.id == user_id).first()
    if usuario and not usuario.notifications_enabled:
        return None

    notificacion = Notification(user_id=user_id, title=title, body=body, link=link)
    db.add(notificacion)
    db.commit()
    db.refresh(notificacion)
    return notificacion


def obtener_preferencia(user_id: int, db: Session) -> bool:
    """Devuelve si el usuario tiene habilitadas las notificaciones del sistema (in-app)."""
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario.notifications_enabled


def actualizar_preferencia(user_id: int, enabled: bool, db: Session) -> bool:
    """Habilita o deshabilita las notificaciones del sistema (in-app) para un usuario.

    El envío de emails no se ve afectado por esta preferencia.
    """
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.notifications_enabled = enabled
    db.commit()
    db.refresh(usuario)
    return usuario.notifications_enabled


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
