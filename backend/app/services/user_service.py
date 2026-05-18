from urllib import request

from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.models.user import User

from app.utils.security import hash_password, verify_password, create_access_token
from app.exceptions.http_exceptions import email_already_exists_exception, unauthorized_exception, forbidden_exception, user_not_found_exception


#Valida si el email ya existe, si no existe, hashea la contraseña y crea un nuevo usuario en la base de datos. 
#Si el email ya existe, lanza una excepción HTTP 409. 
#Si el usuario se crea correctamente, devuelve un mensaje de éxito. 
def register_user(user_data, db: Session):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:

        raise email_already_exists_exception()

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        name=user_data.name,
        lastname=user_data.lastname,
        email=user_data.email,
        password=hashed_password
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "Usuario creado correctamente"
    }
   
    
#Valida si el email existe en la base de datos, si no existe, lanza una excepción HTTP 404. 
#Si el email existe, verifica si la contraseña es correcta. 
#Si la contraseña es incorrecta, lanza una excepción HTTP 401. 
#Si la contraseña es correcta, genera un token de acceso JWT y lo devuelve en la respuesta.       
def login_user(user_data, db: Session):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not existing_user:

        raise user_not_found_exception()

    password_correct = verify_password(
        user_data.password,
        existing_user.password
    )

    if not password_correct:

        raise unauthorized_exception()
    
    access_token = create_access_token(
        data={
            "sub": existing_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
    

#Cambia la contraseña del usuario actual. 
def change_password(current_user: User, new_password: str, confirm_password: str, db: Session):
    if new_password != confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Las contraseñas no coinciden"
        )

    hashed_password = hash_password(new_password)

    current_user.password = hashed_password

    db.commit()

    return {
        "message": "Contraseña cambiada correctamente"
    }
    
def update_user_info(current_user: User, name: str, lastname: str, db: Session):
    if request.name is not None:
        current_user.name = request.name

    if request.lastname is not None:
        current_user.lastname = request.lastname
        
        

