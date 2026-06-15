# Responsable: Ezequiel - lógica de negocio de asistencias
from datetime import datetime, timedelta
import re
import secrets

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.attendance_qr import AttendanceQR
from app.models.user import User
from app.models.activity import Activity
from app.models.reservation import Reservation
from app.exceptions.http_exceptions import (
    user_not_found_exception,
    activity_not_found_exception,
    attendance_not_found_exception,
    attendance_already_exists_exception,
    attendance_already_marked_exception,
    user_not_enrolled_exception,
    activity_session_not_active_exception,
    invalid_qr_exception,
    expired_qr_exception,
)


QR_VALID_MINUTES = 15
# Toggle temporal para pruebas manuales de QR/asistencias.
# En producción debe quedar en True para respetar la HU de sesión activa.
ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS = False


def _extraer_inicio_y_fin(schedule: str | None, time_slot: str | None) -> tuple[int | None, int | None]:
    if schedule:
        coincidencias = re.findall(r"(\d{1,2}):(\d{2})", schedule)
        if len(coincidencias) >= 2:
            inicio_h, inicio_m = coincidencias[0]
            fin_h, fin_m = coincidencias[1]
            inicio = int(inicio_h) * 60 + int(inicio_m)
            fin = int(fin_h) * 60 + int(fin_m)
            return inicio, fin

    if time_slot:
        try:
            hh, mm = time_slot.split(":")
            inicio = int(hh) * 60 + int(mm)
            return inicio, inicio + 60
        except ValueError:
            return None, None

    return None, None


def _sesion_activa(activity: Activity) -> bool:
    if activity.status != "active":
        return False

    ahora = datetime.now()

    # Actividad individual: debe coincidir la fecha y la hora debe estar en rango
    if activity.activity_type == "individual" and activity.specific_date:
        if activity.specific_date != ahora.date():
            return False

        inicio, fin = _extraer_inicio_y_fin(None, activity.time_slot)
        if inicio is None or fin is None:
            return True

        minutos_ahora = ahora.hour * 60 + ahora.minute
        # Ventana flexible: desde 30 min antes hasta 30 min después de finalizar
        return (inicio - 30) <= minutos_ahora <= (fin + 30)

    # Actividad fija: validar día de semana y, si hay horario parseable, validar rango
    if activity.activity_type == "fixed":
        if activity.schedule:
            dias = {
                "lunes": 0,
                "martes": 1,
                "miércoles": 2,
                "miercoles": 2,
                "jueves": 3,
                "viernes": 4,
                "sábado": 5,
                "sabado": 5,
                "domingo": 6,
            }

            schedule_lower = activity.schedule.lower()
            dia_actual_ok = any(
                idx == ahora.weekday() and nombre in schedule_lower
                for nombre, idx in dias.items()
            )

            if not dia_actual_ok:
                return False

        inicio, fin = _extraer_inicio_y_fin(activity.schedule, activity.time_slot)
        if inicio is None or fin is None:
            return True

        minutos_ahora = ahora.hour * 60 + ahora.minute
        return (inicio - 30) <= minutos_ahora <= (fin + 30)

    # Fallback: si no hay suficiente metadata temporal, considerar activa por estado
    return True


def obtener_estado_sesion_asistencia(activity_id: int, db: Session):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    session_active = _sesion_activa(activity)
    return {
        "activity_id": activity_id,
        "session_active": session_active,
        "status": activity.status,
        "restrictions_enforced": ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS,
    }


def pregenerar_ausentes(activity_id: int, db: Session):
    """
    Pre-genera registros de asistencia con status='absent' para todos los
    clientes con reserva confirmada en la actividad que aún no tengan registro.
    Idempotente: llamarlo varias veces no duplica registros.
    """
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    if ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS and not _sesion_activa(activity):
        raise activity_session_not_active_exception()

    reservas = db.query(Reservation).filter(
        Reservation.activity_id == activity_id,
        Reservation.status == "confirmed",
    ).all()

    creados = 0
    for reserva in reservas:
        ya_existe = db.query(Attendance).filter(
            Attendance.user_id == reserva.user_id,
            Attendance.activity_id == activity_id,
        ).first()
        if not ya_existe:
            db.add(Attendance(
                user_id=reserva.user_id,
                activity_id=activity_id,
                status="absent",
            ))
            creados += 1

    db.commit()
    return {"creados": creados, "actividad_id": activity_id}


