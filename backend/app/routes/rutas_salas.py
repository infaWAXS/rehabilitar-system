from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from app.models.room import Room
from app.schemas.esquema_salas import RoomResponse

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/", response_model=List[RoomResponse])
def listar_salas(db: Session = Depends(get_db)):
    """Devuelve las 7 salas físicas del centro. Solo lectura."""
    return db.query(Room).order_by(Room.id).all()


@router.get("/{room_id}", response_model=RoomResponse)
def obtener_sala(room_id: int, db: Session = Depends(get_db)):
    """Detalle de una sala por ID."""
    from fastapi import HTTPException
    sala = db.query(Room).filter(Room.id == room_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return sala
