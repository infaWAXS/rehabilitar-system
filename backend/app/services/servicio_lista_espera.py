# Responsable: Francis - Lógica de negocio de lista de espera
# HUs Listar lista de espera / Dar de baja en lista de espera: Nahuel
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
    Cola determinada por condición de abonado:
      - "priority": el usuario tiene al menos una reserva fija activa (abonado).
      - "general":  todos los demás.
    Cada cola mantiene su propia secuencia de posiciones.
    TODO: cuando exista el modelo Activity, verificar tipo de actividad;
          si es "individual", usar siempre cola "general" sin importar si es abonado.
    """
    from app.models.reservation import Reservation

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise user_not_found_exception()

    # Verificar si el usuario ya está en cualquier cola de esta actividad
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

    # Determinar cola: abonado -> "priority", resto -> "general"
    es_abonado = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.reservation_type == "fixed",
        Reservation.status != "cancelled"
    ).first() is not None

    tipo_cola = "priority" if es_abonado else "general"

    # Posición dentro de su propia cola (independiente de la otra)
    max_position = db.query(func.max(Waitlist.position)).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.waitlist_type == tipo_cola,
        Waitlist.status == "waiting"
    ).scalar()

    next_position = (max_position or 0) + 1

    # Crear entrada en lista de espera
    waitlist_entry = Waitlist(
        user_id=user_id,
        activity_id=activity_id,
        status="waiting",
        position=next_position,
        waitlist_type=tipo_cola
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
    tipo_cola = entry.waitlist_type  # guardar antes de cancelar

    # Cambiar estado a cancelado
    entry.status = "cancelled"
    db.commit()

    # TODO: notificar al cliente via mail confirmando la baja (Escenario 1 HU Dar de baja)

    # Re-ordenar posiciones solo dentro de la misma cola
    remaining_entries = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.waitlist_type == tipo_cola,
        Waitlist.position > removed_position,
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()
    
    for idx, remaining_entry in enumerate(remaining_entries):
        remaining_entry.position = removed_position + idx
    
    db.commit()
    db.refresh(entry)
    
    return entry


# Obtiene la lista de espera completa de una actividad (dos colas separadas)
def get_activity_waitlist(activity_id: int, db: Session):
    """HU: Listar lista de espera.
    Escenario 1: retorna primero la cola 'priority' (abonados) ordenada por posicion,
                 luego la cola 'general' ordenada por posicion. Datos de contacto incluidos.
    Escenario 2: retorna lista vacia si no hay inscriptos en ninguna cola.
    Las posiciones de cada cola son independientes entre si.
    """
    def _build_entry(entrada, cliente):
        return {
            "id": entrada.id,
            "activity_id": entrada.activity_id,
            "status": entrada.status,
            "position": entrada.position,
            "waitlist_type": entrada.waitlist_type,
            "created_at": entrada.created_at,
            "cliente_id": cliente.id,
            "nombre": f"{cliente.name} {cliente.lastname}",
            "email": cliente.email,
            "es_abonado": entrada.waitlist_type == "priority",
        }

    cola_priority = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.waitlist_type == "priority",
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()

    cola_general = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.waitlist_type == "general",
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()

    resultado = []
    for entrada in cola_priority + cola_general:
        cliente = db.query(User).filter(User.id == entrada.user_id).first()
        if not cliente:
            continue
        resultado.append(_build_entry(entrada, cliente))

    return resultado


# Notifica al siguiente usuario en la lista (prioridad: cola priority antes que general)
def notify_next_in_waitlist(activity_id: int, db: Session):
    """
    Obtiene el siguiente usuario en la lista de espera para notificarlo
    cuando hay un cupo disponible.
    Orden: primero el #1 de la cola 'priority'; si no hay, el #1 de la cola 'general'.
    """
    # Buscar primero en cola priority (abonados)
    next_entry = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.status == "waiting",
        Waitlist.waitlist_type == "priority",
        Waitlist.position == 1
    ).first()

    # Si no hay en priority, buscar en general
    if not next_entry:
        next_entry = db.query(Waitlist).filter(
            Waitlist.activity_id == activity_id,
            Waitlist.status == "waiting",
            Waitlist.waitlist_type == "general",
            Waitlist.position == 1
        ).first()

    if next_entry:
        next_entry.status = "notified"
        db.commit()
        db.refresh(next_entry)
        return next_entry

    return None
