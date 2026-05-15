from fastapi import APIRouter

from database.connection import SessionLocal
from app.models.user import User
from app.schemas.userSchema import UserCreate
from app.utils.security import hash_password

router = APIRouter()

@router.post("/users")
def create_user(user: UserCreate):
    
    db = SessionLocal()
    
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
    
    
    
@router.get("/users")
def get_users():

    db = SessionLocal()

    users = db.query(User).all()

    return users