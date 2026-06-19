from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from fastapi import HTTPException
from datetime import datetime
from threading import Thread
import re

from app.models.activity import Activity
from app.models.room import Room
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.esquema_reservas import ClientConditionResponse
from app.utils.subscriptions import is_abonado
from app.utils.notifications import notify_activity_cancellation, notify_professor_resignation, notify_activity_modified
from database.connection import SessionLocal

DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


def _extraer_dias(schedule: Optional[str]) -> set[str]:
    if not schedule:
        return set()
    schedule_lower = schedule.lower()
    return {dia for dia in DIAS_SEMANA if dia.lower() in schedule_lower}
def _solapa_en_profesor(propuesta: Activity, existente: Activity) -> bool:
    """True si el mismo profesor tiene solapamiento horario en cualquier sala."""
    if not propuesta.professor or not existente.professor:
        return False
    if propuesta.professor.strip().lower() != existente.professor.strip().lower():
        return False

    dias_propuesta = _dias_actividad(propuesta)
    dias_existente = _dias_actividad(existente)
    if not dias_propuesta or not dias_existente or dias_propuesta.isdisjoint(dias_existente):
        return False

    inicio_propuesta, fin_propuesta = _rango_horario(propuesta)
    inicio_existente, fin_existente = _rango_horario(existente)
    if None in (inicio_propuesta, fin_propuesta, inicio_existente, fin_existente):
        return False

    return inicio_propuesta < fin_existente and inicio_existente < fin_propuesta


def _validar_disponibilidad_profesor(
    actividad_propuesta: Activity,
    db: Session,
    excluir_activity_id: Optional[int] = None,
) -> None:
    if not actividad_propuesta.professor or actividad_propuesta.status != "active":
        return

    actividades_existentes = (
        db.query(Activity)
        .filter(
            Activity.professor == actividad_propuesta.professor,
            Activity.status == "active",
        )
        .all()
    )

    for existente in actividades_existentes:
        if excluir_activity_id is not None and existente.id == excluir_activity_id:
            continue
        if _solapa_en_profesor(actividad_propuesta, existente):
            raise HTTPException(
                status_code=409,
                detail=f"El profesor {actividad_propuesta.professor} ya tiene una actividad asignada en ese horario.",
            )

def _dia_desde_fecha(specific_date) -> Optional[str]:
    if not specific_date:
        return None
    return DIAS_SEMANA[specific_date.weekday()]


def _parse_hora(texto: Optional[str]) -> Optional[int]:
    if not texto:
        return None
    match = re.search(r"(\d{1,2}):(\d{2})", texto)
    if not match:
        return None
    return int(match.group(1)) * 60 + int(match.group(2))


def _rango_horario(activity: Activity) -> tuple[Optional[int], Optional[int]]:
    if activity.activity_type == "individual":
        inicio = _parse_hora(activity.time_slot)
        if inicio is None:
            return None, None
        return inicio, inicio + 60

    coincidencias = re.findall(r"(\d{1,2}):(\d{2})", activity.schedule or "")
    if len(coincidencias) >= 2:
        inicio_h, inicio_m = coincidencias[0]
        fin_h, fin_m = coincidencias[1]
        return int(inicio_h) * 60 + int(inicio_m), int(fin_h) * 60 + int(fin_m)

    inicio = _parse_hora(activity.time_slot or activity.schedule)
    if inicio is None:
        return None, None
    return inicio, inicio + 60


def _dias_actividad(activity: Activity) -> set[str]:
    if activity.activity_type == "individual":
        dia = _dia_desde_fecha(activity.specific_date)
        return {dia} if dia else set()
    return _extraer_dias(activity.schedule)


def _ya_paso(actividad: Activity, ahora: datetime) -> bool:
    """True si la actividad ya comenzó o finalizó según su specific_date + horario."""
    if not actividad.specific_date:
        return False  # recurrente sin fecha puntual (legacy) -> siempre vigente

    inicio, _ = _rango_horario(actividad)
    if inicio is None:
        return actividad.specific_date < ahora.date()

    inicio_dt = datetime(
        actividad.specific_date.year, actividad.specific_date.month, actividad.specific_date.day,
        inicio // 60, inicio % 60,
    )
    return inicio_dt <= ahora


