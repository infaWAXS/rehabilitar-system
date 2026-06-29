# Cancelación automática de clases sin profesor asignado.
# HU: si a una clase le faltan <= 12 horas para empezar y no tiene profesor asignado,
# se cancela automáticamente y el cliente no es penalizado: el abonado recibe un crédito
# de beneficio y el no abonado recibe el reintegro total de lo que haya abonado.
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.reservation import Reservation
from app.models.activity import Activity
from app.utils.subscriptions import is_abonado
from app.utils.credits import grant_credit

logger = logging.getLogger(__name__)

HOURS_THRESHOLD = 12


def auto_cancel_unstaffed_classes(db: Session) -> int:
    """Cancela reservas de clases sin profesor que empiezan en <= 12 hs.
    Devuelve la cantidad de reservas canceladas."""
    now = datetime.now()
    limite = now + timedelta(hours=HOURS_THRESHOLD)

    filas = (
        db.query(Reservation, Activity)
        .join(Activity, Reservation.activity_id == Activity.id)
        .filter(
            Reservation.status.in_(["confirmed", "pending"]),
            Reservation.reservation_date > now,
            Reservation.reservation_date <= limite,
            Activity.status == "active",
            or_(Activity.professor.is_(None), Activity.professor == ""),
        )
        .all()
    )

    canceladas = 0
    actividades_individuales_canceladas: set[int] = set()

    for reservation, activity in filas:
        reservation.status = "cancelled"

        if activity.activity_type == "individual" and activity.id not in actividades_individuales_canceladas:
            activity.status = "cancelled"
            actividades_individuales_canceladas.add(activity.id)

        credito_otorgado = False
        refund_percent = None
        if is_abonado(reservation.user_id, db):
            credito_otorgado = grant_credit(
                reservation.user_id, db,
                activity_type=activity.specialization,
                reservation_id=reservation.id,
                reason="center_cancellation",
            )
            reservation.cancellation_result = "center_credit" if credito_otorgado else "center_credit_capped"
        else:
            refund_percent = reservation.deposit_percent or 100
            reservation.cancellation_result = "center_refund"

        db.commit()

        try:
            from app.utils.notifications import notify_class_cancelled_by_center
            notify_class_cancelled_by_center(reservation.user_id, activity.id, credito_otorgado, refund_percent, db)
        except Exception:
            logger.exception(
                "Error notificando cancelación automática de reserva %s (actividad %s)",
                reservation.id, activity.id,
            )

        canceladas += 1

    return canceladas
