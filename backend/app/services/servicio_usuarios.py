# Responsable: Agustin - logica de negocio de registro e inicio de sesion.
# Francis: resto de funciones de gestion de usuarios.
from threading import Thread
from datetime import datetime
from sqlalchemy import or_

from app.schemas.esquema_usuario import UserLogin
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.activity import Activity

from app.utils.security import hash_password, verify_password, create_access_token, verify_token, generate_temporary_password
from app.exceptions.http_exceptions import email_already_exists_exception, dni_already_exists_exception, unauthorized_exception, forbidden_exception, user_not_found_exception
from database.connection import SessionLocal

from app.models.audit_log import AuditAction, AuditResult, AuditType
from app.services.servicio_auditoria import register_audit

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

    # El email es unique en la BD, así que no se puede insertar otra fila con el mismo.
    # Si pertenece a una cuenta activa, se rechaza; si pertenece a una cuenta dada de baja
    # lógica, más abajo se reactiva ese mismo registro en vez de crear uno nuevo.
    if existing_user and not existing_user.is_deleted:
        raise email_already_exists_exception()

    # Validar que profesores tengan especialidad asignada
    role = getattr(user_data, "role", "client") or "client"
    specialization = getattr(user_data, "specialization", None)

    if role == "professor" and not specialization:
        raise HTTPException(
            status_code=400,
            detail="Un profesor debe tener una especialidad asignada"
        )

    dni = getattr(user_data, "dni", None)
    if dni:
        # El DNI puede repetirse entre roles distintos (una persona puede ser cliente y
        # profesor), por eso se filtra por rol. Se excluye la cuenta que se está reactivando.
        dni_query = db.query(User).filter(
            User.dni == dni,
            User.role == role,
            User.is_deleted == False,
        )
        if existing_user:
            dni_query = dni_query.filter(User.id != existing_user.id)
        if dni_query.first():
            raise dni_already_exists_exception()

    hashed_password = hash_password(
        user_data.password
    )

    # Reactivación: el email pertenece a una cuenta dada de baja lógica. Se reutiliza
    # ese mismo registro (conserva su id e historial) con los datos del nuevo registro.
    if existing_user:
        existing_user.name = user_data.name
        existing_user.lastname = user_data.lastname
        existing_user.password = hashed_password
        existing_user.role = role
        existing_user.dni = dni
        existing_user.direccion = getattr(user_data, "direccion", None)
        existing_user.telefono = getattr(user_data, "telefono", None)
        existing_user.specialization = specialization
        existing_user.birth_date = getattr(user_data, "birth_date", None)
        existing_user.is_deleted = False
        existing_user.deleted_at = None
        existing_user.deleted_by = None
        existing_user.account_status = "active"
        existing_user.failed_login_attempts = 0

        db.commit()
        db.refresh(existing_user)

        return existing_user

    new_user = User(
        name=user_data.name,
        lastname=user_data.lastname,
        email=user_data.email,
        password=hashed_password,
        role=role,
        dni=dni,
        direccion=getattr(user_data, "direccion", None),
        telefono=getattr(user_data, "telefono", None),
        specialization=specialization,
        birth_date=getattr(user_data, "birth_date", None),
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user


# HU Crear cuenta (admin): el administrador NO define la contraseña. El sistema genera
# una contraseña temporal, crea la cuenta y se la envía al usuario por mail para que la
# cambie luego desde "Cambiar contraseña".
def register_user_by_admin(user_data, db: Session, current_user: User):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise email_already_exists_exception()

    role = getattr(user_data, "role", "client") or "client"
    specialization = getattr(user_data, "specialization", None)

    if role == "professor" and not specialization:
        raise HTTPException(
            status_code=400,
            detail="Un profesor debe tener una especialidad asignada"
        )

    dni = getattr(user_data, "dni", None)
    if dni:
        existing_dni = db.query(User).filter(
            User.dni == dni, User.role == role
        ).first()
        if existing_dni:
            raise dni_already_exists_exception()

    temp_password = generate_temporary_password()
    hashed_password = hash_password(temp_password)

    new_user = User(
        name=user_data.name,
        lastname=user_data.lastname,
        email=user_data.email,
        password=hashed_password,
        role=role,
        dni=dni,
        direccion=getattr(user_data, "direccion", None),
        telefono=getattr(user_data, "telefono", None),
        specialization=specialization,
        birth_date=getattr(user_data, "birth_date", None),
    )

    db.add(new_user)

    register_audit(
        db=db,
        user_id=current_user.id,
        type=AuditType.ACCOUNT,
        action=AuditAction.CREATE,
        result=AuditResult.SUCCESS,
        detail=f"Admin {current_user.name} {current_user.lastname} creó la cuenta {new_user.email}"
    )

    db.commit()
    db.refresh(new_user)

    user_id = new_user.id

    def _enviar_credenciales_async(uid: int, temp_pw: str) -> None:
        db_n = SessionLocal()
        try:
            from app.utils.notifications import notify_account_created_with_temp_password
            notify_account_created_with_temp_password(uid, temp_pw, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_enviar_credenciales_async, args=(user_id, temp_password), daemon=True).start()

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
        User.email == request.email,
        User.is_deleted == False,
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Email invalido"
        )

    if existing_user.account_status.lower() == "disabled":
        raise HTTPException(
            status_code=403,
            detail="Cuenta deshabilitada"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email
        }
    )

    if existing_user.account_status.lower() == "suspended":
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": existing_user.role,
            "name": existing_user.name,
            "lastname": existing_user.lastname,
            "account_status": existing_user.account_status,
            "suspension_reason": existing_user.suspension_reason,
            "id": existing_user.id,
        }

    password_correct = verify_password(
        request.password,
        existing_user.password
    )
    
    if not password_correct:
        existing_user.failed_login_attempts += 1

        if existing_user.failed_login_attempts >= 3:
            existing_user.account_status = "disabled"
            if existing_user.role in ["admin", "receptionist", "professor"]:
                register_audit(
                    db=db,
                    user_id=existing_user.id,
                    type=AuditType.ACCOUNT,
                    action=AuditAction.LOGIN,
                    result=AuditResult.ERROR,
                    detail=f"Intento de login fallido número {existing_user.failed_login_attempts} para {existing_user.name} {existing_user.lastname} por contraseña incorrecta."
                )
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Cuenta deshabilitada"
            )

        if existing_user.role in ["admin", "receptionist", "professor"]:
            register_audit(
                db=db,
                user_id=existing_user.id,
                type=AuditType.ACCOUNT,
                action=AuditAction.LOGIN,
                result=AuditResult.ERROR,
                detail=f"Intento de login fallido número {existing_user.failed_login_attempts} para {existing_user.name} {existing_user.lastname} por contraseña incorrecta."
            )
        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Contraseña invalida"
        )
    
    
    existing_user.failed_login_attempts = 0

    if existing_user.role in ["admin", "receptionist", "professor"]:
        register_audit(
            db=db,
            user_id=existing_user.id,
            type=AuditType.ACCOUNT,
            action=AuditAction.LOGIN,
            result=AuditResult.SUCCESS,
            detail=f"Login exitoso para {existing_user.name} {existing_user.lastname}."
        )
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": existing_user.role,
        "name": existing_user.name,
        "lastname": existing_user.lastname,
        "account_status": existing_user.account_status,
        "suspension_reason": existing_user.suspension_reason,
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

    if current_user.role in ["admin", "receptionist", "professor"]:
        register_audit(
            db=db,
            user_id=current_user.id,
            type=AuditType.ACCOUNT,
            action=AuditAction.RESET_PASSWORD,
            result=AuditResult.SUCCESS,
            detail=f"Usuario {current_user.name} {current_user.lastname} cambió su contraseña."
        )
    db.commit()

    return {
        "message": "Contraseña cambiada correctamente"
    }
    
    
