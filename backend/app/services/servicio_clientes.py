# Responsable: Nahuel - Servicio de gestion de clientes
from typing import Optional
from threading import Thread
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.reservation import Reservation
from app.models.reintegration import ReintegrationRequest
from app.utils.subscriptions import is_abonado
from fastapi import HTTPException
from datetime import datetime, timedelta
from database.connection import SessionLocal
from app.models.audit_log import AuditType, AuditAction, AuditResult
from app.services.servicio_auditoria import register_audit



def obtener_todos_los_clientes(db: Session, search: str = None, status: str = None):
    query = db.query(User).filter(User.role == "client", User.is_deleted == False)
    if status:
        query = query.filter(User.account_status == status)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(term)) |
            (User.lastname.ilike(term)) |
            (User.email.ilike(term)) |
            (User.dni.ilike(term))
        )
    clientes = query.all()
    resultado = []
    for c in clientes:
        # Un cliente es "abonado" cuando tiene un UserPlan activo y vigente.
        es_abonado_val = is_abonado(c.id, db)
        resultado.append({
            "id": c.id,
            "name": c.name,
            "lastname": c.lastname,
            "email": c.email,
            "dni": c.dni,
            "role": c.role,
            "specialization": c.specialization,
            "account_status": c.account_status,
            "dni_verified": c.dni_verified,
            "medical_certificate_status": c.medical_certificate_status,
            "created_at": c.created_at,
            "es_abonado": es_abonado_val,
        })
    return resultado


def obtener_condiciones_cliente(cliente_id: int, db: Session):
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client", User.is_deleted == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    puede_ingresar = (
        cliente.account_status == "active"
        and cliente.medical_certificate_status == "approved"
    )

    return {
        "cliente_id": cliente.id,
        "nombre": f"{cliente.name} {cliente.lastname}",
        "estado_cuenta": cliente.account_status,
        "estado_apto_fisico": cliente.medical_certificate_status,
        "puede_ingresar": puede_ingresar,
    }


# HU Reintegrar cuenta - el admin necesita ver el motivo que escribió el cliente al solicitar
def obtener_solicitud_reintegro(cliente_id: int, db: Session):
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client", User.is_deleted == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    solicitud = db.query(ReintegrationRequest).filter(
        ReintegrationRequest.user_id == cliente_id
    ).order_by(ReintegrationRequest.created_at.desc()).first()

    if not solicitud:
        return None

    return {
        "id": solicitud.id,
        "motivo": solicitud.motivo,
        "created_at": solicitud.created_at,
    }


