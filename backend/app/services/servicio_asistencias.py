# Responsable: Ezequiel - lógica de negocio de asistencias
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.user import User
from app.models.activity import Activity
from app.models.reservation import Reservation
from app.exceptions.http_exceptions import (
    user_not_found_exception,
    activity_not_found_exception,
    attendance_not_found_exception,
    attendance_already_exists_exception,
    user_not_enrolled_exception,
)


def marcar_asistencia_por_dni(dni: str, activity_id: int, comment: str | None, db: Session):
    user = db.query(User).filter(User.dni == dni).first()
    if not user:
        raise user_not_found_exception()

    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise activity_not_found_exception()

    enrolled = db.query(Reservation).filter(
        Reservation.user_id == user.id,
        Reservation.activity_id == activity_id,
        Reservation.status != "cancelled",
    ).first()
    if not enrolled:
        raise user_not_enrolled_exception()

    if db.query(Attendance).filter(
        Attendance.user_id == user.id,
        Attendance.activity_id == activity_id
    ).first():
        raise attendance_already_exists_exception()

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
