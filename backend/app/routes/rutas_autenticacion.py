# Responsable legacy: Francis y Agustin - autenticacion (registro/login).
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database.connection import get_db
from app.models.user import User
from app.schemas.esquema_usuario import UserCreate, UserLogin, UserResponse, PasswordRecoveryRequest, PasswordResetRequest, StaffPublicResponse
from app.utils.dependencies import get_current_user, require_role
from app.utils.security import hash_password, verify_password, create_access_token, verify_token

from app.services.servicio_usuarios import register_user, login_user, request_password_recovery, reset_password, get_public_staff, get_staff_specializations





router = APIRouter(tags=["Autenticación"])



#### REGISTRAR
# Agregar usuario a la base de datos.
@router.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):   
    return register_user(user, db)
    
    
    
    
    
    
    
    
#Obtener usuarios de la base de datos
@router.get("/users")
def get_users(db: Session = Depends(get_db)):

    users = db.query(User).all()

    return users





@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user, db)


# Endpoint para solicitar recuperación de contraseña
@router.post("/auth/recovery/request")
def request_password_reset(request: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    return request_password_recovery(request.email, db)


# Endpoint para restablecer contraseña con token
@router.post("/auth/recovery/reset")
def reset_user_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    return reset_password(request.token, request.new_password, request.confirm_password, db)


# Endpoint para cerrar sesión (logout)
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {
        "message": "Sesión cerrada correctamente"
    }


# ── Endpoints públicos de staff ─────────────────────────────────────────────

# Lista pública de empleados activos con búsqueda por nombre y filtro por especialización.
@router.get("/staff", response_model=list[StaffPublicResponse])
def get_staff(db: Session = Depends(get_db), search: str = None, specialization: str = None):
    return get_public_staff(db, search=search, specialization=specialization)


# Devuelve las especializaciones disponibles de profesores activos para el filtro.
@router.get("/staff/specializations")
def list_staff_specializations(db: Session = Depends(get_db)):
    return get_staff_specializations(db)

