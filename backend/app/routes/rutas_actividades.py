from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database.connection import get_db
from app.models.activity import Activity
from app.models.room import Room
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.esquema_actividad import ActivityCreate, ActivityUpdate, ActivityResponse
from app.schemas.esquema_reservas import ClientConditionResponse
from app.utils.dependencies import require_role, get_current_user

router = APIRouter(prefix="/activities", tags=["activities"])


# ── Listado ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ActivityResponse])
def listar_actividades(
    room_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    status: Optional[str] = "active",
    db: Session = Depends(get_db),
):
    """Lista actividades. Acepta filtros por sala, tipo y estado."""
    query = db.query(Activity)
    if room_id is not None:
        query = query.filter(Activity.room_id == room_id)
    if activity_type is not None:
        query = query.filter(Activity.activity_type == activity_type)
    if status is not None:
        query = query.filter(Activity.status == status)
    return query.order_by(Activity.id).all()


@router.get("/{activity_id}", response_model=ActivityResponse)
def obtener_actividad(activity_id: int, db: Session = Depends(get_db)):
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return actividad


# ── Crear ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=ActivityResponse, status_code=201)
def crear_actividad(
    datos: ActivityCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Solo administradores. Crea una actividad en una sala."""
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


# ── Editar ─────────────────────────────────────────────────────────────────────

@router.patch("/{activity_id}", response_model=ActivityResponse)
def editar_actividad(
    activity_id: int,
    datos: ActivityUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Actualiza campos de una actividad existente."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    cambios = datos.model_dump(exclude_unset=True)

    # Validar cupos contra capacidad de sala (si se actualiza capacity)
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


# ── Cancelar ───────────────────────────────────────────────────────────────────

@router.delete("/{activity_id}", status_code=204)
def cancelar_actividad(
    activity_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Marca la actividad como cancelada (no la elimina físicamente)."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    actividad.status = "cancelled"
    db.commit()


# ── Listar condiciones de cliente ──────────────────────────────────────────────

# HU Listar condiciones de cliente (Nahuel)
# E1: hay inscriptos → retorna lista con condición de acceso por cliente
# E2: sin inscriptos → retorna lista vacía []
@router.get("/{activity_id}/clients", response_model=List[ClientConditionResponse])
def listar_clientes_actividad(
    activity_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    """Admin/recepcionista: lista los clientes inscriptos en una actividad con su condición de acceso."""
    current_user = get_current_user(token, db)
    require_role(["admin", "receptionist"])(current_user)

    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # E1: join Reservation → User para inscriptos activos
    registros = (
        db.query(Reservation, User)
        .join(User, Reservation.user_id == User.id)
        .filter(
            Reservation.activity_id == activity_id,
            Reservation.status.in_(["pending", "confirmed"]),
        )
        .all()
    )

    # E2: lista vacía si no hay inscriptos
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