def _solapa_en_sala(propuesta: Activity, existente: Activity) -> bool:
    if propuesta.room_id != existente.room_id:
        return False

    # Actividades con fecha específica: solo conflicto si son la MISMA fecha
    if propuesta.specific_date and existente.specific_date:
        if propuesta.specific_date != existente.specific_date:
            return False  # fechas distintas, no hay solapamiento posible
        inicio_propuesta, fin_propuesta = _rango_horario(propuesta)
        inicio_existente, fin_existente = _rango_horario(existente)
        if None in (inicio_propuesta, fin_propuesta, inicio_existente, fin_existente):
            return False
        return inicio_propuesta < fin_existente and inicio_existente < fin_propuesta

    # Al menos una es legacy (schedule): comparar por día de semana
    dias_propuesta = _dias_actividad(propuesta)
    dias_existente = _dias_actividad(existente)
    if not dias_propuesta or not dias_existente or dias_propuesta.isdisjoint(dias_existente):
        return False

    inicio_propuesta, fin_propuesta = _rango_horario(propuesta)
    inicio_existente, fin_existente = _rango_horario(existente)
    if None in (inicio_propuesta, fin_propuesta, inicio_existente, fin_existente):
        return False

    return inicio_propuesta < fin_existente and inicio_existente < fin_propuesta


def _validar_disponibilidad_sala(
    actividad_propuesta: Activity,
    db: Session,
    excluir_activity_id: Optional[int] = None,
) -> None:
    if actividad_propuesta.status != "active":
        return

    actividades_existentes = (
        db.query(Activity)
        .filter(
            Activity.room_id == actividad_propuesta.room_id,
            Activity.status == "active",
        )
        .all()
    )

    for existente in actividades_existentes:
        if excluir_activity_id is not None and existente.id == excluir_activity_id:
            continue
        if _solapa_en_sala(actividad_propuesta, existente):
            raise HTTPException(
                status_code=409,
                detail="La sala no está disponible para la fecha y hora seleccionadas porque ya existe una actividad programada.",
            )


def _solapa_en_profesor(propuesta: Activity, existente: Activity) -> bool:
    """True si el mismo profesor tiene solapamiento horario en cualquier sala."""
    if not propuesta.professor or not existente.professor:
        return False
    if propuesta.professor.strip().lower() != existente.professor.strip().lower():
        return False

    # Actividades con fecha específica: solo conflicto si son la MISMA fecha
    if propuesta.specific_date and existente.specific_date:
        if propuesta.specific_date != existente.specific_date:
            return False
        inicio_propuesta, fin_propuesta = _rango_horario(propuesta)
        inicio_existente, fin_existente = _rango_horario(existente)
        if None in (inicio_propuesta, fin_propuesta, inicio_existente, fin_existente):
            return False
        return inicio_propuesta < fin_existente and inicio_existente < fin_propuesta

    dias_propuesta = _dias_actividad(propuesta)
    dias_existente = _dias_actividad(existente)
    if not dias_propuesta or not dias_existente or dias_propuesta.isdisjoint(dias_existente):
        return False

    inicio_propuesta, fin_propuesta = _rango_horario(propuesta)
    inicio_existente, fin_existente = _rango_horario(existente)
    if None in (inicio_propuesta, fin_propuesta, inicio_existente, fin_existente):
        return False

    return inicio_propuesta < fin_existente and inicio_existente < fin_propuesta


def _validar_disponibilidad_profesor(
    actividad_propuesta: Activity,
    db: Session,
    excluir_activity_id: Optional[int] = None,
) -> None:
    if not actividad_propuesta.professor or actividad_propuesta.status != "active":
        return

    actividades_existentes = (
        db.query(Activity)
        .filter(
            Activity.professor == actividad_propuesta.professor,
            Activity.status == "active",
        )
        .all()
    )

    for existente in actividades_existentes:
        if excluir_activity_id is not None and existente.id == excluir_activity_id:
            continue
        if _solapa_en_profesor(actividad_propuesta, existente):
            raise HTTPException(
                status_code=409,
                detail=f"El profesor {actividad_propuesta.professor} ya tiene una actividad asignada en ese horario.",
            )


