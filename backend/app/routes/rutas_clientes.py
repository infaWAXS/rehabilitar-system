# Responsable: Nahuel - Rutas de gestion de clientes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services import servicio_clientes
from app.schemas.esquema_clientes import SuspendRequest, ReinstateRequest, ReintegrationRequest
from database.connection import get_db
from app.utils.dependencies import get_current_user, require_role
from app.exceptions.http_exceptions import forbidden_exception

router = APIRouter(prefix="/clients", tags=["Clientes"])


# HU: Listar clientes - solo admin y recepcionista
@router.get("")
def get_clients(token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin", "receptionist"])(current_user)
    return servicio_clientes.obtener_todos_los_clientes(db)


# HU: Listar condiciones de cliente por actividad - recepcionista y admin
# NOTA: esta ruta debe ir ANTES de /{id}/conditions para evitar conflictos de patron
@router.get("/activity/{activity_id}/conditions")
def get_conditions_by_activity(activity_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin", "receptionist"])(current_user)
    return servicio_clientes.listar_condiciones_por_actividad(activity_id, db)


# HU: Condiciones de un cliente especifico - solo admin y recepcionista
@router.get("/{id}/conditions")
def get_client_conditions(id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin", "receptionist"])(current_user)
    return servicio_clientes.obtener_condiciones_cliente(id, db)


# HU: Solicitar reintegro - solo el propio cliente con cuenta suspendida, motivo obligatorio
@router.post("/{id}/reintegration-request")
def post_reintegration_request(id: int, token: str, body: ReintegrationRequest, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    if current_user.role != "client" or current_user.id != id:
        raise forbidden_exception()
    return servicio_clientes.registrar_reintegro(id, body.motivo, db)


# HU: Suspender cuenta - solo admin, motivo obligatorio
@router.put("/{id}/suspend")
def put_suspend_client(id: int, token: str, body: SuspendRequest, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return servicio_clientes.suspender_cliente(id, body.motivo, db)


# HU: Reintegrar cuenta - solo admin, motivo opcional
@router.put("/{id}/reinstate")
def put_reinstate_client(id: int, token: str, body: ReinstateRequest, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return servicio_clientes.reincorporar_cliente(id, body.motivo, db)


# HU: Reintegrar cuenta - Escenario 3: admin rechaza la solicitud de reintegro
@router.put("/{id}/reject-reintegration")
def put_reject_reintegration(id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return servicio_clientes.rechazar_reintegro(id, db)
