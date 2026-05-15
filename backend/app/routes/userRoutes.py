from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends

from database.connection import get_db
from app.models.user import User
from app.schemas.userSchema import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password


router = APIRouter()

# Agregar usuario a la base de datos. Este es el registrar
@router.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    
    
    
    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )
    
    db.add(new_user)
    db.commit()

    return {
        "message": "Usuario guardado"
    }
    
    
    
#Obtener usuarios de la base de datos
@router.get("/users")
def get_users(db: Session = Depends(get_db)):


    users = db.query(User).all()

    return users


#Login. Acá vamos a comparar los usuarios que se loguean con los de la base de datos
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()
    
    if not existing_user:
        return {"message": "Usuario no encontrado"}
    
    password_correct = verify_password(
        user.password,
        existing_user.password
    )
    
    if not password_correct:
        return {"message": "Contraseña incorrecta"}

    return {"message": "Login exitoso"}








