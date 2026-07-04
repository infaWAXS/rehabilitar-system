# # Responsable legacy: Francis y Agustin - hashing y JWT.
import bcrypt
import secrets
import string

from jose import jwt, JWTError
from datetime import datetime, timedelta


def generate_temporary_password(length: int = 10) -> str:
    """Genera una contraseña temporal segura (letras, números y algún símbolo)."""
    alfabeto = string.ascii_letters + string.digits
    contrasena = [secrets.choice(string.ascii_uppercase), secrets.choice(string.digits)]
    contrasena += [secrets.choice(alfabeto) for _ in range(length - len(contrasena))]
    secrets.SystemRandom().shuffle(contrasena)
    return "".join(contrasena)


def hash_password(password: str):

    password_bytes = password.encode("utf-8")

    salt = bcrypt.gensalt()

    hashed_password = bcrypt.hashpw(password_bytes, salt)

    return hashed_password.decode("utf-8")



def verify_password(plain_password: str, hashed_password: str):

    plain_password_bytes = plain_password.encode("utf-8")

    hashed_password_bytes = hashed_password.encode("utf-8")

    return bcrypt.checkpw(
        plain_password_bytes,
        hashed_password_bytes
    )
    
    
SECRET_KEY = "mi_clave_super_secreta"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60
PASSWORD_RECOVERY_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: dict, expires_in_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=expires_in_minutes
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"verify_exp": True}
        )

        email = payload.get("sub")

        if email is None:
            return None

        return email

    except JWTError:

        return None