# Actualiza datos personales del usuario actual - Agustin
def update_user_info(current_user: User, name: str, lastname: str, direccion: str, telefono: str, db: Session, birth_date = None):
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

    if current_user.role in ["admin", "receptionist", "professor"]:
        register_audit(
            db=db,
            user_id=current_user.id,
            type=AuditType.ACCOUNT,
            action=AuditAction.UPDATE,
            result=AuditResult.SUCCESS,
            detail=f"Usuario {current_user.name} {current_user.lastname} actualizó su información personal."
        )
    db.commit()

    db.refresh(current_user)

    return current_user


#Devuelve una lista con todos los usuarios registrados en la base de datos. 
#Permite filtrar por rol y estado de cuenta. Solo los admins pueden acceder a esta ruta.
def get_all_users(db: Session, role: str = None, status: str = None):

    query = db.query(User).filter(User.is_deleted == False)

    if role:
        query = query.filter(User.role == role)

    if status: 
        query = query.filter(User.account_status == status)

    return query.all()


#Devuelve la información de un usuario específico por su ID.
def get_user_by_id(user_id: int, db: Session):
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:

        raise user_not_found_exception()

    return user


#Cambia el estado de la cuenta de un usuario (activo o deshabilitado). Solo los admins pueden realizar esta acción.
def change_user_status(user_id: int, status: str, db: Session, current_user: User):
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        raise user_not_found_exception()
    user.account_status = status

    # Lógica Automática de Historial
    if status == "disabled":
        nueva_suspension = UserSuspension(
            user_id=user.id,
            suspension_date=datetime.now(),
            suspension_reason="Suspensión Manual por Administrador",
            is_active=True
        )
        db.add(nueva_suspension)
        
    elif status == "active":
        db.query(UserSuspension).filter(
            UserSuspension.user_id == user.id,
            UserSuspension.is_active == True
        ).update({"is_active": False}, synchronize_session=False)

    register_audit(
        db=db,
        user_id=current_user.id,
        type=AuditType.ACCOUNT,
        action=AuditAction.UPDATE,
        result=AuditResult.SUCCESS,
        detail=f"Admin {current_user.name} {current_user.lastname} cambió el estado de la cuenta de {user.name} {user.lastname} (id {user.id}) a {status}"
    )
    db.commit()

    db.refresh(user)

    return user
    
        

