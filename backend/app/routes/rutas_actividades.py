from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database.connection import get_db
from app.schemas.esquema_actividad import ActivityCreate, ActivityUpdate, ActivityResponse
from app.schemas.esquema_reservas import ClientConditionResponse
from app.utils.dependencies import require_role, get_current_user
from app.services import servicio_actividades

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/", response_model=List[ActivityResponse])
def listar_actividades(
    room_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    status: Optional[str] = "active",
    db: Session = Depends(get_db),
):
    """Lista actividades con filtros por sala, especialidad, tipo, días, horario, profesor, precio, cupos y estado."""

    return servicio_actividades.listar_actividades(room_id, activity_type, status, db)


@router.get("/{activity_id}", response_model=ActivityResponse)
def obtener_actividad(activity_id: int, db: Session = Depends(get_db)):
    return servicio_actividades.obtener_actividad(activity_id, db)


@router.post("/", response_model=ActivityResponse, status_code=201)
def crear_actividad(
    datos: ActivityCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Solo administradores. Crea una actividad en una sala."""
    return servicio_actividades.crear_actividad(datos, db)


@router.patch("/{activity_id}", response_model=ActivityResponse)
def editar_actividad(
    activity_id: int,
    datos: ActivityUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Actualiza campos de una actividad existente."""
    return servicio_actividades.editar_actividad(activity_id, datos, db)


@router.delete("/{activity_id}", status_code=204)
def cancelar_actividad(
    activity_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Marca la actividad como cancelada (no la elimina físicamente)."""
    servicio_actividades.cancelar_actividad(activity_id, db)


@router.get("/{activity_id}/clients", response_model=List[ClientConditionResponse])
def listar_clientes_actividad(
    activity_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    """Admin/recepcionista: lista los clientes inscriptos en una actividad con su condición de acceso."""
    current_user = get_current_user(token, db)
    require_role(["admin", "receptionist"])(current_user)
    return servicio_actividades.listar_clientes_actividad(activity_id, db)
