from backend.app.exceptions.http_exceptions import forbidden_exception
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import shutil

from database.connection import get_db
from app.models.user import User
from app.schemas.userSchema import ChangePasswordRequest, UpdateUserRequest, UserResponse
from app.utils.dependencies import get_current_user, require_role


from app.services.user_service import change_medical_clearance_status, change_password, change_user_status, get_all_users, get_user_by_id





oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
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

    current_user.physical_clearance_status = "pending"

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

    return change_medical_clearance_status(user_id, "rejected", db)