# HU Solicitar reintegro - flujo JWT: verifica estado y restricción de 24hs (Nahuel)
def verificar_estado_y_tiempo_reintegro(cliente: User, db: Session):
    if cliente.role != "client":
        return {"status": "not_a_client", "can_request": False, "horas_transcurridas": 0, "tiempo_restante": "0 minutos"}

    if cliente.account_status != "suspended":
        return {"status": cliente.account_status, "can_request": False, "horas_transcurridas": 0, "tiempo_restante": "0 minutos"}

    ahora = datetime.utcnow()
    ultima_solicitud = db.query(ReintegrationRequest).filter(
        ReintegrationRequest.user_id == cliente.id
    ).order_by(ReintegrationRequest.created_at.desc()).first()

    if ultima_solicitud:
        fecha_solicitud = ultima_solicitud.created_at
        if ahora.tzinfo is not None:
            ahora = ahora.replace(tzinfo=None)
        if fecha_solicitud.tzinfo is not None:
            fecha_solicitud = fecha_solicitud.replace(tzinfo=None)

        segundos_transcurridos = max(0, (ahora - fecha_solicitud).total_seconds())

        if segundos_transcurridos >= 3600:
            hace_cuanto_legible = str(int(segundos_transcurridos // 3600))
        else:
            hace_cuanto_legible = f"{max(1, int(segundos_transcurridos // 60))} minutos"

        if segundos_transcurridos < 86400:
            segundos_restantes = 86400 - segundos_transcurridos
            horas_faltantes = int(segundos_restantes // 3600)
            minutos_faltantes = int((segundos_restantes % 3600) // 60)
            tiempo_restante = f"{horas_faltantes} horas y {minutos_faltantes} minutos" if horas_faltantes > 0 else f"{minutos_faltantes} minutos"
            return {"status": "suspended", "can_request": False, "horas_transcurridas": hace_cuanto_legible, "tiempo_restante": tiempo_restante}

    return {"status": "suspended", "can_request": True, "horas_transcurridas": "0", "tiempo_restante": "0 minutos"}


# HU Solicitar reintegro - flujo JWT: registra solicitud usando objeto User autenticado (Nahuel)
def registrar_reintegro_jwt(cliente: User, motivo: str, db: Session):
    validacion = verificar_estado_y_tiempo_reintegro(cliente, db)

    if cliente.account_status != "suspended":
        raise HTTPException(status_code=400, detail="La cuenta no está suspendida o ya tiene una solicitud en curso.")

    if not validacion["can_request"]:
        raise HTTPException(status_code=400, detail=f"Debe esperar {validacion['tiempo_restante']} para volver a solicitar un reintegro.")

    try:
        nueva_solicitud = ReintegrationRequest(user_id=cliente.id, motivo=motivo)
        db.add(nueva_solicitud)
        # E1: cambia estado a pending_reintegration para que el admin lo vea como solicitud pendiente
        cliente.account_status = "pending_reintegration"
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al guardar la solicitud en la base de datos.")

    cliente_id_copia = cliente.id

    def _notif_async(cid: int) -> None:
        from app.utils.notifications import notify_reintegration_requested
        db_n = SessionLocal()
        try:
            notify_reintegration_requested(cid, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(cliente_id_copia,), daemon=True).start()

    return {"status": "success", "mensaje": "Solicitud de reintegro registrada con éxito."}


def registrar_reintegro(cliente_id: int, motivo: str, db: Session):
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client", User.is_deleted == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Escenario 3: cuenta no suspendida -> error
    if cliente.account_status != "suspended":
        raise HTTPException(
            status_code=400,
            detail="La cuenta no esta suspendida"
        )

    # Registra la solicitud cambiando el estado para que el admin la vea pendiente
    cliente.account_status = "pending_reintegration"
    db.commit()
    db.refresh(cliente)

    cliente_id_copia = cliente.id

    def _notif_async(cid: int) -> None:
        from app.utils.notifications import notify_reintegration_requested
        db_n = SessionLocal()
        try:
            notify_reintegration_requested(cid, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(cliente_id_copia,), daemon=True).start()

    return {
        "status": "success",
        "mensaje": f"Solicitud de reintegro registrada para {cliente.name}. Motivo: {motivo}. Pendiente de revision por el administrador.",
    }


def _ejecutar_suspension(cliente: User, motivo: str, db: Session, audit_user_id: int, audit_detail: str):
    """Núcleo de la suspensión de cuenta, compartido por la suspensión manual (admin)
    y la automática (sistema, por inasistencias).

    Marca la cuenta como suspendida, libera al cliente de sus actividades (cancela
    reservas activas y posiciones en lista de espera), registra la auditoría, promueve
    la lista de espera de los cupos liberados y notifica al cliente el motivo.
    El llamador ya validó que el cliente existe y que no estaba suspendido.
    """
    from app.models.waitlist import Waitlist
    from app.services.servicio_lista_espera import promote_next_waitlist_entry

    cliente.account_status = "suspended"
    # Se guarda para poder mostrarle el motivo al cliente en pantalla, no solo en el mail
    cliente.suspension_reason = motivo

    # Al suspender se libera al cliente de sus actividades: se cancelan sus reservas
    # activas y sus posiciones en lista de espera para no seguir ocupando cupos que no
    # puede usar mientras está suspendido. Los cupos liberados se ofrecen a la lista de
    # espera (misma lógica que la baja de cuenta en delete_user).
    reservas_activas = db.query(Reservation).filter(
        Reservation.user_id == cliente.id,
        Reservation.status.in_(["pending", "confirmed"]),
    ).all()
    activity_ids_liberados = [r.activity_id for r in reservas_activas]
    for reserva in reservas_activas:
        reserva.status = "cancelled"

    entradas_espera = db.query(Waitlist).filter(
        Waitlist.user_id == cliente.id,
        Waitlist.status == "waiting",
    ).all()
    for entrada in entradas_espera:
        entrada.status = "cancelled"
        restantes = db.query(Waitlist).filter(
            Waitlist.activity_id == entrada.activity_id,
            Waitlist.waitlist_type == entrada.waitlist_type,
            Waitlist.position > entrada.position,
            Waitlist.status == "waiting",
        ).order_by(Waitlist.position).all()
        for idx, r in enumerate(restantes):
            r.position = entrada.position + idx

    register_audit(
        db=db,
        user_id=audit_user_id,
        type=AuditType.ACCOUNT,
        action=AuditAction.SUSPEND_ACCOUNT,
        result=AuditResult.SUCCESS,
        detail=audit_detail,
    )
    db.commit()
    db.refresh(cliente)

    for activity_id in activity_ids_liberados:
        nueva_reserva = promote_next_waitlist_entry(activity_id, db)
        if nueva_reserva:
            uid_promovido = nueva_reserva.user_id
            aid_promovido = nueva_reserva.activity_id

            def _notif_promo_async(uid: int, aid: int) -> None:
                from app.utils.notifications import notify_waitlist_promoted
                db_n = SessionLocal()
                try:
                    notify_waitlist_promoted(uid, aid, db_n)
                except Exception:
                    pass
                finally:
                    db_n.close()

            Thread(target=_notif_promo_async, args=(uid_promovido, aid_promovido), daemon=True).start()

    cliente_id_copia = cliente.id

    def _notif_async(cid: int, mot: str) -> None:
        from app.utils.notifications import notify_account_suspended
        db_n = SessionLocal()
        try:
            notify_account_suspended(cid, mot, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(cliente_id_copia, motivo), daemon=True).start()


def suspender_cliente(cliente_id: int, motivo: str, db: Session, current_user: User):
    """HU: Suspender cuenta. Motivo obligatorio."""
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client", User.is_deleted == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.account_status == "suspended":
        raise HTTPException(status_code=400, detail="El cliente ya esta suspendido")

    # 🚨 ESTA LLAMADA YA HACE EL CAMBIO DE ESTADO Y REGISTRA LA SUSPENSIÓN
    _ejecutar_suspension(
        cliente,
        motivo,
        db,
        audit_user_id=current_user.id,
        audit_detail=f"Admin {current_user.name} {current_user.lastname} suspendió la cuenta del cliente {cliente.name} {cliente.lastname} (id {cliente.id}). Motivo: {motivo}",
    )

    return {
        "status": "success",
        "mensaje": f"Cliente {cliente.name} suspendido. Motivo: {motivo}",
    }


def suspender_cliente_por_sistema(cliente: User, motivo: str, db: Session):
    """Suspensión automática iniciada por el sistema (por inasistencias / baja asistencia).

    A diferencia de la manual, no hay administrador que la ejecute: la auditoría se
    registra a nombre del propio cliente afectado y el detalle aclara que fue el sistema.
    Es idempotente: si el cliente ya está suspendido (o no es un cliente activo) no hace nada.
    Devuelve True si efectivamente suspendió la cuenta.
    """
    if cliente is None or cliente.role != "client" or cliente.is_deleted:
        return False
    if cliente.account_status != "active":
        return False

    _ejecutar_suspension(
        cliente,
        motivo,
        db,
        audit_user_id=cliente.id,
        audit_detail=f"El sistema suspendió automáticamente la cuenta del cliente {cliente.name} {cliente.lastname} (id {cliente.id}). Motivo: {motivo}",
    )
    return True


def reincorporar_cliente(cliente_id: int, motivo: Optional[str], db: Session, current_user: User):
    """HU: Reintegrar cuenta. Motivo opcional."""
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client", User.is_deleted == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.account_status not in ("suspended", "pending_reintegration"):
        raise HTTPException(status_code=400, detail="El cliente no esta suspendido")

    cliente.account_status = "active"
    cliente.suspension_reason = None
    register_audit(
        db=db,
        user_id=current_user.id,
        type=AuditType.ACCOUNT,
        action=AuditAction.REINTEGRATE_ACCOUNT,
        result=AuditResult.SUCCESS,
        detail=f"Admin {current_user.name} {current_user.lastname} reintegró la cuenta del cliente {cliente.name} {cliente.lastname} (id {cliente.id}). Motivo: {motivo}",
    )
    db.commit()
    db.refresh(cliente)

    detalle = f" Motivo: {motivo}" if motivo else ""
    cliente_id_copia = cliente.id

    def _notif_async(cid: int) -> None:
        from app.utils.notifications import notify_account_reinstated
        db_n = SessionLocal()
        try:
            notify_account_reinstated(cid, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(cliente_id_copia,), daemon=True).start()

    return {
        "status": "success",
        "mensaje": f"Cliente {cliente.name} reincorporado.{detalle}",
    }


def rechazar_reintegro(cliente_id: int, motivo: str, db: Session, current_user: User):
    """HU: Reintegrar cuenta - Escenario 3. El admin rechaza la solicitud de reintegro.
    La cuenta vuelve a estado 'suspended' y se notifica al cliente con el motivo del rechazo.
    """
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client", User.is_deleted == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.account_status != "pending_reintegration":
        raise HTTPException(
            status_code=400,
            detail="El cliente no tiene una solicitud de reintegro pendiente"
        )

    # Mantiene la cuenta suspendida
    cliente.account_status = "suspended"
    register_audit(
        db=db,
        user_id=cliente.id,
        type=AuditType.ACCOUNT,
        action=AuditAction.DENY_REINTEGRATION,
        result=AuditResult.SUCCESS,
        detail=f"Admin {current_user.name} {current_user.lastname} rechazó la solicitud de reintegro del cliente {cliente.name} {cliente.lastname} (id {cliente.id}). Motivo: {motivo}. La cuenta permanece suspendida.",
    )
    db.commit()
    db.refresh(cliente)

    cliente_id_copia = cliente.id

    def _notif_async(cid: int, mot: str) -> None:
        from app.utils.notifications import notify_reintegration_rejected
        db_n = SessionLocal()
        try:
            notify_reintegration_rejected(cid, mot, db_n)
        except Exception:
            pass
        finally:
            db_n.close()

    Thread(target=_notif_async, args=(cliente_id_copia, motivo), daemon=True).start()

    return {
        "status": "success",
        "mensaje": f"Solicitud de reintegro de {cliente.name} rechazada. La cuenta continua suspendida.",
    }


def listar_condiciones_por_actividad(activity_id: int, db: Session):
    """HU: Listar condiciones de cliente para una actividad especifica.
    Escenario 1: retorna lista con condiciones de cada inscripto.
    Escenario 2: retorna lista vacia si no hay inscriptos.
    """
    reservas = db.query(Reservation).filter(
        Reservation.activity_id == activity_id,
        Reservation.status != "cancelled",
    ).all()

    if not reservas:
        return []

    resultado = []
    for reserva in reservas:
        cliente = db.query(User).filter(
            User.id == reserva.user_id, User.role == "client", User.is_deleted == False
        ).first()
        if not cliente:
            continue

        puede_ingresar = (
            cliente.account_status == "active"
            and cliente.medical_certificate_status == "approved"
        )

        # Mapeo de estado de pago a etiqueta legible
        etiqueta_pago = {
            "completed": "pago total",
            "partial": "seña",
            "pending": "pago pendiente",
        }.get(reserva.payment_status, reserva.payment_status)

        condicion = {
            "cliente_id": cliente.id,
            "nombre": f"{cliente.name} {cliente.lastname}",
            "estado_cuenta": cliente.account_status,
            "estado_apto_fisico": cliente.medical_certificate_status,
            "tipo_reserva": reserva.reservation_type,  # "fixed" (abonado) o "individual"
            "estado_pago": etiqueta_pago,
            "puede_ingresar": puede_ingresar,
        }
        resultado.append(condicion)

    return resultado
