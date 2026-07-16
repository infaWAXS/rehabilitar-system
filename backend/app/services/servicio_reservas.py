# Responsable: Francis - Logica de negocio de reservas
# HU: Inscribirse a actividad fija / Inscribirse a actividad individual
from threading import Thread
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from calendar import monthrange
from datetime import date, datetime

from app.models.reservation import Reservation
from app.models.user import User
from app.models.activity import Activity
from app.exceptions.http_exceptions import user_not_found_exception, medical_certificate_not_approved_exception
from app.utils.credits import get_monthly_balance, spend_credit, grant_credit, was_paid_with_credit
from database.connection import SessionLocal

from app.models.audit_log import AuditType, AuditAction, AuditResult
from app.services.servicio_auditoria import register_audit

def _cupos_libres(activity: Activity, db: Session) -> int:
    """Cupos libres de UNA ocurrencia concreta.

    Las ocurrencias de una fija son filas separadas con su propia specific_date, así
    que alcanza con contar las reservas de esa fila (no hace falta filtrar por fecha
    como en obtener_disponibilidad_actividad, que existe para las fijas legacy donde
    una sola fila cubre todos los turnos).
    """
    usadas = db.query(func.count(Reservation.id)).filter(
        Reservation.activity_id == activity.id,
        Reservation.status != "cancelled",
    ).scalar() or 0
    return max(0, (activity.capacity or 0) - usadas)


def _hora_de(activity: Activity) -> datetime:
    """Fecha+hora de inicio de la ocurrencia, para guardar en reservation_date."""
    hora, minuto = 0, 0
    if activity.time_slot and ":" in activity.time_slot:
        try:
            hora, minuto = (int(p) for p in activity.time_slot.split(":")[:2])
        except ValueError:
            hora, minuto = 0, 0
    return datetime(
        activity.specific_date.year,
        activity.specific_date.month,
        activity.specific_date.day,
        hora,
        minuto,
    )


