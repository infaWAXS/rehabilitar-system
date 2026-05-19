from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from app.models.room import Room

router = APIRouter(prefix="/rooms", tags=["Salas"])

@router.get("")
def list_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()
