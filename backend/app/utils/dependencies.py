# # Responsable legacy: Francis y Agustin - dependencias de autenticacion/autorizacion.
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from database.connection import get_db

from app.models.user import User

from app.utils.security import verify_token
from app.exceptions.http_exceptions import unauthorized_exception, forbidden_exception, user_not_found_exception


#Esto es para obtener el token limpio del usuario
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user( token: str, db: Session = Depends(get_db)):
    
    email = verify_token(token)
    
    if not email:
        raise unauthorized_exception()
    
    
        
    user = db.query(User).filter(
        User.email == email
    ).first()
    
    if not user:
        raise user_not_found_exception()

    return user


#Esto es para verificar el rol del usuario, si el rol del usuario no está en la lista de roles permitidos, lanza una excepción HTTP 403.    
#La función require_role se puede usar en las rutas para protegerlas y permitir el acceso solo a usuarios con ciertos roles.  
def require_role(allowed_roles: list):

    def role_checker(current_user = Depends(get_current_user)):

        if current_user.role not in allowed_roles:
           raise forbidden_exception()

        return current_user
    

    return role_checker


def verify_user_ownership(current_user, user_id: int):

    if current_user.id != user_id:
        raise forbidden_exception()