# HU Verificar apto físico (admin)
# E1: admin aprueba → medical_certificate_status = "approved"
# E2: admin desaprueba → medical_certificate_status = "rejected"
def change_medical_clearance_status(user_id: int, status: str, db: Session, current_user: User):

    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        raise user_not_found_exception()

    user.medical_certificate_status = status

    register_audit(
        db=db,
        user_id=current_user.id,
        type=AuditType.ACCOUNT,
        action=AuditAction.UPDATE_MEDICAL_CERTIFICATE,
        result=AuditResult.SUCCESS,
        detail=f"Admin {current_user.name} {current_user.lastname} cambió el estado del certificado médico de {user.name} {user.lastname} (id {user.id}) a {status}"
    )

    db.commit()

    db.refresh(user)

    user_id_copia = user.id

    def _notif_async(uid: int, st: str) -> None:
        from app.utils.notifications import notify_medical_clearance_status
        db_n = SessionLocal()
        try:
            notify_medical_clearance_status(uid, st, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(user_id_copia, status), daemon=True).start()

    return user


# Genera un token de recuperación de contraseña para el usuario con el email especificado.
def request_password_recovery(email: str, http_request, db: Session):
    from app.utils.security import PASSWORD_RECOVERY_TOKEN_EXPIRE_MINUTES
    from app.utils.notifications import notify_password_recovery_requested

    user = db.query(User).filter(User.email == email, User.is_deleted == False).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="El correo no está registrado en el sistema"
        )

    # Generar token con expiración de 30 minutos
    recovery_token = create_access_token(
        data={"sub": user.email, "type": "recovery"},
        expires_in_minutes=PASSWORD_RECOVERY_TOKEN_EXPIRE_MINUTES
    )

    # Extraer URL del frontend desde el header origin
    frontend_url = http_request.headers.get("origin", "http://localhost:3000")

    # Construir link de recuperación
    recovery_link = f"{frontend_url}/restablecer-contrasena?token={recovery_token}"

    # Enviar email con el link (en background)
    user_id = user.id
    def _enviar_recovery_async(uid: int, uemail: str, link: str, exp_mins: int) -> None:
        db_n = SessionLocal()
        try:
            notify_password_recovery_requested(uemail, link, exp_mins, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_enviar_recovery_async, args=(user_id, user.email, recovery_link, PASSWORD_RECOVERY_TOKEN_EXPIRE_MINUTES), daemon=True).start()

    return {
        "message": "Se ha enviado un enlace de recuperación a tu email. El link es válido por 30 minutos."
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
    
    user = db.query(User).filter(User.email == email, User.is_deleted == False).first()

    if not user:
        raise user_not_found_exception()

    hashed_password = hash_password(new_password)
    user.password = hashed_password
    if user.failed_login_attempts == 3:
        user.account_status = "active"
    user.failed_login_attempts = 0

    if user.role in ["admin", "receptionist", "professor"]:
        register_audit(
            db=db,
            user_id=user.id,
            type=AuditType.ACCOUNT,
            action=AuditAction.RESET_PASSWORD,
            result=AuditResult.SUCCESS,
            detail=f"Usuario {user.name} {user.lastname} restableció su contraseña mediante recuperación."
        )
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Contraseña restablecida correctamente"
    }


