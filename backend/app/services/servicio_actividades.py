from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from fastapi import HTTPException
from datetime import datetime
import re

from app.models.activity import Activity
from app.models.room import Room
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.esquema_reservas import ClientConditionResponse

DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


def _extraer_dias(schedule: Optional[str]) -> set[str]:
    if not schedule:
        return set()
    schedule_lower = schedule.lower()
    return {dia for dia in DIAS_SEMANA if dia.lower() in schedule_lower}
def _solapa_en_profesor(propuesta: Activity, existente: Activity) -> bool:
    """True si el mismo profesor tiene solapamiento horario en cualquier sala."""
    if not propuesta.professor or not existente.professor:
        return False
    if propuesta.professor.strip().lower() != existente.professor.strip().lower():
        return False

    dias_propuesta = _dias_actividad(propuesta)
    dias_existente = _dias_actividad(existente)
    if not dias_propuesta or not dias_existente or dias_propuesta.isdisjoint(dias_existente):
        return False

    inicio_propuesta, fin_propuesta = _rango_horario(propuesta)
    inicio_existente, fin_existente = _rango_horario(existente)
    if None in (inicio_propuesta, fin_propuesta, inicio_existente, fin_existente):
        return False

    return inicio_propuesta < fin_existente and inicio_existente < fin_propuesta


def _validar_disponibilidad_profesor(
    actividad_propuesta: Activity,
    db: Session,
    excluir_activity_id: Optional[int] = None,
) -> None:
    if not actividad_propuesta.professor or actividad_propuesta.status != "active":
        return

    actividades_existentes = (
        db.query(Activity)
        .filter(
            Activity.professor == actividad_propuesta.professor,
            Activity.status == "active",
        )
        .all()
    )

    for existente in actividades_existentes:
        if excluir_activity_id is not None and existente.id == excluir_activity_id:
            continue
        if _solapa_en_profesor(actividad_propuesta, existente):
            raise HTTPException(
                status_code=409,
                detail=f"El profesor {actividad_propuesta.professor} ya tiene una actividad asignada en ese horario.",
            )

def _dia_desde_fecha(specific_date) -> Optional[str]:
    if not specific_date:
        return None
    return DIAS_SEMANA[specific_date.weekday()]


def _parse_hora(texto: Optional[str]) -> Optional[int]:
    if not texto:
        return None
    match = re.search(r"(\d{1,2}):(\d{2})", texto)
    if not match:
        return None
    return int(match.group(1)) * 60 + int(match.group(2))


def _rango_horario(activity: Activity) -> tuple[Optional[int], Optional[int]]:
    if activity.activity_type == "individual":
        inicio = _parse_hora(activity.time_slot)
        if inicio is None:
            return None, None
        return inicio, inicio + 60

    coincidencias = re.findall(r"(\d{1,2}):(\d{2})", activity.schedule or "")
    if len(coincidencias) >= 2:
        inicio_h, inicio_m = coincidencias[0]
        fin_h, fin_m = coincidencias[1]
        return int(inicio_h) * 60 + int(inicio_m), int(fin_h) * 60 + int(fin_m)

    inicio = _parse_hora(activity.time_slot or activity.schedule)
    if inicio is None:
        return None, None
    return inicio, inicio + 60


def _dias_actividad(activity: Activity) -> set[str]:
    if activity.activity_type == "individual":
        dia = _dia_desde_fecha(activity.specific_date)
        return {dia} if dia else set()
    return _extraer_dias(activity.schedule)


def _solapa_en_sala(propuesta: Activity, existente: Activity) -> bool:
    if propuesta.room_id != existente.room_id:
        return False

    dias_propuesta = _dias_actividad(propuesta)
    dias_existente = _dias_actividad(existente)
    if not dias_propuesta or not dias_existente or dias_propuesta.isdisjoint(dias_existente):
        return False

    inicio_propuesta, fin_propuesta = _rango_horario(propuesta)
    inicio_existente, fin_existente = _rango_horario(existente)
    if None in (inicio_propuesta, fin_propuesta, inicio_existente, fin_existente):
        return False

    return inicio_propuesta < fin_existente and inicio_existente < fin_propuesta


def _validar_disponibilidad_sala(
    actividad_propuesta: Activity,
    db: Session,
    excluir_activity_id: Optional[int] = None,
) -> None:
    if actividad_propuesta.status != "active":
        return

    actividades_existentes = (
        db.query(Activity)
        .filter(
            Activity.room_id == actividad_propuesta.room_id,
            Activity.status == "active",
        )
        .all()
    )

    for existente in actividades_existentes:
        if excluir_activity_id is not None and existente.id == excluir_activity_id:
            continue
        if _solapa_en_sala(actividad_propuesta, existente):
            raise HTTPException(
                status_code=409,
                detail="La sala no está disponible para la fecha y hora seleccionadas porque ya existe una actividad programada.",
            )


def listar_actividades(
    room_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    status: Optional[str] = "active",
    db: Session = None,
) -> List[Activity]:
    """Lista actividades con filtros opcionales por sala, tipo y estado."""
    query = db.query(Activity)
    if room_id is not None:
        query = query.filter(Activity.room_id == room_id)
    if activity_type is not None:
        query = query.filter(Activity.activity_type == activity_type)
    if status is not None:
        query = query.filter(Activity.status == status)
    return query.order_by(Activity.id).all()


