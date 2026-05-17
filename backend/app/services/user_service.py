from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.models.user import User

from app.utils.security import hash_password, verify_password, create_access_token

def register_user(user_data, db: Session):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=409,
            detail="El email ya está registrado"
        )

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
    
    
def login_user(user_data, db: Session):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not existing_user:

        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    password_correct = verify_password(
        user_data.password,
        existing_user.password
    )

    if not password_correct:

        raise HTTPException(
            status_code=401,
            detail="Contraseña incorrecta"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }