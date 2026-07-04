# Responsable legacy Francis + Agustin - excepciones del dominio de usuarios/auth.
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


def dni_already_exists_exception():

    return HTTPException(
        status_code=409,
        detail="Ya existe un usuario con ese DNI en este rol"
    )


def invalid_password_exception():

    return HTTPException(
        status_code=400,
        detail="La contraseña debe tener al menos 6 caracteres"
    )


def activity_not_found_exception():

    return HTTPException(
        status_code=404,
        detail="Actividad no encontrada"
    )


def attendance_not_found_exception():

    return HTTPException(
        status_code=404,
        detail="Asistencia no encontrada"
    )


def attendance_already_exists_exception():

    return HTTPException(
        status_code=409,
        detail="La asistencia ya se encuentra registrada"
    )


def attendance_already_marked_exception():

    return HTTPException(
        status_code=409,
        detail="La asistencia ya ha sido marcada como presente"
    )


def user_not_enrolled_exception():

    return HTTPException(
        status_code=403,
        detail="El cliente no se anotó para dicha clase"
    )


def activity_session_not_active_exception():

    return HTTPException(
        status_code=409,
        detail="La actividad no tiene una sesión activa en este momento"
    )


def qr_not_found_exception():

    return HTTPException(
        status_code=404,
        detail="Código QR no encontrado"
    )


def qr_expired_exception():

    return HTTPException(
        status_code=410,
        detail="El código QR expiró"
    )