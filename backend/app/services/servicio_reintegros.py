# Reintegro a quienes quedaron en la lista de espera y nunca les tocó el cupo.
#
# Regla de negocio: el no abonado paga para reservar su lugar en la cola. Si se libera un
# cupo, ese pago se convierte en su reserva (promote_next_waitlist_entry). Pero si la
# clase se dicta y nunca le tocó, pagó por un lugar que jamás tuvo: se le devuelve.
#
# El abonado entra a la cola sin pagar, así que no hay nada que reintegrarle: su entrada
# se cierra igual para que no quede colgada como "waiting" para siempre.
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.waitlist import Waitlist

logger = logging.getLogger(__name__)


def _inicio_de_la_clase(actividad: Activity):
    """Cuándo empieza la clase. None si no se puede saber (fijas legacy sin fecha)."""
    if not actividad.specific_date:
        return None
    hora, minuto = 0, 0
    if actividad.time_slot and ":" in actividad.time_slot:
        try:
            hora, minuto = (int(p) for p in actividad.time_slot.split(":")[:2])
        except ValueError:
            hora, minuto = 0, 0
    return datetime(
        actividad.specific_date.year,
        actividad.specific_date.month,
        actividad.specific_date.day,
        hora,
        minuto,
    )


def refund_expired_waitlist_entries(db: Session) -> int:
    """Cierra las entradas en espera cuya clase ya pasó y reintegra a quien había pagado.

    Devuelve la cantidad de entradas cerradas.
    """
    ahora = datetime.now()

    filas = (
        db.query(Waitlist, Activity)
        .join(Activity, Waitlist.activity_id == Activity.id)
        .filter(Waitlist.status == "waiting")
        .all()
    )

    cerradas = 0
    for entrada, actividad in filas:
        inicio = _inicio_de_la_clase(actividad)
        # Sin fecha no se puede saber si la clase pasó: se deja la entrada como está.
        if inicio is None or inicio > ahora:
            continue

        pago = entrada.payment_status
        porcentaje = entrada.deposit_percent

        # La entrada se cierra en el mismo commit que el reintegro: si volviera a quedar
        # en "waiting", la próxima corrida le devolvería la plata otra vez.
        entrada.status = "cancelled"
        db.commit()
        cerradas += 1

        if pago not in ("completed", "partial"):
            continue

        try:
            from app.utils.notifications import notify_waitlist_refunded
            notify_waitlist_refunded(entrada.user_id, actividad.id, porcentaje or 100, db)
        except Exception:
            logger.exception(
                "Error notificando el reintegro de lista de espera al usuario %s (actividad %s)",
                entrada.user_id, actividad.id,
            )

    return cerradas
