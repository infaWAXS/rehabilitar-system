from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException

from app.models.activity import Activity
from app.models.room import Room
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.esquema_reservas import ClientConditionResponse


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


def crear_actividad(datos, db: Session) -> Activity:
    """Crea una actividad validando que los cupos no superen la capacidad de la sala."""
    sala = db.query(Room).filter(Room.id == datos.room_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    if datos.capacity > sala.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Los cupos ({datos.capacity}) no pueden superar la capacidad de la sala ({sala.capacity})",
        )

    actividad = Activity(**datos.model_dump())
    db.add(actividad)
    db.commit()
    db.refresh(actividad)
    return actividad


def editar_actividad(activity_id: int, datos, db: Session) -> Activity:
    """Actualiza campos de una actividad validando la capacidad si se modifica."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    cambios = datos.model_dump(exclude_unset=True)

    if "capacity" in cambios:
        sala = db.query(Room).filter(Room.id == actividad.room_id).first()
        if cambios["capacity"] > sala.capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Los cupos ({cambios['capacity']}) no pueden superar la capacidad de la sala ({sala.capacity})",
            )

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
