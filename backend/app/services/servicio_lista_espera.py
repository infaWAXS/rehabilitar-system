# Responsable: Francis - Lógica de negocio de lista de espera
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.waitlist import Waitlist
from app.models.user import User
from app.exceptions.http_exceptions import user_not_found_exception


# Añade un usuario a la lista de espera de una actividad
def add_to_waitlist(user_id: int, activity_id: int, db: Session):
    """
    Añade un usuario a la lista de espera de una actividad.
    Asigna automáticamente la posición en la lista.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise user_not_found_exception()
    
    # Verificar si el usuario ya está en la lista de espera
    existing = db.query(Waitlist).filter(
        Waitlist.user_id == user_id,
        Waitlist.activity_id == activity_id,
        Waitlist.status == "waiting"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="El usuario ya está en la lista de espera de esta actividad"
        )
    
    # Obtener la siguiente posición
    max_position = db.query(func.max(Waitlist.position)).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.status == "waiting"
    ).scalar()
    
    next_position = (max_position or 0) + 1
    
    # Crear entrada en lista de espera
    waitlist_entry = Waitlist(
        user_id=user_id,
        activity_id=activity_id,
        status="waiting",
        position=next_position
    )
    
    db.add(waitlist_entry)
    db.commit()
    db.refresh(waitlist_entry)
    
    return waitlist_entry


# Obtiene la lista de espera de un usuario
def get_user_waitlist(user_id: int, db: Session):
    """Obtiene todas las actividades en las que el usuario está en lista de espera"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise user_not_found_exception()
    
    waitlist = db.query(Waitlist).filter(
        Waitlist.user_id == user_id,
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()
    
    return waitlist


# Obtiene una entrada de lista de espera
def get_waitlist_entry(waitlist_id: int, db: Session):
    """Obtiene una entrada específica de lista de espera"""
    entry = db.query(Waitlist).filter(Waitlist.id == waitlist_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Entrada en lista de espera no encontrada"
        )
    
    return entry


# Elimina a un usuario de la lista de espera
def remove_from_waitlist(waitlist_id: int, db: Session):
    """
    Elimina un usuario de la lista de espera.
    Re-ordena las posiciones de los usuarios restantes.
    """
    entry = get_waitlist_entry(waitlist_id, db)
    
    if entry.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Esta entrada de lista de espera ya ha sido cancelada"
        )
    
    activity_id = entry.activity_id
    removed_position = entry.position
    
    # Cambiar estado a cancelado
    entry.status = "cancelled"
    db.commit()
    
    # Re-ordenar posiciones de los usuarios que estaban detrás
    remaining_entries = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.position > removed_position,
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()
    
    for idx, remaining_entry in enumerate(remaining_entries):
        remaining_entry.position = removed_position + idx
    
    db.commit()
    db.refresh(entry)
    
    return entry


# Obtiene la lista de espera completa de una actividad
def get_activity_waitlist(activity_id: int, db: Session):
    """Obtiene todos los usuarios en espera para una actividad específica"""
    waitlist = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()
    
    return waitlist


# Notifica al siguiente usuario en la lista
def notify_next_in_waitlist(activity_id: int, db: Session):
    """
    Obtiene el siguiente usuario en la lista de espera para notificarlo
    (cuando hay un cupo disponible).
    """
    next_entry = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.status == "waiting",
        Waitlist.position == 1
    ).first()
    
    if next_entry:
        next_entry.status = "notified"
        db.commit()
        db.refresh(next_entry)
        return next_entry
    
    return None
