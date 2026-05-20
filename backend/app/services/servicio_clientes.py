# backend/app/services/servicio_clientes.py
from sqlalchemy.orm import Session
from app.models.user import User  # Importación directa sin 'app.'
from fastapi import HTTPException

def obtener_todos_los_clientes(db: Session):
    return db.query(User).filter(User.role == "client").all()

def obtener_condiciones_cliente(cliente_id: int, db: Session):  # <-- Agregado db: Session
    # Buscamos al usuario que sea cliente por su ID
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Devolvemos un mock de las condiciones usando sus datos reales
    return {
        "cliente_id": cliente.id, 
        "nombre": f"{cliente.name} {cliente.lastname}", 
        "condiciones": "Tratamiento de rehabilitación física en curso"
    }

def registrar_reintegro(cliente_id: int, db: Session):  # <-- Agregado db: Session
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    return {"status": "success", "mensaje": f"Solicitud de reintegro registrada correctamente para {cliente.name}"}

def suspender_cliente(cliente_id: int, db: Session):  # <-- Agregado db: Session
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Cambiamos el estado de la cuenta usando la columna real de tu modelo
    cliente.account_status = "suspended"
    db.commit()
    db.refresh(cliente)
    
    return {"status": "success", "mensaje": f"Cliente {cliente.name} suspendido correctamente"}

def reincorporar_cliente(cliente_id: int, db: Session):  # <-- Agregado db: Session
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Volvemos a activarlo
    cliente.account_status = "active"
    db.commit()
    db.refresh(cliente)
    
    return {"status": "success", "mensaje": f"Cliente {cliente.name} reincorporado correctamente"}