def obtener_actividad(activity_id: int, db: Session) -> Activity:
    """Obtiene una actividad por ID."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return actividad


def obtener_disponibilidad_actividad(activity_id: int, db: Session) -> dict:
    """Devuelve capacidad total, reservas activas y cupos disponibles de una actividad."""
    actividad = obtener_actividad(activity_id, db)

    reserved_count = (
        db.query(func.count(Reservation.id))
        .filter(
            Reservation.activity_id == activity_id,
            Reservation.status != "cancelled",
        )
        .scalar()
    ) or 0

    available_spots = max(int(actividad.capacity) - int(reserved_count), 0)
    return {
        "activity_id": actividad.id,
        "capacity": int(actividad.capacity),
        "reserved_count": int(reserved_count),
        "available_spots": int(available_spots),
    }


def crear_actividad(datos, db: Session) -> Activity:
    """Crea una actividad validando que los cupos no superen la capacidad de la sala y que la sala esté disponible."""
    sala = db.query(Room).filter(Room.id == datos.room_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    if datos.capacity > sala.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Los cupos ({datos.capacity}) no pueden superar la capacidad de la sala ({sala.capacity})",
        )

    actividad = Activity(**datos.model_dump())
    actividad.status = "active"
    _validar_disponibilidad_sala(actividad, db)
    _validar_disponibilidad_profesor(actividad, db)
    db.add(actividad)
    db.commit()
    db.refresh(actividad)
    return actividad


def editar_actividad(activity_id: int, datos, db: Session) -> Activity:
    """Actualiza campos de una actividad validando capacidad y disponibilidad de la sala."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    cambios = datos.model_dump(exclude_unset=True)

    valores_propuestos = {
        **{
            "room_id": actividad.room_id,
            "activity_type": actividad.activity_type,
            "schedule": actividad.schedule,
            "specific_date": actividad.specific_date,
            "time_slot": actividad.time_slot,
            "status": actividad.status,
            
        },
        **cambios,
    }

    actividad_propuesta = Activity(
        id=actividad.id,
        room_id=valores_propuestos["room_id"],
        activity_type=valores_propuestos["activity_type"],
        schedule=valores_propuestos["schedule"],
        specific_date=valores_propuestos["specific_date"],
        time_slot=valores_propuestos["time_slot"],
        status=valores_propuestos["status"],
    )

    if "capacity" in cambios:
        sala = db.query(Room).filter(Room.id == valores_propuestos["room_id"]).first()
        if cambios["capacity"] > sala.capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Los cupos ({cambios['capacity']}) no pueden superar la capacidad de la sala ({sala.capacity})",
            )

    _validar_disponibilidad_sala(actividad_propuesta, db, excluir_activity_id=actividad.id)
    _validar_disponibilidad_profesor(actividad_propuesta, db, excluir_activity_id=actividad.id)
    for campo, valor in cambios.items():
        setattr(actividad, campo, valor)

    db.commit()
    db.refresh(actividad)
    return actividad


def cancelar_actividad(activity_id: int, db: Session) -> None:
    """Marca una actividad como cancelada."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # No permitir cancelar si la actividad ya comenzó.
    ahora = datetime.now()

    if actividad.activity_type == "individual":
        if actividad.specific_date and actividad.time_slot:
            try:
                hh, mm = actividad.time_slot.split(":")
                inicio_dt = datetime(actividad.specific_date.year, actividad.specific_date.month, actividad.specific_date.day, int(hh), int(mm))
                if inicio_dt <= ahora:
                    raise HTTPException(status_code=400, detail="No se puede cancelar: la actividad ya comenzó.")
            except Exception:
                # Si no se puede parsear la hora, seguimos con la cancelación por compatibilidad
                pass
    else:
        # Clase fija: si hoy es uno de los días de la actividad y el horario ya empezó, bloquear cancelación
        dias = _dias_actividad(actividad)
        if dias:
            dia_hoy = DIAS_SEMANA[ahora.weekday()]
            if dia_hoy in dias:
                inicio, fin = _rango_horario(actividad)
                if inicio is not None:
                    ahora_min = ahora.hour * 60 + ahora.minute
                    if inicio <= ahora_min < fin:
                        raise HTTPException(status_code=400, detail="No se puede cancelar: la actividad ya comenzó.")

    actividad.status = "cancelled"
    db.commit()


def listar_clientes_actividad(activity_id: int, db: Session) -> List[ClientConditionResponse]:
    """Lista los clientes inscriptos en una actividad con su condición de acceso."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    registros = (
        db.query(Reservation, User)
        .join(User, Reservation.user_id == User.id)
        .filter(
            Reservation.activity_id == activity_id,
            Reservation.status.in_(["pending", "confirmed"]),
        )
        .all()
    )

    resultado = []
    for res, user in registros:
        resultado.append(
            ClientConditionResponse(
                user_id=user.id,
                name=user.name,
                lastname=user.lastname,
                email=user.email,
                reservation_type=res.reservation_type,
                payment_status=res.payment_status,
                es_abonado=(res.reservation_type == "fixed"),
            )
        )
    return resultado
    
