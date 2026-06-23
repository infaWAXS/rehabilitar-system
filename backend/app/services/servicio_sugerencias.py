
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException
from decimal import Decimal
from datetime import date as date_cls

from app.models.activity_suggestion import ActivitySuggestion
from app.models.room import Room
from app.schemas.esquema_sugerencias import SuggestionCreate, SuggestionResponse
from app.schemas.esquema_actividad import ActivityCreate
from app.services import servicio_actividades
from app.utils.notifications import (
    notify_activity_suggestion_created,
    notify_activity_suggestion_accepted,
    notify_activity_suggestion_rejected,
)


def _serializar_fechas(fechas: Optional[List[date_cls]]) -> Optional[str]:
    if not fechas:
        return None
    return ",".join(f.isoformat() for f in fechas)


def _deserializar_fechas(texto: Optional[str]) -> Optional[List[date_cls]]:
    if not texto:
        return None
    return [date_cls.fromisoformat(parte) for parte in texto.split(",") if parte]


def _a_response(sugerencia: ActivitySuggestion) -> SuggestionResponse:
    return SuggestionResponse(
        id=sugerencia.id,
        professor_id=sugerencia.professor_id,
        professor_name=f"{sugerencia.professor.name} {sugerencia.professor.lastname}",
        room_id=sugerencia.room_id,
        room_name=sugerencia.room.name,
        name=sugerencia.name,
        specialization=sugerencia.specialization,
        activity_type=sugerencia.activity_type,
        schedule=sugerencia.schedule,
        specific_date=sugerencia.specific_date,
        time_slot=sugerencia.time_slot,
        dates=_deserializar_fechas(sugerencia.dates),
        capacity=sugerencia.capacity,
        description=sugerencia.description,
        requirements=sugerencia.requirements,
        status=sugerencia.status,
        created_at=sugerencia.created_at,
    )


def crear_sugerencia(datos: SuggestionCreate, current_user, db: Session) -> SuggestionResponse:
    """El profesor autenticado sugiere una nueva actividad."""
    sala = db.query(Room).filter(Room.id == datos.room_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    if datos.capacity > sala.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Los cupos ({datos.capacity}) no pueden superar la capacidad de la sala ({sala.capacity})",
        )

    sugerencia = ActivitySuggestion(
        professor_id=current_user.id,
        room_id=datos.room_id,
        name=datos.name,
        specialization=datos.specialization,
        activity_type=datos.activity_type,
        schedule=datos.schedule,
        specific_date=datos.specific_date,
        time_slot=datos.time_slot,
        dates=_serializar_fechas(datos.dates),
        capacity=datos.capacity,
        description=datos.description,
        requirements=datos.requirements,
        status="pending",
    )
    db.add(sugerencia)
    db.commit()
    db.refresh(sugerencia)

    notify_activity_suggestion_created(sugerencia, db)

    return _a_response(sugerencia)


def listar_sugerencias_pendientes(db: Session) -> List[SuggestionResponse]:
    """Lista las sugerencias que todavía no fueron aceptadas ni rechazadas."""
    sugerencias = (
        db.query(ActivitySuggestion)
        .filter(ActivitySuggestion.status == "pending")
        .order_by(ActivitySuggestion.id)
        .all()
    )
    return [_a_response(s) for s in sugerencias]


def _obtener_sugerencia_pendiente(suggestion_id: int, db: Session) -> ActivitySuggestion:
    sugerencia = db.query(ActivitySuggestion).filter(ActivitySuggestion.id == suggestion_id).first()
    if not sugerencia:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada")
    if sugerencia.status != "pending":
        raise HTTPException(status_code=409, detail="Esta sugerencia ya fue procesada")
    return sugerencia


def aceptar_sugerencia(suggestion_id: int, price: Decimal, db: Session):
    """
    Convierte la sugerencia en una Activity real, asigna al profesor
    y deja la clase disponible para que los clientes se inscriban.
    """
    sugerencia = _obtener_sugerencia_pendiente(suggestion_id, db)
    profesor = sugerencia.professor

    datos_actividad = ActivityCreate(
        room_id=sugerencia.room_id,
        name=sugerencia.name or sugerencia.specialization,
        specialization=sugerencia.specialization,
        activity_type=sugerencia.activity_type,
        schedule=sugerencia.schedule,
        specific_date=sugerencia.specific_date,
        time_slot=sugerencia.time_slot,
        dates=_deserializar_fechas(sugerencia.dates),
        professor=f"{profesor.name} {profesor.lastname}",
        price=price,
        capacity=sugerencia.capacity,
        description=sugerencia.description,
        requirements=sugerencia.requirements,
    )

    actividades = servicio_actividades.crear_actividad(datos_actividad, db)

    sugerencia.status = "accepted"
    db.commit()

    notify_activity_suggestion_accepted(sugerencia, db)

    return actividades


def rechazar_sugerencia(suggestion_id: int, db: Session) -> SuggestionResponse:
    sugerencia = _obtener_sugerencia_pendiente(suggestion_id, db)
    sugerencia.status = "rejected"
    db.commit()
    db.refresh(sugerencia)

    notify_activity_suggestion_rejected(sugerencia, db)

    return _a_response(sugerencia)