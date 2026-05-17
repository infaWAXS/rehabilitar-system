from pydantic import BaseModel, EmailStr, field_validator

class UserCreate(BaseModel):
    name: str
    lastname: str
    email: EmailStr
    password: str
    
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, value):

        if len(value) < 6:

            raise ValueError(
                "La contraseña debe tener al menos 6 caracteres"
            )

        return value
    
    
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str