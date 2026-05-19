# # Responsable legacy: Francis y Agustin - gestion de usuarios.
from app.exceptions.http_exceptions import forbidden_exception
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import shutil

from database.connection import get_db
from app.models.user import User
from app.schemas.esquema_usuario import ChangePasswordRequest, UpdateUserRequest, UserResponse, UserSearchRequest
from app.utils.dependencies import get_current_user, require_role


from app.services.servicio_usuarios import change_medical_clearance_status, change_password, change_user_status, delete_user, get_all_users, get_user_by_id, search_users, modify_employee





oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

router = APIRouter(
    prefix="/users",
    tags=["Usuarios"]
)


#El usuario actualmente autenticado
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user





#Ruta solo para admins
@router.get("/admin-only")
def admin_only(token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return {
        "message": "Ruta solo para admins"
    }
    


#Actualiza la contraseña del usuario actualmente autenticado.    
@router.put("/change-password")
def change_user_password(request: ChangePasswordRequest, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    return change_password(current_user, request.new_password, request.confirm_password,db)


#Actualiza el nombre y apellido del usuario actualmente autenticado.
@router.put("/update-info")
def update_user_info(request: UpdateUserRequest, token: str, db: Session = Depends(get_db)):
    
    current_user = get_current_user(token, db)

    return update_user_info(current_user, request.name, request.lastname, db)


@router.get("/",response_model=list[UserResponse])
def get_users(token: str, db: Session = Depends(get_db), role: str = None, status: str = None):
    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return get_all_users(db, role=role, status=status)


# Endpoint para buscar usuarios con filtros avanzados (debe ir ANTES de /{user_id})
@router.get("/search", response_model=list[UserResponse])
def search_users_endpoint(token: str, db: Session = Depends(get_db), search: str = None, role: str = None, status: str = None):
    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return search_users(db, search=search, role=role, status=status)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    
    if (current_user.role != "admin" and current_user.id != user_id):
        raise forbidden_exception()
    
    return get_user_by_id(user_id, db)


@router.put("/disable/{user_id}", response_model=UserResponse)
def disable_user(user_id: int, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return change_user_status(user_id, "disabled", db)


@router.put("/enable/{user_id}", response_model=UserResponse)
def enable_user(user_id: int, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return change_user_status(user_id, "active", db)



#Ruta para subir el certificado medico del usuario actualmente autenticado. 
@router.post("/upload-medical-certificate")
def upload_medical_certificate(

    token: str, file: UploadFile = File(...), db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    file_path = (f"uploads/certificates/"f"{current_user.id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_user.medical_certificate_path = file_path

    current_user.medical_certificate_status = "pending"

    db.commit()

    return {
        "message": "Certificado subido correctamente"
    }
    
    
@router.put("/update-medical-clearance/{user_id}")
def update_medical_clearance_status(user_id: int, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return change_medical_clearance_status(user_id, db)

@router.put("/reject-medical/{user_id}", response_model=UserResponse)
def reject_medical_certificate(user_id: int, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return change_medical_clearance_status(user_id, db, status="rejected")


# Endpoint para modificar datos de un empleado
@router.put("/{user_id}/modify", response_model=UserResponse)
def modify_employee_endpoint(user_id: int, request: UpdateUserRequest, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    
    require_role(["admin"])(current_user)
    
    return modify_employee(user_id, request.name, request.lastname, request.email, request.specialization, db)


# Endpoint para que el admin suba el apto físico de un cliente específico
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


# Elimina la propia cuenta del usuario autenticado (hard delete)
@router.delete("/me")
def delete_my_account(token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    name = f"{current_user.name} {current_user.lastname}"
    db.delete(current_user)
    db.commit()
    return {"message": f"Cuenta de {name} eliminada correctamente"}


# Elimina una cuenta de usuario (admin, hard delete)
@router.delete("/{user_id}")
def delete_user_endpoint(user_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return delete_user(user_id, db)


# Endpoint para listar clientes (usuarios con rol "client")
@router.get("/clients/list", response_model=list[UserResponse])
def list_clients(token: str, db: Session = Depends(get_db), search: str = None, status: str = None):
    current_user = get_current_user(token, db)
    
    require_role(["admin", "receptionist"])(current_user)
    
    if search:
        return search_users(db, search=search, role="client", status=status)
    return get_all_users(db, role="client", status=status)