def marcar_asistencia_por_dni(dni: str, activity_id: int, comment: str | None, db: Session):
    user = db.query(User).filter(User.dni == dni).first()
    if not user:
        raise user_not_found_exception()

    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    if ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS and not _sesion_activa(activity):
        raise activity_session_not_active_exception()

    enrolled = db.query(Reservation).filter(
        Reservation.user_id == user.id,
        Reservation.activity_id == activity_id,
        Reservation.status != "cancelled",
    ).first()
    if not enrolled:
        raise user_not_enrolled_exception()

    existing = db.query(Attendance).filter(
        Attendance.user_id == user.id,
        Attendance.activity_id == activity_id,
    ).first()

    if existing:
        if existing.status == "present":
            raise attendance_already_marked_exception()
        # Estaba pre-generado como "absent" → actualizamos a "present"
        existing.status = "present"
        if comment is not None:
            existing.comment = comment
        db.commit()
        db.refresh(existing)
        return existing

    # No existe aún → crear directamente como "present"
    attendance = Attendance(
        user_id=user.id,
        activity_id=activity_id,
        status="present",
        comment=comment,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance



def actualizar_comentario(attendance_id: int, comment: str, db: Session):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise attendance_not_found_exception()

    activity = db.query(Activity).filter(Activity.id == attendance.activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    if ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS and not _sesion_activa(activity):
        raise activity_session_not_active_exception()

    attendance.comment = comment
    db.commit()
    db.refresh(attendance)
    return attendance


def eliminar_comentario(attendance_id: int, db: Session):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise attendance_not_found_exception()

    activity = db.query(Activity).filter(Activity.id == attendance.activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    if ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS and not _sesion_activa(activity):
        raise activity_session_not_active_exception()

    attendance.comment = None
    db.commit()
    db.refresh(attendance)
    return attendance


def listar_asistencias_por_actividad(activity_id: int, db: Session):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    rows = (
        db.query(Attendance, User)
        .join(User, Attendance.user_id == User.id)
        .filter(Attendance.activity_id == activity_id)
        .all()
    )

    result = []
    for attendance, user in rows:
        result.append({
            "id": attendance.id,
            "user_id": user.id,
            "nombre": user.name,
            "apellido": user.lastname,
            "dni": user.dni or "",
            "status": attendance.status,
            "comment": attendance.comment,
            "timestamp": attendance.timestamp,
        })
    return result


def generar_qr_asistencia(activity_id: int, current_user: User, db: Session):
    if current_user.role != "professor":
        from app.exceptions.http_exceptions import forbidden_exception
        raise forbidden_exception()

    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    if ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS and not _sesion_activa(activity):
        raise activity_session_not_active_exception()

    # Desactiva tokens vencidos para esta actividad
    ahora = datetime.now()
    db.query(AttendanceQR).filter(
        AttendanceQR.activity_id == activity_id,
        AttendanceQR.expires_at < ahora,
        AttendanceQR.is_active == True,  # noqa: E712
    ).update({"is_active": False}, synchronize_session=False)

    token = secrets.token_urlsafe(32)
    expires_at = ahora + timedelta(minutes=QR_VALID_MINUTES)

    qr = AttendanceQR(
        activity_id=activity_id,
        generated_by_user_id=current_user.id,
        token=token,
        expires_at=expires_at,
        is_active=True,
    )
    db.add(qr)
    db.commit()

    return {
        "token": token,
        "activity_id": activity_id,
        "expires_at": expires_at,
        # payload que puede convertirse en QR en frontend
        "qr_payload": token,
    }


def registrar_asistencia_por_qr(token: str, current_user: User, db: Session):
    qr = db.query(AttendanceQR).filter(AttendanceQR.token == token).first()
    if not qr:
        raise invalid_qr_exception()

    ahora = datetime.now()
    if (not qr.is_active) or qr.expires_at < ahora:
        qr.is_active = False
        db.commit()
        raise expired_qr_exception()

    activity = db.query(Activity).filter(Activity.id == qr.activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    if ENFORCE_ATTENDANCE_SESSION_RESTRICTIONS and not _sesion_activa(activity):
        raise activity_session_not_active_exception()

    enrolled = db.query(Reservation).filter(
        Reservation.user_id == current_user.id,
        Reservation.activity_id == qr.activity_id,
        Reservation.status != "cancelled",
    ).first()
    if not enrolled:
        raise user_not_enrolled_exception()

    existing = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.activity_id == qr.activity_id,
    ).first()

    if existing:
        if existing.status == "present":
            raise attendance_already_marked_exception()
        existing.status = "present"
        db.commit()
        db.refresh(existing)
        qr.used_count += 1
        db.commit()
        return existing

    attendance = Attendance(
        user_id=current_user.id,
        activity_id=qr.activity_id,
        status="present",
    )
    db.add(attendance)
    qr.used_count += 1
    db.commit()
    db.refresh(attendance)
    return attendance
