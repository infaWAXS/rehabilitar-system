# Responsable legacy: Francis y Agustin - autenticacion (registro/login).
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database.connection import get_db
from app.models.user import User
from app.schemas.esquema_usuario import UserCreate, UserLogin, UserResponse
from app.utils.dependencies import get_current_user, require_role
from app.utils.security import hash_password, verify_password, create_access_token, verify_token

from app.services.servicio_usuarios import register_user, login_user





router = APIRouter(tags=["Autenticación"])



#### REGISTRAR
# Agregar usuario a la base de datos.
@router.post("/users")
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

