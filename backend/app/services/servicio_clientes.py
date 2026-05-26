# Responsable: Nahuel - Servicio de gestion de clientes
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.reservation import Reservation
from app.models.reintegration import ReintegrationRequest
from app.utils.subscriptions import is_abonado
from fastapi import HTTPException
from datetime import datetime, timedelta


def obtener_todos_los_clientes(db: Session, search: str = None, status: str = None):
    query = db.query(User).filter(User.role == "client")
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
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
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

    return {"status": "success", "mensaje": "Solicitud de reintegro registrada con éxito."}


def registrar_reintegro(cliente_id: int, motivo: str, db: Session):
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
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

    return {
        "status": "success",
        "mensaje": f"Solicitud de reintegro registrada para {cliente.name}. Motivo: {motivo}. Pendiente de revision por el administrador.",
    }


def suspender_cliente(cliente_id: int, motivo: str, db: Session):
    """HU: Suspender cuenta. Motivo obligatorio."""
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.account_status == "suspended":
        raise HTTPException(status_code=400, detail="El cliente ya esta suspendido")

    cliente.account_status = "suspended"
    db.commit()
    db.refresh(cliente)

    # TODO: notificar al cliente via mail que su cuenta fue suspendida (Escenario 1 HU Suspender)
    # TODO: registrar accion en historial del sistema (Escenario 1 HU Suspender)

    return {
        "status": "success",
        "mensaje": f"Cliente {cliente.name} suspendido. Motivo: {motivo}",
    }


def reincorporar_cliente(cliente_id: int, motivo: Optional[str], db: Session):
    """HU: Reintegrar cuenta. Motivo opcional."""
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.account_status not in ("suspended", "pending_reintegration"):
        raise HTTPException(status_code=400, detail="El cliente no esta suspendido")

    cliente.account_status = "active"
    db.commit()
    db.refresh(cliente)

    detalle = f" Motivo: {motivo}" if motivo else ""

    # TODO: notificar al cliente via mail que su cuenta fue reintegrada (Escenarios 1 y 2 HU Reintegrar)

    return {
        "status": "success",
        "mensaje": f"Cliente {cliente.name} reincorporado.{detalle}",
    }


def rechazar_reintegro(cliente_id: int, db: Session):
    """HU: Reintegrar cuenta - Escenario 3. El admin rechaza la solicitud de reintegro.
    La cuenta vuelve a estado 'suspended' y se notifica al cliente.
    """
    cliente = db.query(User).filter(User.id == cliente_id, User.role == "client").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.account_status != "pending_reintegration":
        raise HTTPException(
            status_code=400,
            detail="El cliente no tiene una solicitud de reintegro pendiente"
        )

    # Mantiene la cuenta suspendida
    cliente.account_status = "suspended"
    db.commit()
    db.refresh(cliente)

    # TODO: notificar al cliente via mail que su solicitud fue rechazada (Escenario 3 HU Reintegrar)

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
            User.id == reserva.user_id, User.role == "client"
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