def listar_actividades(
    room_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    status: Optional[str] = "active",
    db: Session = None,
) -> List[Activity]:
    """Lista actividades con filtros opcionales por sala, tipo y estado.
    Cuando se filtra por status="active", excluye las que ya comenzaron o finalizaron.
    """
    query = db.query(Activity)
    if room_id is not None:
        query = query.filter(Activity.room_id == room_id)
    if activity_type is not None:
        query = query.filter(Activity.activity_type == activity_type)
    if status is not None:
        query = query.filter(Activity.status == status)

    actividades = query.order_by(Activity.id).all()

    if status == "active":
        ahora = datetime.now()
        actividades = [a for a in actividades if not _ya_paso(a, ahora)]

    return actividades


def obtener_actividad(activity_id: int, db: Session) -> Activity:
    """Obtiene una actividad por ID."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return actividad


def obtener_disponibilidad_actividad(activity_id: int, db: Session, date: str = None) -> dict:
    """Devuelve capacidad total, reservas activas y cupos disponibles de una actividad.
    Para actividades fijas, filtra por la fecha específica del turno (ISO 8601 YYYY-MM-DD o datetime).
    Para actividades individuales devuelve el total general."""
    actividad = obtener_actividad(activity_id, db)

    query = db.query(func.count(Reservation.id)).filter(
        Reservation.activity_id == activity_id,
        Reservation.status != "cancelled",
    )

    if actividad.activity_type == "fixed" and date:
        try:
            from datetime import datetime as dt
            # Acepta YYYY-MM-DD o ISO completo; filtra por día calendario
            fecha = dt.fromisoformat(date.replace("Z", "+00:00")) if "T" in date else dt.strptime(date, "%Y-%m-%d")
            inicio_dia = fecha.replace(hour=0, minute=0, second=0, microsecond=0)
            fin_dia = fecha.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(
                Reservation.reservation_date >= inicio_dia,
                Reservation.reservation_date <= fin_dia,
            )
        except (ValueError, AttributeError):
            pass  # fecha invalida -> conteo general

    reserved_count = query.scalar() or 0

    available_spots = max(int(actividad.capacity) - int(reserved_count), 0)
    return {
        "activity_id": actividad.id,
        "capacity": int(actividad.capacity),
        "reserved_count": int(reserved_count),
        "available_spots": int(available_spots),
    }


def crear_actividad(datos, db: Session) -> list:
    """Crea una o varias actividades (batch para fijas con repeticiones o lista de fechas).
    Devuelve siempre una lista de Activity."""
    from datetime import timedelta
    sala = db.query(Room).filter(Room.id == datos.room_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    if datos.capacity > sala.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Los cupos ({datos.capacity}) no pueden superar la capacidad de la sala ({sala.capacity})",
        )

    # Determinar lista de fechas a crear
    if datos.activity_type == "fixed":
        if datos.dates:
            # Nuevo modelo: lista explícita de fechas (mes + día de semana desde frontend)
            fechas_a_crear = datos.dates
        elif datos.specific_date:
            # Modelo legacy: fecha de inicio + repeticiones semanales
            repetitions = max(1, datos.repetitions or 1)
            fechas_a_crear = [datos.specific_date + timedelta(weeks=i) for i in range(repetitions)]
        else:
            raise HTTPException(status_code=400, detail="Las actividades fijas requieren fechas (dates) o una fecha de inicio (specific_date).")
    else:
        fechas_a_crear = [datos.specific_date] if datos.specific_date else [None]

    base_data = datos.model_dump(exclude={"repetitions", "dates"})
    creadas = []

    for fecha in fechas_a_crear:
        data_i = dict(base_data)
        if datos.activity_type == "fixed" and fecha:
            data_i["specific_date"] = fecha
            dia_nombre = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][
                fecha.weekday()
            ]
            hora_fin = f"{int(datos.time_slot.split(':')[0]) + 1:02d}:00" if datos.time_slot else ""
            data_i["schedule"] = f"{dia_nombre} · {datos.time_slot}–{hora_fin}" if hora_fin else dia_nombre

        act = Activity(**data_i)
        act.status = "active"
        _validar_disponibilidad_sala(act, db)
        _validar_disponibilidad_profesor(act, db)
        db.add(act)
        db.flush()
        creadas.append(act)

    db.commit()
    for act in creadas:
        db.refresh(act)
    return creadas


def editar_actividad(activity_id: int, datos, db: Session) -> Activity:
    """Actualiza campos de una actividad validando capacidad y disponibilidad."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    cambios = datos.model_dump(exclude_unset=True)
    profesor_anterior = actividad.professor

    valores_propuestos = {
        **{
            "room_id": actividad.room_id,
            "activity_type": actividad.activity_type,
            "schedule": actividad.schedule,
            "specific_date": actividad.specific_date,
            "time_slot": actividad.time_slot,
            "status": actividad.status,
        },
        **cambios,
    }

    actividad_propuesta = Activity(
        id=actividad.id,
        room_id=valores_propuestos["room_id"],
        activity_type=valores_propuestos["activity_type"],
        schedule=valores_propuestos["schedule"],
        specific_date=valores_propuestos["specific_date"],
        time_slot=valores_propuestos["time_slot"],
        status=valores_propuestos["status"],
    )

    if "capacity" in cambios:
        sala = db.query(Room).filter(Room.id == valores_propuestos["room_id"]).first()
        if cambios["capacity"] > sala.capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Los cupos ({cambios['capacity']}) no pueden superar la capacidad de la sala ({sala.capacity})",
            )

    _validar_disponibilidad_sala(actividad_propuesta, db, excluir_activity_id=actividad.id)
    _validar_disponibilidad_profesor(actividad_propuesta, db, excluir_activity_id=actividad.id)
    for campo, valor in cambios.items():
        setattr(actividad, campo, valor)

    # Si cambia la fecha o el horario, sincronizar reservation_date en reservas activas
    if "specific_date" in cambios or "time_slot" in cambios:
        nueva_fecha = valores_propuestos["specific_date"]
        nuevo_slot = valores_propuestos["time_slot"]
        if nueva_fecha and nuevo_slot:
            try:
                hh, mm = nuevo_slot.split(":")
                nueva_reservation_date = datetime(
                    nueva_fecha.year, nueva_fecha.month, nueva_fecha.day,
                    int(hh), int(mm),
                )
                reservas_activas = db.query(Reservation).filter(
                    Reservation.activity_id == activity_id,
                    Reservation.status.in_(["confirmed", "pending"]),
                ).all()
                for r in reservas_activas:
                    r.reservation_date = nueva_reservation_date
            except (ValueError, AttributeError):
                pass  # Si el formato es inválido no bloqueamos la edición

    db.commit()
    db.refresh(actividad)

    campos_relevantes = {"name", "specific_date", "time_slot", "room_id", "professor", "price"}
    if cambios.keys() & campos_relevantes:
        def _notif_edicion_async(aid: int, cam: dict, prof_ant: Optional[str]) -> None:
            db_n = SessionLocal()
            try:
                notify_activity_modified(aid, cam, prof_ant, db_n)
            except Exception:
                pass
            finally:
                db_n.close()

        Thread(target=_notif_edicion_async, args=(actividad.id, dict(cambios), profesor_anterior), daemon=True).start()

    return actividad


