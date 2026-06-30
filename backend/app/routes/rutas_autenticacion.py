# Responsable: Agustin - endpoints de registro e inicio de sesion.
# Francis: recuperacion de contrasena, logout, staff.
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database.connection import get_db
from app.models.user import User
from app.schemas.esquema_usuario import UserCreate, UserLogin, UserResponse, PasswordRecoveryRequest, PasswordResetRequest, StaffPublicResponse
from app.utils.dependencies import get_current_user, require_role
from app.utils.security import hash_password, verify_password, create_access_token, verify_token

from app.services.servicio_usuarios import register_user, login_user, request_password_recovery, reset_password, get_public_staff, get_staff_specializations





router = APIRouter(tags=["Autenticación"])



# HU Registrar usuario (Agustin)
# E1/E2/E3: crea cuenta → HTTP 201 + UserResponse. Foto DNI se sube por separado en POST /users/upload-dni
# E4: email duplicado → HTTP 409
# E5: password < 6 chars → HTTP 422 (validado por UserCreate schema)
@router.post("/register", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):   
    return register_user(user, db)
    
    
    
    
    
    
    
    
#Obtener usuarios de la base de datos
@router.get("/users")
def get_users(db: Session = Depends(get_db)):

    users = db.query(User).all()

    return users





# HU Iniciar sesion (Agustin)
# E1: OK → devuelve {access_token, role, name, lastname}
# E2: email no encontrado → HTTP 404
# E3: password incorrecta < 3 intentos → HTTP 401, incrementa contador
# E4: 3er intento → cuenta deshabilitada HTTP 401; TODO: enviar mail recuperacion
# E5: cuenta suspendida → HTTP 403
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user, db)


# Endpoint para solicitar recuperación de contraseña
@router.post("/recovery/request")
def request_password_reset(recovery_request: PasswordRecoveryRequest, http_request: Request, db: Session = Depends(get_db)):
    return request_password_recovery(recovery_request.email, http_request, db)


# Endpoint para validar token de recuperación de contraseña
@router.get("/recovery/validate")
def validate_recovery_token(token: str = Query(...)):
    email = verify_token(token)
    
    if not email:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )
    
    return {"valid": True, "email": email}


# Endpoint para restablecer contraseña con token
@router.post("/recovery/reset")
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