def _inscribir_ocurrencias_del_mes(user_id: int, actividad: Activity, user_plan, db: Session) -> dict:
    """Anota al cliente en el resto de las clases del mes del mismo lote.

    Regla de negocio: el plan cubre las clases fijas del mes de su especialidad, así que
    inscribirse a una es inscribirse al mes entero — el cliente no elige clase por clase.
    Solo aplica al pago por suscripción; el resto de los métodos reserva una sola clase.

    Las que están llenas van a lista de espera (prioritaria, por ser abonado) en vez de
    hacer fallar la inscripción entera: una clase completa no puede dejarlo sin el mes.

    Devuelve el detalle de lo que hizo para poder informarlo en la respuesta.
    """
    from app.services.servicio_lista_espera import add_to_waitlist
    from app.models.waitlist import Waitlist
    from app.utils.subscriptions import MAX_SUBSCRIPTION_FIXED_CLASSES, count_subscription_classes_used

    # clases_del_mes incluye la que el cliente eligió: es el total que le va a dar el
    # token, y con eso se decide si le corresponde el descuento por mes corto.
    resultado = {"reservadas": [], "en_espera": [], "omitidas": [], "clases_del_mes": 1}

    if not actividad.activity_group_id or not actividad.specific_date:
        # Fija legacy (una sola fila para todos los turnos): no hay ocurrencias
        # hermanas que anotar, se comporta como antes.
        return resultado

    # "El mes" = mes calendario de la clase elegida. Se compara por rango y no con
    # strftime para no atarse a SQLite y para que el filtro pueda usar el índice.
    hoy = date.today()
    primer_dia = actividad.specific_date.replace(day=1)
    ultimo_dia = actividad.specific_date.replace(
        day=monthrange(actividad.specific_date.year, actividad.specific_date.month)[1]
    )
    hermanas = db.query(Activity).filter(
        Activity.activity_group_id == actividad.activity_group_id,
        Activity.id != actividad.id,
        Activity.status == "active",
        Activity.specific_date.isnot(None),
        Activity.specific_date >= primer_dia,
        Activity.specific_date <= ultimo_dia,
        Activity.specific_date >= hoy,
    ).order_by(Activity.specific_date.asc()).all()

    # Las clases que quedan del mes: las hermanas futuras más la elegida. Es el total
    # real que recibe el token, aunque alguna termine en lista de espera por estar llena.
    resultado["clases_del_mes"] = min(1 + len(hermanas), MAX_SUBSCRIPTION_FIXED_CLASSES)

    for hermana in hermanas:
        # El plan cubre un máximo de clases: se corta al llegar al tope (un mes puede
        # tener 5 ocurrencias del mismo día de semana).
        usadas = count_subscription_classes_used(user_plan.id, db)
        if usadas >= MAX_SUBSCRIPTION_FIXED_CLASSES:
            resultado["omitidas"].append(hermana.specific_date)
            continue

        ya_reservada = db.query(Reservation).filter(
            Reservation.user_id == user_id,
            Reservation.activity_id == hermana.id,
            Reservation.status != "cancelled",
        ).first()
        if ya_reservada:
            continue

        if _cupos_libres(hermana, db) > 0:
            db.add(Reservation(
                user_id=user_id,
                activity_id=hermana.id,
                reservation_type="fixed",
                status="confirmed",
                payment_status="completed",
                reservation_date=_hora_de(hermana),
                deposit_percent=None,
                user_plan_id=user_plan.id,
            ))
            db.commit()
            resultado["reservadas"].append(hermana.specific_date)
        else:
            ya_en_espera = db.query(Waitlist).filter(
                Waitlist.user_id == user_id,
                Waitlist.activity_id == hermana.id,
                Waitlist.status == "waiting",
            ).first()
            if ya_en_espera:
                continue
            try:
                # Sin aviso propio: el aviso único del mes ya informa las que quedaron
                # en lista de espera.
                add_to_waitlist(user_id, hermana.id, db, notificar=False)
                resultado["en_espera"].append(hermana.specific_date)
            except HTTPException:
                # Que no se pueda encolar en una clase no invalida el resto del mes.
                resultado["omitidas"].append(hermana.specific_date)

    return resultado


def _otorgar_descuento_mes_corto(user: User, clases_del_mes: int, db: Session) -> int:
    """Compensa con un descuento al cliente que gastó su token en un mes corto.

    El plan cubre 4 clases de un mes; si la actividad elegida tenía SHORT_MONTH_CLASSES o
    menos en ese mes, el token se gasta igual y el cliente recibió menos de lo que pagó.
    El descuento queda pendiente para su próxima compra.

    El corte es "o menos" y no "exactamente 2" a propósito: `clases_del_mes` cuenta solo
    las clases FUTURAS del mes, así que quien gasta el token en el último martes se queda
    con 1 sola clase. Es el que menos recibió por lo que pagó y también le corresponde.

    Devuelve lo que se otorgó ACÁ, o 0. Si el cliente ya tenía un descuento mayor (por
    ejemplo el 30% de una cancelación) se le respeta el suyo —los descuentos no se
    acumulan— pero devolver ese número haría que el aviso se lo atribuya al mes corto y
    le informe un descuento que no se le acaba de otorgar.
    """
    from app.utils.subscriptions import SHORT_MONTH_CLASSES, SHORT_MONTH_DISCOUNT_PERCENT

    if not user or clases_del_mes > SHORT_MONTH_CLASSES:
        return 0

    if (user.pending_discount_percent or 0) < SHORT_MONTH_DISCOUNT_PERCENT:
        user.pending_discount_percent = SHORT_MONTH_DISCOUNT_PERCENT
        user.pending_discount_reason = "mes_corto"
        db.commit()
        return SHORT_MONTH_DISCOUNT_PERCENT

    return 0


