# Responsable: Nahuel - Servicio de gestion de clientes
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.reservation import Reservation
from fastapi import HTTPException


def obtener_todos_los_clientes(db: Session):
    clientes = db.query(User).filter(User.role == "client").all()
    resultado = []
    for c in clientes:
        # NOTA: un cliente es "abonado" cuando tiene una suscripcion mensual activa.
        # La suscripcion mensual incluye 4-5 clases por semana (actividades fijas).
        # TODO (Ezequiel): cuando se implemente el modelo Subscription, reemplazar
        # esta query por: db.query(Subscription).filter(Subscription.user_id == c.id,
        #   Subscription.status == "active").first() is not None
        # Por ahora se aproxima consultando si tiene reservas fijas activas.
        es_abonado = db.query(Reservation).filter(
            Reservation.user_id == c.id,
            Reservation.reservation_type == "fixed",
            Reservation.status != "cancelled",
        ).first() is not None
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
            "es_abonado": es_abonado,
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


def registrar_reintegro(cliente_id: int, motivo: str, db: Session):
    """HU: Solicitar reintegro de cuenta. Motivo obligatorio. Solo valido si la cuenta esta suspendida."""
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
