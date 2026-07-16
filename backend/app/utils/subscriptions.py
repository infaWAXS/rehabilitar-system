# Helper compartido: lógica de abonado
#
# Modelo: cada UserPlan es un TOKEN de un solo uso para una especialidad. No vence:
# el cliente lo usa cuando quiere. Al gastarlo se inscribe a una actividad fija y eso
# lo anota a las clases que esa actividad tenga en ese mes (hasta
# MAX_SUBSCRIPTION_FIXED_CLASSES). "Plan Mensual" no son 30 días: son las 4 clases de
# un mes. Un cliente puede tener varios tokens, pero uno solo por especialidad.
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models.user_plan import UserPlan

# Clases que cubre un token dentro del mes de la actividad elegida.
MAX_SUBSCRIPTION_FIXED_CLASSES = 4

# Si al gastar el token el mes de la actividad tenía esta cantidad de clases O MENOS, el
# cliente recibió menos de lo que cubre el plan y se lo compensa con un descuento para su
# próxima compra.
SHORT_MONTH_CLASSES = 2
SHORT_MONTH_DISCOUNT_PERCENT = 20

# Descuento para adultos mayores: quien tiene 65 años o más recibe este % de
# descuento al adquirir un plan.
SENIOR_AGE = 65
SENIOR_AGE_DISCOUNT_PERCENT = 20


def calcular_edad(birth_date, hoy: date = None) -> int:
    """Edad en años cumplidos a la fecha `hoy` (por defecto hoy)."""
    hoy = hoy or date.today()
    return hoy.year - birth_date.year - ((hoy.month, hoy.day) < (birth_date.month, birth_date.day))


def get_age_discount_percent(user, hoy: date = None) -> int:
    """% de descuento por edad al adquirir un plan: 20% si el cliente tiene 65 años o más."""
    if not user or not getattr(user, "birth_date", None):
        return 0
    return SENIOR_AGE_DISCOUNT_PERCENT if calcular_edad(user.birth_date, hoy) >= SENIOR_AGE else 0


def is_abonado(user_id: int, db: Session) -> bool:
    """Es abonado quien tiene un token sin gastar, o clases futuras pagadas con uno.

    Los planes ya no vencen por fecha, así que el estado de abonado dura todo el ciclo
    de uso del token: desde que lo compra hasta que termina de cursar las clases que
    pagó con él. Si se cortara al gastarlo, el cliente perdería la prioridad en lista de
    espera y los créditos por cancelar justo mientras está usando el plan.
    """
    from app.models.reservation import Reservation

    for plan in get_active_user_plans(user_id, db):
        if not is_token_usado(plan.id, db):
            return True

    return (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user_id,
            Reservation.user_plan_id.isnot(None),
            Reservation.status != "cancelled",
            Reservation.reservation_date >= datetime.now(),
        )
        .first()
        is not None
    )


def is_token_usado(user_plan_id: int, db: Session) -> bool:
    """Un token se gasta con la primera inscripción que se imputa a ese plan.

    Esa inscripción arrastra las clases del mes de la actividad, así que el token no se
    consume "de a una clase": o está entero, o está gastado.

    Un token gastado NO vuelve atrás: cancelar los turnos no lo devuelve. Al cliente que
    cancela lo compensa la política de cancelación (créditos y descuentos), no la
    devolución del plan. Por eso acá se cuentan TAMBIÉN las reservas canceladas: la fila
    cancelada es el registro de que el token ya se usó. Si se filtraran (como hace
    count_subscription_classes_used, que sirve para contar clases vigentes), cancelar
    todos los turnos haría revivir el token.
    """
    from app.models.reservation import Reservation

    return (
        db.query(Reservation)
        .filter(Reservation.user_plan_id == user_plan_id)
        .first()
        is not None
    )


def get_active_user_plan(user_id: int, db: Session):
    """Devuelve un UserPlan activo del usuario (o None). Si tiene varios, no
    garantiza cuál; usar get_active_user_plans o find_active_plan_for_specialization
    cuando importe distinguir por especialidad."""
    return (
        db.query(UserPlan)
        .filter(
            UserPlan.user_id == user_id,
            UserPlan.status == "active",
        )
        .first()
    )


def get_active_user_plans(user_id: int, db: Session):
    """Devuelve todos los UserPlan no cancelados del usuario (puede tener varios).

    No se filtra por fecha: los tokens no vencen.
    """
    return (
        db.query(UserPlan)
        .filter(
            UserPlan.user_id == user_id,
            UserPlan.status == "active",
        )
        .order_by(UserPlan.start_date.asc())
        .all()
    )


def count_subscription_classes_used(user_plan_id: int, db: Session) -> int:
    """Cantidad de clases fijas ya reservadas usando este plan puntual (no canceladas)."""
    from app.models.reservation import Reservation
    return (
        db.query(Reservation)
        .filter(Reservation.user_plan_id == user_plan_id, Reservation.status != "cancelled")
        .count()
    )


def find_active_plan_for_specialization(user_id: int, specialization: str, db: Session,
                                         require_capacity: bool = False):
    """
    Entre los planes del usuario, devuelve el primero que coincide con `specialization`.
    Si `require_capacity` es True, ignora los tokens ya gastados.

    Ojo con la diferencia: sin `require_capacity` sirve para saber si ya tiene una
    suscripción de esa especialidad (no se puede comprar otra hasta gastarla); con
    `require_capacity` sirve para saber si puede inscribirse por suscripción.
    """
    for plan in get_active_user_plans(user_id, db):
        if plan.specialization != specialization:
            continue
        if require_capacity and is_token_usado(plan.id, db):
            continue
        return plan
    return None