def cancelar_actividad(activity_id: int, db: Session) -> None:
    """Marca una actividad como cancelada (no la elimina físicamente)."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    ahora = datetime.now()

    if actividad.activity_type == "individual":
        if actividad.specific_date and actividad.time_slot:
            try:
                hh, mm = actividad.time_slot.split(":")
                inicio_dt = datetime(
                    actividad.specific_date.year,
                    actividad.specific_date.month,
                    actividad.specific_date.day,
                    int(hh), int(mm),
                )
                if inicio_dt <= ahora:
                    raise HTTPException(
                        status_code=400,
                        detail="No se puede cancelar: la actividad ya comenzó.",
                    )
            except HTTPException:
                raise
            except Exception:
                pass
    else:
        dias = _dias_actividad(actividad)
        if dias:
            dia_hoy = DIAS_SEMANA[ahora.weekday()]
            if dia_hoy in dias:
                inicio, fin = _rango_horario(actividad)
                if inicio is not None:
                    ahora_min = ahora.hour * 60 + ahora.minute
                    if inicio <= ahora_min < fin:
                        raise HTTPException(
                            status_code=400,
                            detail="No se puede cancelar: la actividad ya comenzó.",
                        )

    actividad.status = "cancelled"
    db.commit()

    # Enviar notificaciones de cancelación en segundo plano para no frenar la UI
    def _notificar_cancelacion_async(activity_id: int) -> None:
        db_notif = SessionLocal()
        try:
            notify_activity_cancellation(activity_id, db_notif)
        except Exception:
            # No interrumpir la operación por fallos en notificaciones
            pass
        finally:
            db_notif.close()

    Thread(target=_notificar_cancelacion_async, args=(actividad.id,), daemon=True).start()


def renunciar_actividad(activity_id: int, current_user, db: Session) -> Activity:
    """El profesor autenticado se da de baja de la actividad, dejando libre el cupo de profesor."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    if actividad.status != "active":
        raise HTTPException(status_code=400, detail="La actividad no está activa.")

    nombre_completo = f"{current_user.name} {current_user.lastname}"
    if not actividad.professor or actividad.professor.strip().lower() != nombre_completo.strip().lower():
        raise HTTPException(
            status_code=403,
            detail="No estás asignado como profesor de esta actividad.",
        )

    ahora = datetime.now()
    if actividad.activity_type == "individual":
        if actividad.specific_date and actividad.time_slot:
            try:
                hh, mm = actividad.time_slot.split(":")
                inicio_dt = datetime(
                    actividad.specific_date.year,
                    actividad.specific_date.month,
                    actividad.specific_date.day,
                    int(hh), int(mm),
                )
                if inicio_dt <= ahora:
                    raise HTTPException(
                        status_code=400,
                        detail="No se puede renunciar: la actividad ya comenzó.",
                    )
            except HTTPException:
                raise
            except Exception:
                pass
    else:
        dias = _dias_actividad(actividad)
        if dias:
            dia_hoy = DIAS_SEMANA[ahora.weekday()]
            if dia_hoy in dias:
                inicio, fin = _rango_horario(actividad)
                if inicio is not None:
                    ahora_min = ahora.hour * 60 + ahora.minute
                    if inicio <= ahora_min < fin:
                        raise HTTPException(
                            status_code=400,
                            detail="No se puede renunciar: la actividad está en curso.",
                        )

    actividad.professor = None
    db.commit()
    db.refresh(actividad)

    def _notificar_renuncia_async(activity_id: int, prof_name: str) -> None:
        db_notif = SessionLocal()
        try:
            notify_professor_resignation(activity_id, prof_name, db_notif)
        except Exception:
            pass
        finally:
            db_notif.close()

    Thread(target=_notificar_renuncia_async, args=(actividad.id, nombre_completo), daemon=True).start()

    return actividad


