# Responsable: Agustin - logica de negocio de registro e inicio de sesion.
# Francis: resto de funciones de gestion de usuarios.
from urllib import request
from sqlalchemy import or_

from app.schemas.esquema_usuario import UserLogin
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.activity import Activity

from app.utils.security import hash_password, verify_password, create_access_token, verify_token
from app.exceptions.http_exceptions import email_already_exists_exception, unauthorized_exception, forbidden_exception, user_not_found_exception


#Valida si el email ya existe, si no existe, hashea la contraseña y crea un nuevo usuario en la base de datos. 
#Si el email ya existe, lanza una excepción HTTP 409. 
#Si el usuario se crea correctamente, devuelve un mensaje de éxito. 
# HU Registrar usuario (Agustin)
# E1/E2/E3: crea el usuario; la cuenta queda activa sin dni_verified hasta que el sistema externo valide la foto
# E4: email ya existe → lanza email_already_exists_exception (HTTP 409)
# E5: password < 6 chars → validado por el schema UserCreate (field_validator)
# E6: validacion DNI via foto → pendiente (upload en /users/upload-dni + sistema externo)
# E7: doble autenticacion (2FA via mail) → pendiente de implementar
def register_user(user_data, db: Session):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise email_already_exists_exception()

    # Validar que profesores tengan especialidad asignada
    role = getattr(user_data, "role", "client") or "client"
    specialization = getattr(user_data, "specialization", None)

    if role == "professor" and not specialization:
        raise HTTPException(
            status_code=400,
            detail="Un profesor debe tener una especialidad asignada"
        )

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        name=user_data.name,
        lastname=user_data.lastname,
        email=user_data.email,
        password=hashed_password,
        role=role,
        dni=getattr(user_data, "dni", None),
        direccion=getattr(user_data, "direccion", None),
        telefono=getattr(user_data, "telefono", None),
        specialization=specialization,
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user
   
    
#Valida si el email existe en la base de datos, si no existe, lanza una excepción HTTP 404. 
#Si el email existe, verifica si la contraseña es correcta. 
#Si la contraseña es incorrecta, lanza una excepción HTTP 401. 
#Si la contraseña es correcta, genera un token de acceso JWT y lo devuelve en la respuesta.       
# HU Iniciar sesion (Agustin)
# E1: credenciales OK + cuenta activa → reinicia failed_login_attempts, devuelve JWT
# E2: email no encontrado → user_not_found_exception (HTTP 404)
# E3: password incorrecta, intentos < 3 → incrementa failed_login_attempts, HTTP 401
# E4: 3er intento → account_status="disabled"; TODO (Agustin): enviar mail de recuperacion + reiniciar contador
# E5: cuenta suspendida → puede ingresar pero con funcionalidad limitada (ver banner en frontend)
# E5b: cuenta disabled → HTTP 403
def login_user(request: UserLogin, db: Session):


    existing_user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not existing_user:
        raise  HTTPException(
        status_code=401,
        detail="Email invalido"
    )
    

    if existing_user.account_status.lower() == "disabled":

        raise HTTPException(
            status_code=403,
            detail="Cuenta deshabilitada"
        )


    password_correct = verify_password(
        request.password,
        existing_user.password
    )
    
    if not password_correct:
        existing_user.failed_login_attempts += 1

        if existing_user.failed_login_attempts >= 3:
            existing_user.account_status = "disabled"

        db.commit()
        
        
        raise  HTTPException(
        status_code=401,
        detail="Contraseña invalida"
        )
    
    
    existing_user.failed_login_attempts = 0

    db.commit()
    
    access_token = create_access_token(
        data={
            "sub": existing_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": existing_user.role,
        "name": existing_user.name,
        "lastname": existing_user.lastname,
        "account_status": existing_user.account_status,
        "id": existing_user.id,
    }
    



# HU Cambiar contraseña (Agustin)
# E1: nueva contraseña válida + coinciden → hashea y guarda, responde 200
# E2: < 6 chars → validado por ChangePasswordRequest schema (field_validator)
# E3: no coinciden → HTTP 400 "Las contraseñas no coinciden"
# E4: cancelar → el front no llama a este endpoint
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
    
    
    
    
    
# Actualiza datos personales del usuario actual - Agustin
def update_user_info(current_user: User, name: str, lastname: str, direccion: str, telefono: str, db: Session, birth_date=None):
    if name is not None:
        current_user.name = name

    if lastname is not None:
        current_user.lastname = lastname

    if direccion is not None:
        current_user.direccion = direccion

    if telefono is not None:
        current_user.telefono = telefono

    if birth_date is not None:
        current_user.birth_date = birth_date

    db.commit()
    db.refresh(current_user)
    return current_user


#Devuelve una lista con todos los usuarios registrados en la base de datos. 
#Permite filtrar por rol y estado de cuenta. Solo los admins pueden acceder a esta ruta.
def get_all_users(db: Session, role: str = None, status: str = None):

    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if status: 
        query = query.filter(User.account_status == status)

    return query.all()


#Devuelve la información de un usuario específico por su ID.
def get_user_by_id(user_id: int, db: Session):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise user_not_found_exception()

    return user


#Cambia el estado de la cuenta de un usuario (activo o deshabilitado). Solo los admins pueden realizar esta acción.
def change_user_status(user_id: int, status: str, db: Session):
    
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise user_not_found_exception()
    user.account_status = status

    db.commit()

    db.refresh(user)

    return user
    
        

# HU Verificar apto físico (admin)
# E1: admin aprueba → medical_certificate_status = "approved"
# E2: admin desaprueba → medical_certificate_status = "rejected"
def change_medical_clearance_status(user_id: int, status: str, db: Session):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise user_not_found_exception()

    user.medical_certificate_status = status 

    db.commit()

    db.refresh(user)

    return user


# Genera un token de recuperación de contraseña para el usuario con el email especificado.
def request_password_recovery(email: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="El correo no está registrado en el sistema"
        )
    
    # Generar token con expiración de 1 hora
    recovery_token = create_access_token(
        data={"sub": user.email, "type": "recovery"}
    )
    
    return {
        "message": "Se ha enviado un enlace de recuperación a tu email",
        "token": recovery_token,
        "email": user.email
    }


# Restablece la contraseña del usuario usando un token válido.
def reset_password(token: str, new_password: str, confirm_password: str, db: Session):
    if new_password != confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Las contraseñas no coinciden"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    email = verify_token(token)
    
    if not email:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise user_not_found_exception()
    
    hashed_password = hash_password(new_password)
    user.password = hashed_password
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Contraseña restablecida correctamente"
    }


