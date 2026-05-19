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
    

#Esquema para actualizar el nombre y apellido del usuario.
class UpdateUserRequest(BaseModel):

    name: Optional[str] = None

    lastname: Optional[str] = None
    