# Elimina una cuenta de usuario mediante baja logica (soft delete): el registro
# no se borra de la base de datos, se marca is_deleted=True y se registra quien
# y cuando la elimino (deleted_by/deleted_at) para poder auditarla despues.
# deleted_by_id es el id de quien ejecuta la baja (el propio usuario si es
# autoeliminacion, o el admin si la elimina desde el panel).
def delete_user(user_id: int, deleted_by_id: int, db: Session):
    from app.models.reservation import Reservation
    from app.models.waitlist import Waitlist
    from app.services.servicio_lista_espera import promote_next_waitlist_entry

    user = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False,
    ).first()

    if not user:
        raise user_not_found_exception()

    name = f"{user.name} {user.lastname}"

    # E3: si es profesor, desvincular de todas sus actividades activas
    if user.role == "professor":
        db.query(Activity).filter(
            Activity.professor == name,
            Activity.status == "active",
        ).update({Activity.professor: None}, synchronize_session=False)

    # Liberar reservas y posiciones en lista de espera antes de eliminar la cuenta.
    # Si no se hace, quedan registros huérfanos que siguen descontando cupos
    # (obtener_disponibilidad_actividad) pero ya no aparecen en el listado de inscriptos
    # (listar_clientes_actividad hace join con User).
    reservas_activas = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.status.in_(["pending", "confirmed"]),
    ).all()
    activity_ids_liberados = [r.activity_id for r in reservas_activas]
    for reserva in reservas_activas:
        reserva.status = "cancelled"

    entradas_espera = db.query(Waitlist).filter(
        Waitlist.user_id == user_id,
        Waitlist.status == "waiting",
    ).all()
    for entrada in entradas_espera:
        entrada.status = "cancelled"
        restantes = db.query(Waitlist).filter(
            Waitlist.activity_id == entrada.activity_id,
            Waitlist.waitlist_type == entrada.waitlist_type,
            Waitlist.position > entrada.position,
            Waitlist.status == "waiting",
        ).order_by(Waitlist.position).all()
        for idx, r in enumerate(restantes):
            r.position = entrada.position + idx

    db.commit()

    for activity_id in activity_ids_liberados:
        nueva_reserva = promote_next_waitlist_entry(activity_id, db)
        if nueva_reserva:
            uid_promovido = nueva_reserva.user_id
            aid_promovido = nueva_reserva.activity_id

            def _notif_async(uid: int, aid: int) -> None:
                from app.utils.notifications import notify_waitlist_promoted
                db_n = SessionLocal()
                try:
                    notify_waitlist_promoted(uid, aid, db_n)
                except Exception:
                    pass
                finally:
                    db_n.close()

            Thread(target=_notif_async, args=(uid_promovido, aid_promovido), daemon=True).start()

    # Baja logica: se conserva el registro (y sus datos relacionados: suscripciones,
    # asistencias, notificaciones, movimientos de credito) para auditoria. Ya no
    # hace falta borrarlos a mano porque no hay un delete fisico que viole FKs.
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    user.deleted_by = deleted_by_id

    current_user = db.query(User).filter(User.id == deleted_by_id).first()
    print(current_user.role)
    if current_user.role in ["admin", "receptionist", "professor"]:
        if current_user.id == user.id:
            detalle = f"{name} eliminó su propia cuenta."
        else:
            detalle = f"Admin {current_user.name} {current_user.lastname} eliminó la cuenta de {name} (id {user.id})."
        register_audit(
            db=db,
            user_id=current_user.id,
            type=AuditType.ACCOUNT,
            action=AuditAction.DELETE,
            result=AuditResult.SUCCESS,
            detail=detalle,
        )
    db.commit()

    return {"message": f"Cuenta de {name} eliminada correctamente"}


