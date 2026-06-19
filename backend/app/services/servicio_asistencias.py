# Responsable: Ezequiel - lógica de negocio de asistencias
import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.attendance_qr import AttendanceQrCode
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
    qr_not_found_exception,
    qr_expired_exception,
)

QR_VALIDITY_MINUTES = 15


def pregenerar_ausentes(activity_id: int, db: Session):
    """
    Pre-genera registros de asistencia con status='absent' para todos los
    clientes con reserva confirmada en la actividad que aún no tengan registro.
    Idempotente: llamarlo varias veces no duplica registros.
    """
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

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


def _registrar_presente(user_id: int, activity_id: int, db: Session, comment: str | None = None):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    enrolled = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.activity_id == activity_id,
        Reservation.status != "cancelled",
    ).first()
    if not enrolled:
        raise user_not_enrolled_exception()

    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
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
        user_id=user_id,
        activity_id=activity_id,
        status="present",
        comment=comment,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


def marcar_asistencia_por_dni(dni: str, activity_id: int, comment: str | None, db: Session):
    user = db.query(User).filter(User.dni == dni).first()
    if not user:
        raise user_not_found_exception()

    return _registrar_presente(user.id, activity_id, db, comment)


def generar_qr_asistencia(activity_id: int, db: Session) -> AttendanceQrCode:
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    qr = AttendanceQrCode(
        code=uuid.uuid4().hex,
        activity_id=activity_id,
        expires_at=datetime.utcnow() + timedelta(minutes=QR_VALIDITY_MINUTES),
    )
    db.add(qr)
    db.commit()
    db.refresh(qr)
    return qr


def registrar_asistencia_por_qr(code: str, user_id: int, db: Session) -> Attendance:
    qr = db.query(AttendanceQrCode).filter(AttendanceQrCode.code == code).first()
    if not qr:
        raise qr_not_found_exception()

    if qr.expires_at < datetime.utcnow():
        raise qr_expired_exception()

    return _registrar_presente(user_id, qr.activity_id, db)



def actualizar_comentario(attendance_id: int, comment: str, db: Session):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise attendance_not_found_exception()

    attendance.comment = comment
    db.commit()
    db.refresh(attendance)
    return attendance


def eliminar_comentario(attendance_id: int, db: Session):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise attendance_not_found_exception()

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
