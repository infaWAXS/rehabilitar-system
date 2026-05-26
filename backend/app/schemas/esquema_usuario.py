# # Responsable legacy: Francis y Agustin - contratos de datos de usuarios.
##En este archivo estan los esquemas en formate de clases de las entidades del sistema
##No es la tabla en la base de datos, es la informacion con la que los usuarios van a interactuar

#Los Schemas representan la informacion que puede salir de la base de datos

from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


#Registro de usuario
class UserCreate(BaseModel):
    name: str
    lastname: str
    email: EmailStr
    password: str
    dni: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    role: Optional[str] = "client"           # client | admin | receptionist | professor
    specialization: Optional[str] = None     # obligatorio si role == "professor"

    #Valida que la contraseña tenga al menos 6 caracteres.
    @field_validator("password")
    @classmethod
    def validate_password(cls, value):

        if len(value) < 6:

            raise ValueError(
                "La contraseña debe tener al menos 6 caracteres"
            )

        return value
    
    
    
#Inicio de sesion de usuario
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
    


#Representa la informacion publica que devuelve la API
class UserResponse(BaseModel):

    id: int

    name: str

    lastname: str

    email: EmailStr

    role: str

    specialization: Optional[str] = None

    account_status: Optional[str] = None

    dni: Optional[str] = None

    direccion: Optional[str] = None

    telefono: Optional[str] = None

    medical_certificate_status: Optional[str] = None

    tiene_clases_activas: Optional[bool] = None

    class Config:
        from_attributes = True
    

#Esquema para cambiar la contraseña del usuario.
class ChangePasswordRequest(BaseModel):

    new_password: str

    confirm_password: str
    
    #Valida que la nueva contraseña tenga al menos 6 caracteres.
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value):

        if len(value) < 6:

            raise ValueError(
                "La contraseña debe tener al menos 6 caracteres"
            )
        return value
    

#Esquema para actualizar el nombre, apellido y especialización del usuario.
class UpdateUserRequest(BaseModel):

    name: Optional[str] = None

    lastname: Optional[str] = None

    direccion: Optional[str] = None

    telefono: Optional[str] = None

    specialization: Optional[str] = None


#Esquema para solicitar recuperación de contraseña.
class PasswordRecoveryRequest(BaseModel):

    email: EmailStr


#Esquema para restablecer la contraseña con token.
class PasswordResetRequest(BaseModel):

    token: str

    new_password: str

    confirm_password: str
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value):

        if len(value) < 6:

            raise ValueError(
                "La contraseña debe tener al menos 6 caracteres"
            )
        return value


#Esquema para búsqueda de usuarios.
class UserSearchRequest(BaseModel):

    search: Optional[str] = None

    role: Optional[str] = None

    status: Optional[str] = None


# Datos públicos de un miembro del staff (sin información sensible).
class StaffPublicResponse(BaseModel):

    id: int

    name: str

    lastname: str

    role: str

    specialization: Optional[str] = None

    class Config:
        from_attributes = True