# Crea una nueva reserva para un usuario en una actividad.
# payment_method: subscription | full_payment | partial_payment | credit
# Reglas de negocio (HU actividad fija/individual):
#   - subscription, full_payment, credit  -> confirmada + pago completado
#   - partial_payment (sena 50-100%)      -> pendiente  + pago parcial
def create_reservation(user_id: int, activity_id: int, reservation_type: str,
                       reservation_date: datetime, db: Session,
                       payment_method: str = "full_payment",
                       test_scenario: str = "success",
                       deposit_percent: int = None):
    user = db.query(User).filter(User.id == user_id).first()
    activity = db.query(Activity).filter(Activity.id == activity_id).first()

    if not user:
        raise user_not_found_exception()

    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # Regla de negocio: sin apto físico aprobado el cliente no puede inscribirse a
    # ninguna actividad.
    if user.medical_certificate_status != "approved":
        raise medical_certificate_not_approved_exception()

    if reservation_type not in ("fixed", "individual"):
        raise HTTPException(status_code=400,
                            detail="El tipo de reserva debe ser 'fixed' o 'individual'")

    valid_methods = ("subscription", "full_payment", "partial_payment", "credit")
    if payment_method not in valid_methods:
        raise HTTPException(status_code=400,
                            detail=f"Metodo de pago invalido. Debe ser uno de: {', '.join(valid_methods)}")

    # Validar disponibilidad de crédito (el descuento se registra luego de crear la reserva)
    if payment_method == "credit":
        # El crédito solo sirve para clases fijas (da igual la especialidad, a diferencia
        # del token de suscripción). Y reserva UNA sola clase: no arrastra el resto del
        # mes como sí lo hace la suscripción (eso está atado a payment_method=="subscription").
        if reservation_type != "fixed":
            raise HTTPException(status_code=400, detail="El crédito solo se puede usar en clases fijas, no en actividades individuales.")
        if get_monthly_balance(user_id, db) <= 0:
            raise HTTPException(status_code=400, detail="No tenés créditos disponibles para usar este mes.")

    # Validar disponibilidad de cupo en la suscripción (máximo 4 clases fijas por plan)
    user_plan_usado = None
    if payment_method == "subscription":
        from app.utils.subscriptions import find_active_plan_for_specialization
        if reservation_type != "fixed":
            raise HTTPException(status_code=400, detail="La suscripción solo aplica a clases fijas.")
        # El token es de un solo uso: si ya lo gastó, no hay plan disponible para esta
        # especialidad hasta que compre otro.
        user_plan_usado = find_active_plan_for_specialization(user_id, activity.specialization, db, require_capacity=True)
        if not user_plan_usado:
            raise HTTPException(
                status_code=400,
                detail="No tenés una suscripción disponible para esta especialidad. Ya usaste la que tenías o todavía no compraste una.",
            )

    # % efectivamente abonado (solo relevante para pagos monetarios; se usa luego para
    # calcular el reintegro exacto si el cliente cancela)
    deposit_percent_val = None
    if payment_method == "full_payment":
        deposit_percent_val = 100
    elif payment_method == "partial_payment":
        deposit_percent_val = deposit_percent if deposit_percent is not None else 50
        if not (50 <= deposit_percent_val <= 100):
            raise HTTPException(status_code=400, detail="La seña debe ser un porcentaje entre 50 y 100.")

    # Simulación Mercado Pago para pagos monetarios (full y partial)
    if payment_method in ("full_payment", "partial_payment"):
        escenario = test_scenario or "success"
        if escenario == "insufficient_funds":
            register_audit(
                db=db,
                user_id=user_id,
                type=AuditType.PAYMENT,
                action=AuditAction.INDIVIDUAL,
                result=AuditResult.ERROR,
                detail=f"Pago rechazado por fondos insuficientes para el usuario {user.name} {user.lastname} para la actividad {activity.name} (id {activity.id})."
            )
            db.commit()
            raise HTTPException(status_code=402, detail="Pago rechazado: fondos insuficientes en la cuenta.")
        elif escenario == "connection_error":
            raise HTTPException(status_code=503, detail="Error de conexión con el servidor del banco. Intentá nuevamente.")
        # escenario == "success" → continuar normalmente

    # Estado de la reserva segun metodo de pago
    if payment_method in ("subscription", "full_payment", "credit"):
        status = "confirmed"
        payment_status_val = "completed"
    else:  # partial_payment (sena)
        status = "pending"
        payment_status_val = "partial"

    if payment_method in ("full_payment", "partial_payment"):
        total = activity.price * deposit_percent_val / 100
        register_audit(
            db=db,
            user_id=user_id,
            type=AuditType.PAYMENT,
            action=AuditAction.INDIVIDUAL,
            result=AuditResult.SUCCESS,
            detail=f"Usuario {user.name} {user.lastname} pagó una reserva para la actividad {activity.name} (id {activity.id}). Pago: ${total:.2f}."
        )

    new_reservation = Reservation(
        user_id=user_id,
        activity_id=activity_id,
        reservation_type=reservation_type,
        status=status,
        payment_status=payment_status_val,
        reservation_date=reservation_date,
        deposit_percent=deposit_percent_val,
        user_plan_id=user_plan_usado.id if user_plan_usado else None,
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    if payment_method == "credit":
        spend_credit(user_id, db, reservation_id=new_reservation.id)

    # El token cubre el mes: inscribirse por suscripción a una clase fija anota también
    # al resto de las clases del mes de ese mismo lote. Tiene que pasar ANTES de avisar,
    # porque de eso depende qué aviso corresponde.
    extras = {"reservadas": [], "en_espera": [], "omitidas": [], "clases_del_mes": 1}
    descuento_mes_corto = 0
    anoto_el_mes = False
    if payment_method == "subscription" and reservation_type == "fixed" and user_plan_usado:
        extras = _inscribir_ocurrencias_del_mes(user_id, activity, user_plan_usado, db)
        descuento_mes_corto = _otorgar_descuento_mes_corto(user, extras["clases_del_mes"], db)
        anoto_el_mes = bool(activity.activity_group_id and activity.specific_date)

    uid_copia = new_reservation.user_id
    aid_copia = new_reservation.activity_id

    if anoto_el_mes:
        # Un solo aviso con todas las clases del mes: para el cliente fue una sola acción.
        fechas_reservadas = sorted([activity.specific_date] + extras["reservadas"])
        fechas_espera = sorted(extras["en_espera"])
        descuento_copia = descuento_mes_corto

        def _notif_async(uid: int, aid: int) -> None:
            from app.utils.notifications import notify_month_subscription_enrollment
            db_n = SessionLocal()
            try:
                notify_month_subscription_enrollment(
                    uid, aid, fechas_reservadas, fechas_espera, descuento_copia, db_n
                )
            except Exception:
                pass
            finally:
                db_n.close()
    else:
        def _notif_async(uid: int, aid: int) -> None:
            from app.utils.notifications import notify_reservation_created
            db_n = SessionLocal()
            try:
                notify_reservation_created(uid, aid, db_n)
            except Exception:
                pass
            finally:
                db_n.close()

    Thread(target=_notif_async, args=(uid_copia, aid_copia), daemon=True).start()

    return {
        "id": new_reservation.id,
        "user_id": new_reservation.user_id,
        "activity_id": new_reservation.activity_id,
        "reservation_type": new_reservation.reservation_type,
        "status": new_reservation.status,
        "payment_status": new_reservation.payment_status,
        "reservation_date": new_reservation.reservation_date,
        "created_at": new_reservation.created_at,
        "deposit_percent": new_reservation.deposit_percent,
        # Resto del mes anotado automáticamente (solo suscripción). El total de clases
        # incluye la que el cliente eligió.
        "month_enrolled_count": len(extras["reservadas"]) + 1,
        "month_enrolled_dates": [d.isoformat() for d in extras["reservadas"]],
        "month_waitlisted_dates": [d.isoformat() for d in extras["en_espera"]],
        "month_skipped_dates": [d.isoformat() for d in extras["omitidas"]],
        # Descuento otorgado para la próxima compra por haber gastado el token en un
        # mes con menos clases de las que cubre el plan. 0 si no corresponde.
        "short_month_discount_percent": descuento_mes_corto,
    }


# Obtiene todas las reservas de un usuario
def get_user_reservations(user_id: int, db: Session):
    """Obtiene todas las reservas activas de un usuario"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise user_not_found_exception()
    
    reservations = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.status != "cancelled"
    ).all()
    
    return reservations


# HU: Ver mis reservas - devuelve reservas activas con datos de la actividad
def get_user_reservations_enriched(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise user_not_found_exception()

    rows = (
        db.query(Reservation, Activity)
        .join(Activity, Reservation.activity_id == Activity.id)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status != "cancelled",
        )
        .all()
    )

    result = []
    for reservation, activity in rows:
        result.append({
            "id": reservation.id,
            "activity_id": activity.id,
            "activity_name": activity.name,
            "activity_type": activity.activity_type,
            "schedule": activity.schedule,
            "specific_date": str(activity.specific_date) if activity.specific_date else None,
            "time_slot": activity.time_slot,
            "reservation_type": reservation.reservation_type,
            "status": reservation.status,
            "payment_status": reservation.payment_status,
            "deposit_percent": reservation.deposit_percent,
            "reservation_date": reservation.reservation_date,
            "created_at": reservation.created_at,
        })
    return result
def get_reservation_by_id(reservation_id: int, db: Session):
    """Obtiene una reserva por ID"""
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    
    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada"
        )
    
    return reservation


# Cancela una reserva (stub simple, sin lógica de negocio)
def cancel_reservation(reservation_id: int, db: Session):
    """Cancela una reserva existente (sin aplicar políticas)"""
    reservation = get_reservation_by_id(reservation_id, db)

    if reservation.status == "cancelled":
        raise HTTPException(status_code=400, detail="La reserva ya ha sido cancelada")

    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    return reservation


# HU: Cancelar turno — aplica reglas de negocio según tipo de cliente y anticipación
def cancel_reservation_with_policy(reservation_id: int, user_id: int, db: Session):
    """
    Cancela una reserva aplicando la política según:
    - si el cliente es abonado o no
    - cuántas horas faltan para la clase
    - cantidad de cancelaciones en la franja 24-48h ya registradas en el mes (solo abonados)

    Resultados posibles:
      credit           → abonado + > 48 h (sujeto a tope mensual de 3 créditos)
      discount_20      → abonado + 24-48 h, 1ra vez en el mes → 20% para el próximo pago de suscripción
      discount_30      → abonado + 24-48 h, 2da vez en el mes → 30% TOTAL (no acumulativo) para el próximo pago
      no_benefit       → abonado + < 24 h  | abonado + 24-48h y 3ra vez en el mes (pierde el beneficio)
      deposit_returned → no abonado + > 24 h → se reintegra el % exacto abonado (seña o total)
      no_refund        → no abonado + ≤ 24 h → pierde la seña, sin reintegro
    """
    from datetime import datetime, date as date_cls
    from app.utils.subscriptions import is_abonado, find_active_plan_for_specialization
    from app.models.user_plan import UserPlan

    reservation = get_reservation_by_id(reservation_id, db)

    if reservation.user_id != user_id:
        raise HTTPException(status_code=403, detail="No tenés permiso para cancelar esta reserva")

    if reservation.status == "cancelled":
        raise HTTPException(status_code=400, detail="La reserva ya fue cancelada")

    now = datetime.now()
    class_start = reservation.reservation_date

    # Escenario 6: clase ya comenzó o finalizó
    if class_start <= now:
        raise HTTPException(status_code=400, detail="No se puede cancelar: la clase está en curso o ya finalizó")

    hours_until = (class_start - now).total_seconds() / 3600

    abonado = is_abonado(user_id, db)
    user = db.query(User).filter(User.id == user_id).first()
    activity = db.query(Activity).filter(Activity.id == reservation.activity_id).first()
    plan = None
    if abonado:
        # El usuario puede tener varios planes activos: se usa el que efectivamente
        # pagó esta reserva y, si no aplicó suscripción, el que coincide con la
        # especialidad de la actividad (si existe).
        if reservation.user_plan_id:
            plan = db.query(UserPlan).filter(UserPlan.id == reservation.user_plan_id).first()
        if not plan:
            plan = find_active_plan_for_specialization(user_id, activity.specialization, db)

    # Contar cancelaciones en la franja 24-48h ya registradas este mes (solo abonados)
    today = date_cls.today()
    inicio_mes = datetime(today.year, today.month, 1)
    discount_band_count = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.cancellation_result.in_(["discount_20", "discount_30"]),
        Reservation.updated_at >= inicio_mes,
    ).count()

    # ── Reglas de negocio ──────────────────────────────────────────────────────
    if abonado and plan and plan.specialization == activity.specialization:
        if hours_until > 48:
            if was_paid_with_credit(reservation.id, db):
                result = "no_benefit"
                message = "Turno cancelado. No se otorga crédito: esta clase fue reservada usando un crédito."
            else:
                actividad = db.query(Activity).filter(Activity.id == reservation.activity_id).first()
                otorgado = grant_credit(
                    user_id, db,
                    activity_type=actividad.specialization if actividad else None,
                    reservation_id=reservation.id,
                    reason="cancellation_48h",
                )
                if otorgado:
                    result = "credit"
                    message = "Turno cancelado. Se te otorgó un crédito para tu próxima clase."
                else:
                    result = "no_benefit"
                    message = "Turno cancelado. Ya alcanzaste el límite de 3 créditos este mes."
        elif hours_until >= 24:
            if discount_band_count == 0:
                result = "discount_20"
                message = "Turno cancelado. Tendrás un 20% de descuento en el pago de tu próxima suscripción mensual."
                user.pending_discount_percent = 20
                user.pending_discount_reason = "cancelacion"
            elif discount_band_count == 1:
                result = "discount_30"
                message = "Turno cancelado. Tendrás un 30% de descuento (total, no acumulativo) en el pago de tu próxima suscripción mensual."
                user.pending_discount_percent = 30
                user.pending_discount_reason = "cancelacion"
            else:
                result = "no_benefit"
                message = "Turno cancelado. Perdiste el beneficio de descuento por cancelaciones repetidas este mes."
                user.pending_discount_percent = 0
                user.pending_discount_reason = None
        else:
            result = "no_benefit"
            message = "Turno cancelado. No recibís crédito ni devolución: cancelaste con menos de 24 hs de anticipación."
    else:
        percent = reservation.deposit_percent or 100
        if hours_until > 24:
            total_refund = activity.price * percent / 100
            register_audit(
                db=db,
                user_id=user_id,
                type=AuditType.PAYMENT,
                action=AuditAction.REFUND,
                result=AuditResult.SUCCESS,
                detail=f"Se hace un reintegro a {user.name} {user.lastname} de la actividad {activity.name} (id {activity.id}) de {total_refund:.2f}.",
            )
            result = "deposit_returned"
            message = f"Turno cancelado. Se te reintegra el {percent}% que habías abonado."
        else:
            result = "no_refund"
            message = "Turno cancelado. No se reintegra lo abonado: cancelaste con menos de 24 hs de anticipación."

    reservation.status = "cancelled"
    reservation.cancellation_result = result
    db.commit()
    db.refresh(reservation)

    from app.services.servicio_lista_espera import promote_next_waitlist_entry
    nueva_reserva = promote_next_waitlist_entry(reservation.activity_id, db)
    if nueva_reserva:
        uid_promovido = nueva_reserva.user_id
        aid_promovido = nueva_reserva.activity_id

        def _notif_async(uid: int, aid: int) -> None:
            from app.utils.notifications import notify_waitlist_promoted
            db_n = SessionLocal()
            try:
                notify_waitlist_promoted(uid, aid, db_n)
            except Exception:
                pass
            finally:
                db_n.close()

        Thread(target=_notif_async, args=(uid_promovido, aid_promovido), daemon=True).start()

    return {
        "id": reservation.id,
        "result": result,
        "message": message,
        "hours_until_class": round(hours_until, 1),
    }


# Actualiza el estado de pago de una reserva
def update_reservation_payment_status(reservation_id: int, payment_status: str, db: Session):
    """Actualiza el estado de pago de una reserva"""
    reservation = get_reservation_by_id(reservation_id, db)
    
    valid_statuses = ["pending", "partial", "completed"]
    if payment_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Estado de pago debe ser uno de: {', '.join(valid_statuses)}"
        )
    
    reservation.payment_status = payment_status
    db.commit()
    db.refresh(reservation)
    
    return reservation


# Confirma una reserva (después de realizar el pago)
def confirm_reservation(reservation_id: int, db: Session):
    """Confirma una reserva después del pago"""
    reservation = get_reservation_by_id(reservation_id, db)
    
    if reservation.payment_status != "completed":
        raise HTTPException(
            status_code=400,
            detail="No se puede confirmar una reserva sin pago completo"
        )
    
    reservation.status = "confirmed"
    db.commit()
    db.refresh(reservation)
    
    return reservation


def check_subscription_availability(user_id: int, activity_id: int, db: Session):
    """
    Verifica si el usuario puede inscribirse a ESTA actividad usando una suscripción.

    Ojo: no alcanza con ser abonado. La suscripción es un token de un solo uso atado a
    una especialidad, así que sirve para esta actividad solo si es de esa especialidad y
    todavía no se gastó. Es el dato que la pantalla usa para decir "tu situación".

    Retorna:
    {
        "can_use_subscription": bool,   # hay un token sin usar para la especialidad de la actividad
        "has_age_discount": bool,       # 65 años o más
        "plan_specialization": str,     # especialidad del plan encontrado (usado o no); None si no tiene
        "activity_specialization": str, # especialidad de la actividad
        "classes_used": int | None,
        "classes_max": int,
        "classes_remaining": int | None,
    }
    """
    from app.utils.subscriptions import (
        find_active_plan_for_specialization,
        count_subscription_classes_used,
        get_age_discount_percent,
        MAX_SUBSCRIPTION_FIXED_CLASSES,
    )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise user_not_found_exception()

    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # Descuento por edad: el mismo criterio que al adquirir un plan (65 años o más).
    # Antes acá se recalculaba a mano con `> 65`, así que un cliente de exactamente 65
    # tenía descuento al comprar el plan y no al inscribirse.
    has_age_discount = get_age_discount_percent(user) > 0

    can_use_subscription = False
    plan_specialization = None
    classes_used = None
    classes_remaining = None

    if activity.activity_type == "fixed":
        plan_con_cupo = find_active_plan_for_specialization(user_id, activity.specialization, db, require_capacity=True)
        if plan_con_cupo:
            plan_specialization = plan_con_cupo.specialization
            classes_used = count_subscription_classes_used(plan_con_cupo.id, db)
            classes_remaining = MAX_SUBSCRIPTION_FIXED_CLASSES - classes_used
            can_use_subscription = True
        else:
            # Puede tener un plan de esa especialidad pero sin cupo restante
            plan_sin_cupo = find_active_plan_for_specialization(user_id, activity.specialization, db, require_capacity=False)
            if plan_sin_cupo:
                plan_specialization = plan_sin_cupo.specialization
                classes_used = count_subscription_classes_used(plan_sin_cupo.id, db)
                classes_remaining = 0

    return {
        "can_use_subscription": can_use_subscription,
        "has_age_discount": has_age_discount,
        "plan_specialization": plan_specialization,
        "activity_specialization": activity.specialization,
        "classes_used": classes_used,
        "classes_max": MAX_SUBSCRIPTION_FIXED_CLASSES,
        "classes_remaining": classes_remaining,
    }