# Elimina permanentemente una cuenta de usuario (hard delete).
def delete_user(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise user_not_found_exception()

    name = f"{user.name} {user.lastname}"

    # E3: si es profesor, desvincular de todas sus actividades activas
    if user.role == "professor":
        db.query(Activity).filter(
            Activity.professor == name,
            Activity.status == "active",
        ).update({Activity.professor: None}, synchronize_session=False)

    db.delete(user)
    db.commit()

    return {"message": f"Cuenta de {name} eliminada correctamente"}


# Busca usuarios por nombre, email o DNI con filtros opcionales.
def search_users(db: Session, search: str = None, role: str = None, status: str = None, roles: list = None):
    query = db.query(User)

    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.lastname.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.dni.ilike(f"%{search}%")
            )
        )

    if roles:
        query = query.filter(User.role.in_(roles))
    elif role:
        query = query.filter(User.role == role)

    if status:
        query = query.filter(User.account_status == status)

    return query.all()


# HU: Modificar información de usuario.
# Escenario 1: modifica nombre, apellido, email de cualquier usuario.
# Escenario 2: modifica especialización de un profesor.
# Escenario 3: al cambiar especialización de un profesor con clases activas, debe
#              desvincularlo. Pendiente de implementación hasta que el módulo de
#              actividades (Angel) esté disponible.
# Escenario 4: cancelación — comportamiento del frontend, no requiere lógica de backend.
def modify_employee(employee_id: int, name: str = None, lastname: str = None, email: str = None, specialization: str = None, direccion: str = None, telefono: str = None, db: Session = None):
    employee = db.query(User).filter(User.id == employee_id).first()

    if not employee:
        raise user_not_found_exception()

    if name is not None:
        employee.name = name

    if lastname is not None:
        employee.lastname = lastname

    if email is not None and email != employee.email:
        existing = db.query(User).filter(User.email == email, User.id != employee_id).first()
        if existing:
            raise email_already_exists_exception()
        employee.email = email

    if specialization is not None:
        # Solo los profesores pueden tener especialidad asignada
        if employee.role != "professor":
            raise HTTPException(
                status_code=400,
                detail="Solo los profesores pueden tener una especialización asignada"
            )
        # E3: desvincular al profesor de todas sus clases activas cuando cambia la especialización
        if specialization != employee.specialization:
            nombre_profesor = f"{employee.name} {employee.lastname}"
            db.query(Activity).filter(
                Activity.professor == nombre_profesor,
                Activity.status == "active",
            ).update({Activity.professor: None}, synchronize_session=False)
        employee.specialization = specialization

    if direccion is not None:
        employee.direccion = direccion

    if telefono is not None:
        employee.telefono = telefono

    db.commit()
    db.refresh(employee)

    return employee


# Devuelve la lista pública de staff activo (profesores y recepcionistas) con filtros opcionales.
def get_public_staff(db: Session, search: str = None, specialization: str = None):
    query = db.query(User).filter(
        User.role.in_(["professor", "receptionist"]),
        User.account_status == "active"
    )

    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.lastname.ilike(f"%{search}%")
            )
        )

    if specialization:
        query = query.filter(User.specialization.ilike(f"%{specialization}%"))

    return query.all()


# Devuelve las especializaciones distintas de los profesores activos.
def get_staff_specializations(db: Session) -> list:
    rows = (
        db.query(User.specialization)
        .filter(
            User.role == "professor",
            User.specialization.isnot(None),
            User.account_status == "active"
        )
        .distinct()
        .all()
    )
    return [r[0] for r in rows if r[0]]