def asumir_actividad(activity_id: int, current_user, db: Session) -> Activity:
    """Asigna al profesor autenticado a una actividad disponible."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    if actividad.status != "active":
        raise HTTPException(status_code=400, detail="La actividad no está activa.")

    if actividad.professor:
        raise HTTPException(status_code=409, detail="La actividad ya tiene profesor asignado.")

    if not current_user.specialization:
        raise HTTPException(status_code=400, detail="Tu perfil no tiene especialidad asignada.")

    if current_user.specialization.strip().lower() != (actividad.specialization or "").strip().lower():
        raise HTTPException(
            status_code=409,
            detail="No podés asumir esta actividad porque tu especialidad no coincide.",
        )

    nombre_completo = f"{current_user.name} {current_user.lastname}".strip()

    actividad_propuesta = Activity(
        room_id=actividad.room_id,
        activity_type=actividad.activity_type,
        schedule=actividad.schedule,
        specific_date=actividad.specific_date,
        time_slot=actividad.time_slot,
        status="active",
        professor=nombre_completo,
    )
    _validar_disponibilidad_profesor(actividad_propuesta, db)

    actividad.professor = nombre_completo
    db.commit()
    db.refresh(actividad)
    return actividad


def listar_clientes_actividad(activity_id: int, db: Session) -> List[ClientConditionResponse]:
    """Lista los clientes inscriptos en una actividad con su condición de acceso."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    registros = (
        db.query(Reservation, User)
        .join(User, Reservation.user_id == User.id)
        .filter(
            Reservation.activity_id == activity_id,
            Reservation.status.in_(["pending", "confirmed"]),
        )
        .all()
    )

    resultado = []
    for res, user in registros:
        resultado.append(
            ClientConditionResponse(
                user_id=user.id,
                name=user.name,
                lastname=user.lastname,
                email=user.email,
                reservation_type=res.reservation_type,
                payment_status=res.payment_status,
                es_abonado=is_abonado(user.id, db),
            )
        )
    return resultado
