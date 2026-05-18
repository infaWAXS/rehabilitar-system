from fastapi import HTTPException


def unauthorized_exception():

    return HTTPException(
        status_code=401,
        detail="Credenciales inválidas"
    )


def forbidden_exception():

    return HTTPException(
        status_code=403,
        detail="No tenés permisos"
    )


def user_not_found_exception():

    return HTTPException(
        status_code=404,
        detail="Usuario no encontrado"
    )


def email_already_exists_exception():

    return HTTPException(
        status_code=409,
        detail="El email ya está registrado"
    )


def invalid_password_exception():

    return HTTPException(
        status_code=400,
        detail="La contraseña debe tener al menos 6 caracteres"
    )