# Responsable: suspensión automática por asistencia
# Regla de negocio:
#   - Si un cliente acumula MÁS de 3 inasistencias → se suspende la cuenta.
#   - Si un cliente tiene MENOS del 50% de asistencia en el mes → se suspende la cuenta.
# En ambos casos se informa el motivo al cliente (email + notificación in-app),
# reutilizando la suspensión iniciada por el sistema (servicio_clientes).
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.attendance import Attendance
from app.services.servicio_clientes import suspender_cliente_por_sistema

# Límite de inasistencias acumuladas permitidas (se suspende al superarlo).
MAX_INASISTENCIAS = 3
# Porcentaje mínimo de asistencia mensual exigido.
MIN_ASISTENCIA_MENSUAL = 0.5
# Mínimo de clases registradas en el mes para aplicar la regla del 50%
# (evita suspender a un cliente que solo tuvo una clase y faltó).
MIN_CLASES_PARA_EVALUAR_MENSUAL = 2


def contar_inasistencias_totales(user_id: int, db: Session) -> int:
    """Cantidad total de inasistencias (registros con status 'absent') del cliente."""
    return db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.status == "absent",
    ).count()


def calcular_asistencia_mensual(user_id: int, db: Session):
    """Devuelve (presentes, total, ratio) de asistencia del mes en curso.

    Solo se consideran clases con asistencia ya registrada (present/absent); las que
    siguen 'pending' no cuentan. ratio es None cuando no hay clases registradas.
    """
    hoy = datetime.now()
    inicio_mes = datetime(hoy.year, hoy.month, 1)

    registros = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.status.in_(["present", "absent"]),
        Attendance.timestamp >= inicio_mes,
    ).all()

    total = len(registros)
    presentes = sum(1 for r in registros if r.status == "present")
    ratio = (presentes / total) if total > 0 else None
    return presentes, total, ratio


def evaluar_suspension_por_asistencia(user_id: int, db: Session):
    """Evalúa las reglas de suspensión por asistencia para un cliente y, si corresponde,
    suspende la cuenta informando el motivo.

    Devuelve un dict con el resultado si se suspendió, o None si no correspondía.
    """
    cliente = db.query(User).filter(User.id == user_id).first()
    if not cliente or cliente.role != "client" or cliente.is_deleted:
        return None
    # Solo tiene sentido evaluar cuentas activas (una ya suspendida no se re-suspende).
    if cliente.account_status != "active":
        return None

    # Regla 1: más de 3 inasistencias acumuladas.
    inasistencias = contar_inasistencias_totales(user_id, db)
    if inasistencias > MAX_INASISTENCIAS:
        motivo = (
            f"Acumulaste {inasistencias} inasistencias a tus actividades "
            f"(el máximo permitido es {MAX_INASISTENCIAS})."
        )
        if suspender_cliente_por_sistema(cliente, motivo, db):
            return {"user_id": user_id, "suspendido": True, "regla": "inasistencias", "motivo": motivo}
        return None

    # Regla 2: menos del 50% de asistencia en el mes.
    presentes, total, ratio = calcular_asistencia_mensual(user_id, db)
    if total >= MIN_CLASES_PARA_EVALUAR_MENSUAL and ratio is not None and ratio < MIN_ASISTENCIA_MENSUAL:
        porcentaje = round(ratio * 100)
        motivo = (
            f"Tu asistencia de este mes fue del {porcentaje}% ({presentes} de {total} clases), "
            f"por debajo del 50% requerido."
        )
        if suspender_cliente_por_sistema(cliente, motivo, db):
            return {"user_id": user_id, "suspendido": True, "regla": "asistencia_mensual", "motivo": motivo}
        return None

    return None


def evaluar_suspension_actividad(activity_id: int, db: Session):
    """Evalúa la suspensión de todos los clientes con asistencia registrada en una
    actividad (present o absent). Se usa al finalizar la toma de asistencia de una clase.
    Devuelve la lista de suspensiones aplicadas.
    """
    user_ids = [
        row[0]
        for row in db.query(Attendance.user_id)
        .filter(Attendance.activity_id == activity_id)
        .distinct()
        .all()
    ]

    suspensiones = []
    for uid in user_ids:
        resultado = evaluar_suspension_por_asistencia(uid, db)
        if resultado:
            suspensiones.append(resultado)
    return suspensiones
