# Responsable: Francis - Lógica de negocio de lista de espera
# HUs Listar lista de espera / Dar de baja en lista de espera: Nahuel
from threading import Thread
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.waitlist import Waitlist
from app.models.user import User
from app.exceptions.http_exceptions import user_not_found_exception, medical_certificate_not_approved_exception
from app.utils.subscriptions import is_abonado
from database.connection import SessionLocal


# Añade un usuario a la lista de espera de una actividad
def add_to_waitlist(user_id: int, activity_id: int, db: Session, notificar: bool = True,
                    deposit_percent: int = None):
    """
    Añade un usuario a la lista de espera de una actividad.
    Cola determinada por tipo de actividad:
      - Si es "individual": siempre cola "general" (sin importar si es abonado)
      - Si es "fixed": "priority" si es abonado, "general" si no
    Cada cola mantiene su propia secuencia de posiciones.

    Regla de negocio: el abonado entra a la cola sin pagar; el no abonado tiene que
    abonar el total o una seña (mínimo 50%) para reservar su lugar. Ese pago viaja en
    `deposit_percent` y se arrastra a la reserva cuando le toca el cupo. Si la clase pasa
    sin que le haya tocado, se le reintegra (servicio_reintegros).

    `notificar=False` lo usa la inscripción al mes por suscripción: ahí el cliente hizo
    una sola acción y recibe un aviso único con todas las clases, así que el aviso por
    clase encolada sería un duplicado.
    """
    from app.models.reservation import Reservation
    from app.models.activity import Activity

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise user_not_found_exception()

    # Regla de negocio: sin apto físico aprobado el cliente no puede anotarse a
    # ninguna actividad (tampoco a la lista de espera).
    if user.medical_certificate_status != "approved":
        raise medical_certificate_not_approved_exception()

    # Obtener la actividad para verificar su tipo
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

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

    abonado = is_abonado(user_id, db)

    # Determinar cola según tipo de actividad
    if activity.activity_type == "individual":
        # Actividades individuales: siempre cola general
        tipo_cola = "general"
    else:
        # Actividades fijas: priority si es abonado, general si no
        tipo_cola = "priority" if abonado else "general"

    # El abonado no paga; al no abonado se le exige el pago para reservar el lugar.
    if abonado:
        payment_status = "none"
        deposit_percent = None
    else:
        if deposit_percent is None:
            raise HTTPException(
                status_code=400,
                detail="Para anotarte en la lista de espera tenés que abonar el total o una seña de al menos el 50%.",
            )
        if not (50 <= deposit_percent <= 100):
            raise HTTPException(
                status_code=400,
                detail="La seña debe ser un porcentaje entre 50 y 100.",
            )
        payment_status = "completed" if deposit_percent == 100 else "partial"

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
        waitlist_type=tipo_cola,
        payment_status=payment_status,
        deposit_percent=deposit_percent,
    )

    db.add(waitlist_entry)
    db.commit()
    db.refresh(waitlist_entry)

    uid_copia = waitlist_entry.user_id
    aid_copia = waitlist_entry.activity_id
    pos_copia = waitlist_entry.position

    def _notif_async(uid: int, aid: int, pos: int) -> None:
        from app.utils.notifications import notify_waitlist_added
        db_n = SessionLocal()
        try:
            notify_waitlist_added(uid, aid, pos, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    if notificar:
        Thread(target=_notif_async, args=(uid_copia, aid_copia, pos_copia), daemon=True).start()

    return waitlist_entry


# Obtiene la lista de espera de un usuario
def get_user_waitlist(user_id: int, db: Session):
    """Obtiene todas las actividades en las que el usuario está en lista de espera.
    Enriquece cada entrada con nombre y horario de la actividad.
    """
    from app.models.activity import Activity

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise user_not_found_exception()

    waitlist = db.query(Waitlist).filter(
        Waitlist.user_id == user_id,
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()

    resultado = []
    for entry in waitlist:
        actividad = db.query(Activity).filter(Activity.id == entry.activity_id).first()
        resultado.append({
            "id": entry.id,
            "user_id": entry.user_id,
            "activity_id": entry.activity_id,
            "status": entry.status,
            "position": entry.position,
            "waitlist_type": entry.waitlist_type,
            "created_at": entry.created_at,
            "activity_name": actividad.name if actividad else None,
            "activity_schedule": actividad.schedule if actividad else None,
        })

    return resultado


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

    uid_copia = entry.user_id
    aid_copia = entry.activity_id

    def _notif_async(uid: int, aid: int) -> None:
        from app.utils.notifications import notify_waitlist_removed
        db_n = SessionLocal()
        try:
            notify_waitlist_removed(uid, aid, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(uid_copia, aid_copia), daemon=True).start()

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
                 PERO: si es actividad "individual", solo retorna cola "general" (no existe cola prioritaria).
    Escenario 2: retorna lista vacia si no hay inscriptos en ninguna cola.
    Las posiciones de cada cola son independientes entre si.
    """
    from app.models.activity import Activity
    
    # Obtener la actividad para verificar su tipo
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        return []
    
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

    resultado = []
    
    # Para actividades individuales, solo mostrar cola general
    if activity.activity_type == "individual":
        cola_general = db.query(Waitlist).filter(
            Waitlist.activity_id == activity_id,
            Waitlist.waitlist_type == "general",
            Waitlist.status == "waiting"
        ).order_by(Waitlist.position).all()
        
        for entrada in cola_general:
            cliente = db.query(User).filter(User.id == entrada.user_id).first()
            if cliente:
                resultado.append(_build_entry(entrada, cliente))
    else:
        # Para actividades fijas, mostrar ambas colas (priority primero)
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

        for entrada in cola_priority + cola_general:
            cliente = db.query(User).filter(User.id == entrada.user_id).first()
            if cliente:
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


# Promueve automáticamente al primero de la lista de espera cuando se libera un cupo
# (por cancelación de una reserva). Crea la reserva y reordena la cola afectada.
def promote_next_waitlist_entry(activity_id: int, db: Session):
    """Asigna la reserva liberada al primero de la lista de espera (prioridad: cola
    'priority' antes que 'general'). Devuelve la nueva Reservation o None si no había nadie."""
    from app.models.reservation import Reservation
    from app.models.activity import Activity
    from datetime import datetime as dt

    next_entry = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.status == "waiting",
        Waitlist.waitlist_type == "priority",
        Waitlist.position == 1
    ).first()

    if not next_entry:
        next_entry = db.query(Waitlist).filter(
            Waitlist.activity_id == activity_id,
            Waitlist.status == "waiting",
            Waitlist.waitlist_type == "general",
            Waitlist.position == 1
        ).first()

    if not next_entry:
        return None

    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        return None

    reservation_date = dt.now()
    if actividad.specific_date and actividad.time_slot:
        try:
            hh, mm = actividad.time_slot.split(":")
            reservation_date = dt(
                actividad.specific_date.year, actividad.specific_date.month, actividad.specific_date.day,
                int(hh), int(mm),
            )
        except (ValueError, AttributeError):
            pass

    # El pago que hizo al anotarse define cómo queda la reserva. El abonado entró sin
    # pagar y su reserva queda confirmada por el beneficio de abonado; el no abonado ya
    # abonó el total (confirmada) o una seña (pendiente por el resto).
    if next_entry.payment_status == "completed":
        estado, estado_pago = "confirmed", "completed"
        deposito = next_entry.deposit_percent or 100
    elif next_entry.payment_status == "partial":
        estado, estado_pago = "pending", "partial"
        deposito = next_entry.deposit_percent
    else:
        abonado = is_abonado(next_entry.user_id, db)
        estado = "confirmed" if abonado else "pending"
        estado_pago = "completed" if abonado else "pending"
        deposito = None

    nueva_reserva = Reservation(
        user_id=next_entry.user_id,
        activity_id=activity_id,
        reservation_type=actividad.activity_type,
        status=estado,
        payment_status=estado_pago,
        reservation_date=reservation_date,
        deposit_percent=deposito,
    )
    db.add(nueva_reserva)

    removed_position = next_entry.position
    tipo_cola = next_entry.waitlist_type
    next_entry.status = "converted"
    db.commit()
    db.refresh(nueva_reserva)

    # Re-ordenar posiciones restantes de la misma cola
    remaining_entries = db.query(Waitlist).filter(
        Waitlist.activity_id == activity_id,
        Waitlist.waitlist_type == tipo_cola,
        Waitlist.position > removed_position,
        Waitlist.status == "waiting"
    ).order_by(Waitlist.position).all()

    for idx, remaining_entry in enumerate(remaining_entries):
        remaining_entry.position = removed_position + idx

    db.commit()

    return nueva_reserva
