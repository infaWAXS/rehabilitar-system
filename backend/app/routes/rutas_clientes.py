# backend/app/routes/rutas_clientes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services import servicio_clientes

# IMPORTACIÓN CORRECTA APUNTANDO A CONNECTION:
from database.connection import get_db

router = APIRouter(prefix="/clients", tags=["Clientes"])

@router.get("")
def get_clients(db: Session = Depends(get_db)):
    return servicio_clientes.obtener_todos_los_clientes(db)

@router.get("/{id}/conditions")
def get_client_conditions(id: int, db: Session = Depends(get_db)):
    return servicio_clientes.obtener_condiciones_cliente(id, db)

@router.post("/{id}/reintegration-request")
def post_reintegration_request(id: int, db: Session = Depends(get_db)):
    return servicio_clientes.registrar_reintegro(id, db)

@router.put("/{id}/suspend")
def put_suspend_client(id: int, db: Session = Depends(get_db)):
    return servicio_clientes.suspender_cliente(id, db)

@router.put("/{id}/reinstate")
def put_reinstate_client(id: int, db: Session = Depends(get_db)):
    return servicio_clientes.reincorporar_cliente(id, db)
