# # Responsable legacy: Francis y Agustin - gestion de usuarios.
from app.exceptions.http_exceptions import forbidden_exception
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Body
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import shutil

from database.connection import get_db
from app.models.user import User
from app.schemas.esquema_usuario import ChangePasswordRequest, UpdateUserRequest, UserResponse, UserSearchRequest
from app.utils.dependencies import get_current_user, require_role


from app.services.servicio_usuarios import change_medical_clearance_status, change_password, change_user_status, delete_user, get_all_users, get_user_by_id, search_users, modify_employee, update_user_info as update_user_info_service





oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

router = APIRouter(
    prefix="/users",
    tags=["Usuarios"]
)


#El usuario actualmente autenticado - AGUSTIN
@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.servicio_usuarios import get_user_with_plan_specialization
    return get_user_with_plan_specialization(current_user, db)





#Ruta solo para admins - AGUSTIN
@router.get("/admin-only")
def admin_only(token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return {
        "message": "Ruta solo para admins"
    }
    


#Actualiza la contraseña del usuario actualmente autenticado. - AGUSTIN
@router.put("/change-password")
def change_user_password(request: ChangePasswordRequest, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    return change_password(current_user, request.new_password, request.confirm_password,db)


# HU Editar perfil (Agustin) - E1: actualiza nombre/apellido/dirección/teléfono. E2: required en front. E3: cancel → front no llama
@router.put("/update-info")
def update_my_info(request: UpdateUserRequest, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    return update_user_info_service(current_user, request.name, request.lastname, request.direccion, request.telefono, db, request.birth_date)


@router.get("/",response_model=list[UserResponse])
def get_users(token: str, db: Session = Depends(get_db), role: str = None, status: str = None):
    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return get_all_users(db, role=role, status=status)


# HU Búsqueda de usuarios (Francis)
# E1: búsqueda con resultados → retorna lista de usuarios que coinciden con search/role/status
# E2: búsqueda sin resultados → retorna lista vacía []
# HU Listar empleados (Agustin) — usar role=professor o role=receptionist
# E1: hay empleados → retorna lista; E2: sin empleados → []; E3: sin filtros → todos los usuarios
@router.get("/search", response_model=list[UserResponse])
def search_users_endpoint(token: str, db: Session = Depends(get_db), search: str = None, role: str = None, status: str = None):
    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return search_users(db, search=search, role=role, status=status)

# HU Modificar información de usuario (Nahuel) - Cambio de especialidad de profesor
# E1: cambio exitoso → specialization actualizada en la BD
# E2: cancelar → manejado en frontend
@router.put("/{user_id}/specialty", response_model=UserResponse)
def change_professor_specialty_endpoint(
    user_id: int,
    token: str,
    specialty: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return modify_employee(user_id, None, None, None, specialty, None, None, db)


# HU Verificar apto físico (admin) - E3: lista clientes con apto físico pendiente - Francis
@router.get("/pending-medical", response_model=list[UserResponse])
def list_pending_medical(token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return db.query(User).filter(User.medical_certificate_status == "pending").all()


# Endpoint para obtener datos de un usuario específico (admin o el propio usuario) - Agustin
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    
    if (current_user.role != "admin" and current_user.id != user_id):
        raise forbidden_exception()
    
    user = get_user_by_id(user_id, db)

    # E3 HU Modificar Profesor: calcular si tiene clases activas asignadas
    tiene_clases_activas = False
    if user.role == "professor":
        from app.models.activity import Activity
        nombre_profesor = f"{user.name} {user.lastname}"
        tiene_clases_activas = db.query(Activity).filter(
            Activity.professor == nombre_profesor,
            Activity.status == "active",
        ).first() is not None

    user_dict = UserResponse.model_validate(user).model_dump()
    user_dict["tiene_clases_activas"] = tiene_clases_activas
    return user_dict

#Agustin - Endpoint para que el admin habilite o deshabilite una cuenta de usuario (soft delete)
@router.put("/disable/{user_id}", response_model=UserResponse)
def disable_user(user_id: int, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return change_user_status(user_id, "disabled", db)

#Agustin - Endpoint para que el admin habilite o deshabilite una cuenta de usuario (soft delete)
@router.put("/enable/{user_id}", response_model=UserResponse)
def enable_user(user_id: int, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return change_user_status(user_id, "active", db)



#Ruta para subir el certificado medico del usuario actualmente autenticado. - AGUSTIN
@router.post("/upload-medical-certificate")
def upload_medical_certificate(

    token: str, file: UploadFile = File(...), db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    allowed_types = ["image/png", "image/jpeg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos PNG, JPG y PDF"
        )

    safe_filename = file.filename.replace(" ", "_")
    file_path = f"uploads/certificates/{current_user.id}_{safe_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_user.medical_certificate_path = file_path

    current_user.medical_certificate_status = "pending"

    db.commit()

    return {
        "message": "Certificado subido correctamente"
    }
    
    
# HU Verificar apto físico (admin) - E1: admin aprueba → medical_certificate_status = "approved" - AGUSTIN
@router.put("/acept-medical/{user_id}")
def update_medical_clearance_status(user_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return change_medical_clearance_status(user_id, "approved", db)

# HU Verificar apto físico (admin) - E2: admin desaprueba → medical_certificate_status = "rejected" - AGUSTIN
@router.put("/reject-medical/{user_id}", response_model=UserResponse)
def reject_medical_certificate(user_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return change_medical_clearance_status(user_id, "rejected", db)


# HU Modificar información de usuario (Nahuel)
# E1: modificación exitosa → actualiza name/lastname y opcionalmente specialization
# E2: cambio especialidad profesor → specialization validada en servicio (solo si role=professor)
# E3: profesor con clases asignadas → TODO (pendiente módulo actividades de Angel)
# E4: cancelar → manejado en frontend (cancelar() sin llamada a la API)
# HU Modificar empleado (Francis)
# E1: modificación exitosa → mismo endpoint PUT /{user_id}/modify
# E2: cancelar → manejado en frontend
# E3: validación → nombre/apellido requeridos (validado en frontend y servicio)
@router.put("/{user_id}/modify", response_model=UserResponse)
def modify_employee_endpoint(user_id: int, request: UpdateUserRequest, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    
    require_role(["admin"])(current_user)
    
    return modify_employee(user_id, request.name, request.lastname, None, request.specialization, request.direccion, request.telefono, db, request.birth_date)


# Endpoint para que el admin suba el apto físico de un cliente específico - Francis
@router.post("/{user_id}/upload-medical-certificate")
def admin_upload_certificate(user_id: int, token: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)

    from app.exceptions.http_exceptions import user_not_found_exception
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise user_not_found_exception()

    file_path = f"uploads/certificates/{user_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    target.medical_certificate_path = file_path
    target.medical_certificate_status = "pending"
    db.commit()

    return {"message": "Certificado subido correctamente"}


# HU Registrar usuario (Agustin) - E6: subida de foto de DNI para validación externa
# TODO (Agustin): enviar la foto al sistema externo de validación de identidad y mayoría de edad
#                 (similar a la integración con Mercado Pago). Cuando el sistema externo confirme,
#                 actualizar dni_verified=True y poblar el campo dni con el número extraído.
@router.post("/upload-dni")
def upload_dni_photo(token: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)

    file_path = f"uploads/certificates/{current_user.id}_dni_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_user.dni_photo_path = file_path
    db.commit()

    return {"message": "Foto de DNI subida correctamente. Pendiente validación por sistema externo."}


# Elimina la propia cuenta del usuario autenticado (hard delete) - Francis
@router.delete("/me")
def delete_my_account(token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    name = f"{current_user.name} {current_user.lastname}"
    db.delete(current_user)
    db.commit()
    return {"message": f"Cuenta de {name} eliminada correctamente"}


# Elimina una cuenta de usuario (admin, hard delete) - Francis
@router.delete("/{user_id}")
def delete_user_endpoint(user_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return delete_user(user_id, db)


# Endpoint para listar clientes (usuarios con rol "client") - Francis
@router.get("/clients/list")
def list_clients(token: str, db: Session = Depends(get_db), search: str = None, status: str = None):
    current_user = get_current_user(token, db)
    require_role(["admin", "receptionist"])(current_user)
    from app.services.servicio_clientes import obtener_todos_los_clientes
    return obtener_todos_los_clientes(db, search=search, status=status)
