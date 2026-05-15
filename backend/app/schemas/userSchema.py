from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    lastname: str
    email: EmailStr
    password: str