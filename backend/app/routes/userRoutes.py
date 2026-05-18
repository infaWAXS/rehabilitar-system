from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database.connection import get_db
from app.models.user import User
from app.schemas.userSchema import ChangePasswordRequest, UpdateUserRequest, UserResponse
from app.utils.dependencies import get_current_user, require_role


from app.services.user_service import change_password



oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

router = APIRouter()


#El usuario actualmente autenticado
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user



    
@router.get("/admin-only")
def admin_only(token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    require_role(["admin"])(current_user)

    return {
        "message": "Ruta solo para admins"
    }
    
    
@router.put("/change-password")
def change_user_password(request: ChangePasswordRequest, token: str, db: Session = Depends(get_db)):

    current_user = get_current_user(token, db)

    return change_password(current_user, request.new_password, request.confirm_password,db)


@router.put("users/update-info")
def update_user_info(request: UpdateUserRequest, token: str, db: Session = Depends(get_db)):
    
    current_user = get_current_user(token, db)

    return update_user_info(current_user, request.name, request.lastname, db)



