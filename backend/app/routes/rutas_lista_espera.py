# Responsable: Agustin (modulo lista de espera)
# HUs Listar lista de espera / Dar de baja en lista de espera: Nahuel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from app.models.waitlist import Waitlist
from app.schemas.esquema_reservas import WaitlistCreate, WaitlistResponse, WaitlistDetailResponse
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.services.servicio_lista_espera import (
    add_to_waitlist,
    get_user_waitlist,
    get_waitlist_entry,
    remove_from_waitlist,
    get_activity_waitlist,
    notify_next_in_waitlist
)

router = APIRouter(prefix="/waitlist", tags=["Lista de espera"])


# Añadir a lista de espera
@router.post("", response_model=WaitlistResponse)
def add_user_to_waitlist(
    request: WaitlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return add_to_waitlist(current_user.id, request.activity_id, db,
                           deposit_percent=request.deposit_percent)


# Obtener mi lista de espera
@router.get("/me", response_model=list[WaitlistResponse])
def get_my_waitlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_waitlist(current_user.id, db)


# HU: Listar lista de espera - admin y recepcionista (usuarios autorizados)
# Escenario 1: retorna lista con prioridad y datos de contacto
# Escenario 2: retorna lista vacia si no hay inscriptos
@router.get("/activity/{activity_id}", response_model=list[WaitlistDetailResponse])
def get_activity_waitlist_endpoint(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.utils.dependencies import require_role
    require_role(["admin", "receptionist"])(current_user)
    
    return get_activity_waitlist(activity_id, db)


# Obtener entrada específica de lista de espera
@router.get("/{waitlist_id}", response_model=WaitlistResponse)
def get_waitlist_entry_endpoint(
    waitlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = get_waitlist_entry(waitlist_id, db)
    
    # Verificar que el usuario sea el propietario o admin
    if entry.user_id != current_user.id and current_user.role != "admin":
        from app.exceptions.http_exceptions import forbidden_exception
        raise forbidden_exception()
    
    return entry


# Dar de baja de lista de espera
@router.delete("/{waitlist_id}", response_model=WaitlistResponse)
def remove_user_from_waitlist(
    waitlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = get_waitlist_entry(waitlist_id, db)
    
    # Verificar que el usuario sea el propietario o admin
    if entry.user_id != current_user.id and current_user.role != "admin":
        from app.exceptions.http_exceptions import forbidden_exception
        raise forbidden_exception()
    
    return remove_from_waitlist(waitlist_id, db)


# Notificar al siguiente en la lista de espera (solo admin)
@router.post("/activity/{activity_id}/notify-next", response_model=WaitlistResponse)
def notify_next_user(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.utils.dependencies import require_role
    require_role(["admin"])(current_user)
    
    next_user = notify_next_in_waitlist(activity_id, db)
    
    if not next_user:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="No hay usuarios en la lista de espera"
        )
    
    return next_user


@router.get("/health", tags=["Health"])
def waitlist_module_health():
    return {"module": "waitlist", "status": "ready"}

