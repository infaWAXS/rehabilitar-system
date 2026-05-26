# Responsable: Nahuel - Rutas de gestion de clientes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services import servicio_clientes
from app.schemas.esquema_clientes import SuspendRequest, ReinstateRequest, ReintegrationRequest
from database.connection import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user, require_role
from app.exceptions.http_exceptions import forbidden_exception

router = APIRouter(prefix="/clients", tags=["Clientes"])


# HU: Listar clientes - solo admin y recepcionista
@router.get("")
def get_clients(token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin", "receptionist"])(current_user)
    return servicio_clientes.obtener_todos_los_clientes(db)


# HU Solicitar reintegro (Nahuel) - flujo JWT seguro
# Verifica estado de la cuenta del usuario autenticado (GET con token como query param)
@router.get("/reintegration/status")
def get_reintegration_status(token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    return servicio_clientes.verificar_estado_y_tiempo_reintegro(current_user, db)


# Registra la solicitud de reintegro usando identidad del usuario autenticado
@router.post("/reintegration/submit")
def post_reintegration_submit(token: str, body: ReintegrationRequest, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    return servicio_clientes.registrar_reintegro_jwt(current_user, body.motivo, db)


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


# HU Solicitar reintegro de cuenta (Nahuel)
# E1: motivo ingresado + cuenta suspendida → solicitud registrada, estado = "pending_reintegration"
# E2: motivo vacío → validación automática por SuspendRequest (Field min_length=1)
# E3: cuenta no suspendida → 400 Bad Request
@router.post("/{id}/reintegration-request")
def post_reintegration_request(id: int, token: str, body: ReintegrationRequest, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    if current_user.role != "client" or current_user.id != id:
        raise forbidden_exception()
    return servicio_clientes.registrar_reintegro(id, body.motivo, db)


# HU Suspender cuenta (Nahuel)
# E1: motivo ingresado → cuenta pasa a "suspended", notificación mail (TODO)
# E2: cancelar → manejado en frontend, no llega al backend
# E3: motivo vacío → validación automática por SuspendRequest (Field min_length=1)
@router.put("/{id}/suspend")
def put_suspend_client(id: int, token: str, body: SuspendRequest, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return servicio_clientes.suspender_cliente(id, body.motivo, db)


# HU Reintegrar cuenta (Nahuel)
# E1: con solicitud pendiente → admin aprueba, cuenta pasa a "active", notificación mail (TODO)
# E2: sin solicitud previa → admin reintegra directamente, mismo resultado
# E3: rechazo → ver endpoint /reject-reintegration
@router.put("/{id}/reinstate")
def put_reinstate_client(id: int, token: str, body: ReinstateRequest, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return servicio_clientes.reincorporar_cliente(id, body.motivo, db)


# HU Reintegrar cuenta - Escenario 3: admin rechaza la solicitud de reintegro
# E3: cuenta vuelve a "suspended", notificación mail al cliente (TODO)
@router.put("/{id}/reject-reintegration")
def put_reject_reintegration(id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return servicio_clientes.rechazar_reintegro(id, db)