# Busca usuarios por nombre, email o DNI con filtros opcionales.
def search_users(db: Session, search: str = None, role: str = None, status: str = None, roles: list = None):
    query = db.query(User).filter(User.is_deleted == False)

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
def modify_employee(employee_id: int, name: str = None, lastname: str = None, email: str = None, specialization: str = None, direccion: str = None, telefono: str = None, db: Session = None, birth_date = None, current_user: User = None):
    employee = db.query(User).filter(User.id == employee_id).first()

    if not employee:
        raise user_not_found_exception()

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

    if name is not None:
        employee.name = name

    if lastname is not None:
        employee.lastname = lastname

    if email is not None and email != employee.email:
        existing = db.query(User).filter(User.email == email, User.id != employee_id).first()
        if existing:
            raise email_already_exists_exception()
        employee.email = email

    if direccion is not None:
        employee.direccion = direccion

    if telefono is not None:
        employee.telefono = telefono

    if birth_date is not None:
        employee.birth_date = birth_date

    register_audit(
        db=db,
        user_id=current_user.id,
        type=AuditType.ACCOUNT,
        action=AuditAction.UPDATE,
        result=AuditResult.SUCCESS,
        detail=f"Admin {current_user.name} {current_user.lastname} modificó la información del usuario {employee.name} {employee.lastname} (id {employee.id})"
    )
    db.commit()
    db.refresh(employee)

    return employee


# Devuelve la lista pública de staff activo (profesores y recepcionistas) con filtros opcionales.
def get_public_staff(db: Session, search: str = None, specialization: str = None):
    query = db.query(User).filter(
        User.role.in_(["professor", "receptionist"]),
        User.account_status == "active",
        User.is_deleted == False,
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
            User.account_status == "active",
            User.is_deleted == False,
        )
        .distinct()
        .all()
    )
    return [r[0] for r in rows if r[0]]


def get_user_with_plan_specialization(user: User, db: Session):
    """
    Enriquece el usuario con la especialidad de su plan activo.
    Retorna un dict con los datos del usuario más plan_specialization.
    """
    from app.utils.subscriptions import get_active_user_plan
    
    user_plan = get_active_user_plan(user.id, db)
    plan_specialization = user_plan.specialization if user_plan else None
    
    # Convertir a dict y agregar plan_specialization
    user_dict = {
        "id": user.id,
        "name": user.name,
        "lastname": user.lastname,
        "email": user.email,
        "role": user.role,
        "specialization": user.specialization,
        "account_status": user.account_status,
        "dni": user.dni,
        "direccion": user.direccion,
        "telefono": user.telefono,
        "medical_certificate_status": user.medical_certificate_status,
        "medical_certificate_path": user.medical_certificate_path,
        "tiene_clases_activas": None,
        "birth_date": user.birth_date,
        "plan_specialization": plan_specialization,
        "created_at":user.created_at,
    }
    return user_dict



