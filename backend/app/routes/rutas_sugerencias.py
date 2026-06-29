from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from app.schemas.esquema_sugerencias import SuggestionCreate, SuggestionResponse, SuggestionAccept
from app.schemas.esquema_actividad import ActivityResponse
from app.utils.dependencies import require_role
from app.services import servicio_sugerencias

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.post("/", response_model=SuggestionResponse, status_code=201)
def sugerir_actividad(
    datos: SuggestionCreate,
    db: Session = Depends(get_db),
    current_user: object = Depends(require_role(["professor"])),
):
    """El profesor autenticado sugiere una nueva actividad."""
    return servicio_sugerencias.crear_sugerencia(datos, current_user, db)


@router.get("/pending", response_model=List[SuggestionResponse])
def listar_sugerencias_pendientes(
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Lista las sugerencias que esperan revisión del admin."""
    return servicio_sugerencias.listar_sugerencias_pendientes(db)


@router.patch("/{suggestion_id}/accept", response_model=List[ActivityResponse])
def aceptar_sugerencia(
    suggestion_id: int,
    datos: SuggestionAccept,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Acepta la sugerencia: crea la(s) actividad(es) real(es) y asigna al profesor."""
    return servicio_sugerencias.aceptar_sugerencia(suggestion_id, datos.price, db)


@router.patch("/{suggestion_id}/reject", response_model=SuggestionResponse)
def rechazar_sugerencia(
    suggestion_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_role(["admin"])),
):
    """Rechaza la sugerencia."""
    return servicio_sugerencias.rechazar_sugerencia(suggestion_id, db)