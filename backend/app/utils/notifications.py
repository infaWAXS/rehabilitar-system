import logging
import os
import smtplib
import ssl
import re
import unicodedata
from pathlib import Path
from email.message import EmailMessage
from typing import Optional
from sqlalchemy import func
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.models.reservation import Reservation
from datetime import datetime

from app.models.activity import Activity
from app.models.user import User
from app.services.servicio_notificaciones import crear_notificacion

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_BACKEND_ROOT / ".env")


def _smtp_config():
    return {
        "enabled": os.getenv("SMTP_ENABLED", "true").lower() in ("1", "true", "yes"),
        "host": os.getenv("SMTP_HOST"),
        "port": int(os.getenv("SMTP_PORT", "0")) if os.getenv("SMTP_PORT") else None,
        "user": os.getenv("SMTP_USER"),
        "password": os.getenv("SMTP_PASS"),
        "from": os.getenv("SMTP_FROM", os.getenv("SMTP_USER") or "noreply@example.com"),
        "use_tls": os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes"),
        "use_ssl": os.getenv("SMTP_USE_SSL", "false").lower() in ("1", "true", "yes"),
    }


def _normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    v = unicodedata.normalize("NFKD", value)
    v = "".join(ch for ch in v if not unicodedata.combining(ch))
    v = re.sub(r"[^a-zA-Z0-9@._\-\s]", " ", v)
    return re.sub(r"\s+", " ", v).strip().lower()


def _resolve_professor_user(professor_value: str, db: Session) -> Optional[User]:
    """Intenta resolver un profesor a `User` usando nombre completo o email."""
    target = _normalize_text(professor_value)
    if not target:
        return None

    # Caso 1: si viene un email, resolver directo por email
    if "@" in target:
        user = db.query(User).filter(func.lower(User.email) == target).first()
        if user:
            return user

    # Caso 2: match exacto por nombre completo normalizado entre todos los usuarios
    usuarios = db.query(User).all()
    for p in usuarios:
        full_name = _normalize_text(f"{p.name} {p.lastname}")
        if full_name == target:
            return p

    # Caso 3: fallback flexible por inclusión de tokens (evita fallar por segundos nombres)
    tokens = target.split(" ")
    for p in usuarios:
        full_name = _normalize_text(f"{p.name} {p.lastname}")
        if tokens and all(t in full_name for t in tokens):
            return p

    # Caso 4: el texto de actividad puede contener nombre + extras; intentar full_name dentro del target
    for p in usuarios:
        full_name = _normalize_text(f"{p.name} {p.lastname}")
        if full_name and full_name in target:
            return p

    return None


def _resolve_professor_candidates(professor_value: str, activity: Activity, db: Session) -> list[User]:
    """Devuelve candidatos de profesor en orden de prioridad para maximizar la chance de enviar el email."""
    candidatos: list[User] = []
    target = _normalize_text(professor_value)

    # 1) Resolver por nombre/email exacto o aproximado
    resolved = _resolve_professor_user(professor_value, db)
    if resolved:
        candidatos.append(resolved)

    # 2) Si la actividad tiene especialidad, agregar profesores con la misma especialidad
    if activity.specialization:
        especialidad_target = _normalize_text(activity.specialization)
        for user in db.query(User).filter(User.role == "professor").all():
            if user in candidatos:
                continue
            user_spec = _normalize_text(user.specialization)
            if user_spec and (user_spec == especialidad_target or especialidad_target in user_spec or user_spec in especialidad_target):
                candidatos.append(user)

    # 3) Fallback: si el texto del profesor contiene nombre/apellido parcial, sumar otros profesores que coincidan
    tokens = [t for t in target.split(" ") if t]
    if tokens:
        for user in db.query(User).filter(User.role == "professor").all():
            if user in candidatos:
                continue
            full_name = _normalize_text(f"{user.name} {user.lastname}")
            if all(token in full_name for token in tokens):
                candidatos.append(user)

    return candidatos


def _send_email(to_email: str, subject: str, body: str) -> bool:
    cfg = _smtp_config()
    if not cfg["enabled"]:
        logger.info("SMTP deshabilitado; simulando envío a %s: %s", to_email, subject)
        logger.debug("Email body: %s", body)
        return True

    if not cfg["host"] or not cfg["port"]:
        logger.warning("SMTP configurado incorrectamente (HOST/PORT faltantes). Simulando envío.")
        logger.debug("Email to=%s subject=%s body=%s", to_email, subject, body)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = cfg["from"]
    msg["To"] = to_email
    msg.set_content(body)

    try:
        if cfg["use_ssl"]:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=context) as server:
                if cfg["user"] and cfg["password"]:
                    server.login(cfg["user"], cfg["password"])
                server.send_message(msg)
        else:
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                if cfg["use_tls"]:
                    server.starttls()
                if cfg["user"] and cfg["password"]:
                    server.login(cfg["user"], cfg["password"])
                server.send_message(msg)
        logger.info("Email enviado a %s (subject=%s)", to_email, subject)
        return True
    except Exception as e:
        logger.exception("Error enviando email a %s: %s", to_email, e)
        return False

def notify_activity_cancellation(activity_id: int, db: Session) -> None:
    """Consulta reservas y usuarios y envía emails individuales informando la cancelación.

    - Notifica a usuarios con reservas `pending` o `confirmed`.
    - Notifica al profesor si se puede resolver a un `User` por nombre/apellido o registra el aviso.
    """
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        logger.warning("notify_activity_cancellation: actividad %s no encontrada", activity_id)
        return

    # Determinar representación de fecha/hora
    when = None
    try:
        if actividad.activity_type == "individual" and actividad.specific_date and actividad.time_slot:
            when = datetime(
                actividad.specific_date.year,
                actividad.specific_date.month,
                actividad.specific_date.day,
                int(actividad.time_slot.split(":")[0]),
                int(actividad.time_slot.split(":")[1]) if ":" in actividad.time_slot else 0,
            ).strftime("%Y-%m-%d %H:%M")
        elif actividad.schedule and actividad.specific_date:
            fecha_str = actividad.specific_date.strftime("%Y-%m-%d")
            if " · " in actividad.schedule:
                dia_nombre, resto = actividad.schedule.split(" · ", 1)
                when = f"{dia_nombre} {fecha_str} · {resto}"
            else:
                when = f"{actividad.schedule} {fecha_str}"
        else:
            when = actividad.schedule or "(horario no disponible)"
    except Exception:
        when = actividad.schedule or str(actividad.specific_date) or "(horario no disponible)"

    subject_clientes = f"Aviso para alumno: cancelación de {actividad.name or 'Actividad'}"
    subject_profesor = f"Aviso para profesor: cancelación de {actividad.name or 'Actividad'}"

    reservas = (
        db.query(Reservation)
        .filter(
            Reservation.activity_id == activity_id,
            Reservation.status.in_(["confirmed", "pending"]),
        )
        .all()
    )

    # Enviar a cada cliente sin duplicar avisos (email + notificación in-app)
    sent_emails: set[str] = set()
    notified_user_ids: set[int] = set()
    title_clientes = f"Actividad cancelada: {actividad.name or 'Actividad'}"
    for r in reservas:
        try:
            usuario = db.query(User).filter(User.id == r.user_id).first()
            if not usuario:
                continue

            if usuario.id in notified_user_ids:
                logger.info("Usuario %s ya notificado sobre cancelación de actividad %s", usuario.id, activity_id)
                continue

            body = (
                f"Hola {usuario.name} {usuario.lastname},\n\n"
                f"Lamentamos informarte que la actividad '{actividad.name}' programada para {when} ha sido cancelada.\n\n"
                "Si necesitás más información o querés reprogramar, por favor contactá a la administración.\n\n"
                "Saludos cordiales."
            )

            if getattr(usuario, "email", None):
                _send_email(usuario.email, subject_clientes, body)
                sent_emails.add(usuario.email)
            else:
                logger.info("Usuario %s sin email; se omite el envío por correo.", r.user_id)

            crear_notificacion(
                usuario.id,
                title_clientes,
                f"La actividad '{actividad.name}' programada para {when} fue cancelada.",
                db,
            )
            notified_user_ids.add(usuario.id)
        except Exception:
            logger.exception("Error notificando usuario %s sobre cancelación de actividad %s", r.user_id, activity_id)

    # Notificar profesor
    if actividad.professor:
        prof_name = actividad.professor.strip()
        logger.info("Cancelación actividad %s: profesor informado en actividad='%s'", activity_id, prof_name)
        profesor_usuario = None
        try:
            profesor_usuario = _resolve_professor_user(prof_name, db)
        except Exception:
            profesor_usuario = None

        candidatos_profesor = _resolve_professor_candidates(prof_name, actividad, db)
        if profesor_usuario and profesor_usuario not in candidatos_profesor:
            candidatos_profesor.insert(0, profesor_usuario)

        if not candidatos_profesor:
            logger.info("Profesor '%s' no encontrado/sin email; no se pudo enviar notificación automática.", prof_name)
        else:
            # Notificación in-app para el profesor resuelto (o el primer candidato como fallback)
            destinatario_app = profesor_usuario or candidatos_profesor[0]
            if destinatario_app and destinatario_app.id not in notified_user_ids:
                crear_notificacion(
                    destinatario_app.id,
                    f"Actividad cancelada: {actividad.name or 'Actividad'}",
                    f"Te informamos que la actividad '{actividad.name}' programada para {when} fue cancelada.",
                    db,
                )
                notified_user_ids.add(destinatario_app.id)

            enviados_profesor = set()
            for candidato in candidatos_profesor:
                if not candidato or not getattr(candidato, "email", None):
                    continue
                if candidato.email in sent_emails or candidato.email in enviados_profesor:
                    logger.info("Profesor ya notificado por email duplicado: %s", candidato.email)
                    continue

                logger.info(
                    "Profesor resuelto para actividad %s: user_id=%s email=%s",
                    activity_id,
                    candidato.id,
                    candidato.email,
                )
                body = (
                    f"Hola {candidato.name} {candidato.lastname},\n\n"
                    f"Te informamos que la actividad '{actividad.name}' programada para {when} ha sido cancelada.\n\n"
                    "Por favor, revisá tu agenda y coordiná cualquier aviso adicional que corresponda.\n\n"
                    "Saludos cordiales."
                )
                if _send_email(candidato.email, subject_profesor, body):
                    enviados_profesor.add(candidato.email)
                    break


def _when_label(actividad: Activity) -> str:
    """Devuelve una representación legible de la fecha/hora de la actividad."""
    try:
        if actividad.activity_type == "individual" and actividad.specific_date and actividad.time_slot:
            return datetime(
                actividad.specific_date.year,
                actividad.specific_date.month,
                actividad.specific_date.day,
                int(actividad.time_slot.split(":")[0]),
                int(actividad.time_slot.split(":")[1]) if ":" in actividad.time_slot else 0,
            ).strftime("%Y-%m-%d %H:%M")
        elif actividad.schedule and actividad.specific_date:
            fecha_str = actividad.specific_date.strftime("%Y-%m-%d")
            if " · " in actividad.schedule:
                dia_nombre, resto = actividad.schedule.split(" · ", 1)
                return f"{dia_nombre} {fecha_str} · {resto}"
            return f"{actividad.schedule} {fecha_str}"
        return actividad.schedule or "(horario no disponible)"
    except Exception:
        return actividad.schedule or str(actividad.specific_date) or "(horario no disponible)"


def notify_activity_modified(activity_id: int, cambios: dict, profesor_anterior: Optional[str], db: Session) -> None:
    """Notifica a clientes (reservas + lista de espera) y al profesor cuando se modifica una actividad."""
    from app.models.reservation import Reservation
    from app.models.waitlist import Waitlist
    from app.models.room import Room

    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        logger.warning("notify_activity_modified: actividad %s no encontrada", activity_id)
        return

    when = _when_label(actividad)

    # Resumen legible de los cambios
    etiquetas = {
        "name": "Nombre",
        "specific_date": "Fecha",
        "time_slot": "Horario",
        "professor": "Profesor",
        "price": "Precio",
    }
    lineas: list[str] = []
    for campo, valor in cambios.items():
        if campo == "room_id":
            sala = db.query(Room).filter(Room.id == valor).first()
            lineas.append(f"  - Sala: {sala.name if sala else valor}")
        elif campo in etiquetas:
            val_str = f"${valor}" if campo == "price" else (str(valor) if valor is not None else "sin asignar")
            lineas.append(f"  - {etiquetas[campo]}: {val_str}")
    resumen = "\n".join(lineas) if lineas else "  - (cambios generales)"

    # IDs de clientes a notificar (reservas activas + lista de espera)
    ids_reservas = {
        r.user_id for r in db.query(Reservation).filter(
            Reservation.activity_id == activity_id,
            Reservation.status.in_(["confirmed", "pending"]),
        ).all()
    }
    ids_espera = {
        w.user_id for w in db.query(Waitlist).filter(
            Waitlist.activity_id == activity_id,
            Waitlist.status == "waiting",
        ).all()
    }
    ids_clientes = ids_reservas | ids_espera

    title_mod = f"Actividad modificada: {actividad.name or 'Actividad'}"
    subject_mod = f"Aviso: modificación en '{actividad.name or 'Actividad'}'"

    for user_id in ids_clientes:
        try:
            usuario = db.query(User).filter(User.id == user_id).first()
            if not usuario:
                continue
            body_email = (
                f"Hola {usuario.name} {usuario.lastname},\n\n"
                f"Te informamos que la actividad '{actividad.name}' programada para {when} fue modificada.\n\n"
                f"Cambios:\n{resumen}\n\n"
                "Si tenés dudas, comunicate con la administración.\n\n"
                "Saludos cordiales."
            )
            if getattr(usuario, "email", None):
                _send_email(usuario.email, subject_mod, body_email)
            crear_notificacion(user_id, title_mod, f"La actividad '{actividad.name}' fue modificada. Revisá los detalles actualizados.", db)
        except Exception:
            logger.exception("Error notificando usuario %s sobre modificación de actividad %s", user_id, activity_id)

    # Notificación al profesor
    profesor_nuevo = actividad.professor
    profesor_cambio = "professor" in cambios
    ids_prof_notificados: set[int] = set()

    if profesor_cambio:
        # Notificar al profesor anterior que fue removido
        if profesor_anterior and profesor_anterior != profesor_nuevo:
            prof_ant = _resolve_professor_user(profesor_anterior, db)
            if prof_ant and prof_ant.id not in ids_prof_notificados:
                try:
                    body_email = (
                        f"Hola {prof_ant.name} {prof_ant.lastname},\n\n"
                        f"Te informamos que fuiste removido/a de la actividad '{actividad.name}' "
                        f"programada para {when}.\n\n"
                        "Saludos cordiales."
                    )
                    if getattr(prof_ant, "email", None):
                        _send_email(prof_ant.email, f"Cambio en actividad: {actividad.name or 'Actividad'}", body_email)
                    crear_notificacion(
                        prof_ant.id,
                        f"Cambio en actividad: {actividad.name or 'Actividad'}",
                        f"Fuiste removido/a de la actividad '{actividad.name}' programada para {when}.",
                        db,
                    )
                    ids_prof_notificados.add(prof_ant.id)
                except Exception:
                    logger.exception("Error notificando al profesor anterior %s", profesor_anterior)

        # Notificar al nuevo profesor que fue asignado
        if profesor_nuevo:
            prof_nuevo = _resolve_professor_user(profesor_nuevo, db)
            if prof_nuevo and prof_nuevo.id not in ids_prof_notificados:
                try:
                    body_email = (
                        f"Hola {prof_nuevo.name} {prof_nuevo.lastname},\n\n"
                        f"Fuiste asignado/a como profesor/a de la actividad '{actividad.name}' "
                        f"programada para {when}.\n\n"
                        "Saludos cordiales."
                    )
                    if getattr(prof_nuevo, "email", None):
                        _send_email(prof_nuevo.email, f"Asignación a actividad: {actividad.name or 'Actividad'}", body_email)
                    crear_notificacion(
                        prof_nuevo.id,
                        f"Asignación a actividad: {actividad.name or 'Actividad'}",
                        f"Fuiste asignado/a como profesor/a de '{actividad.name}' programada para {when}.",
                        db,
                    )
                    ids_prof_notificados.add(prof_nuevo.id)
                except Exception:
                    logger.exception("Error notificando al nuevo profesor %s", profesor_nuevo)
    else:
        # El profesor no cambió; notificarle sobre los cambios en la actividad
        if profesor_nuevo:
            prof_usuario = _resolve_professor_user(profesor_nuevo, db)
            if prof_usuario:
                try:
                    body_email = (
                        f"Hola {prof_usuario.name} {prof_usuario.lastname},\n\n"
                        f"Te informamos que la actividad '{actividad.name}' programada para {when} fue modificada.\n\n"
                        f"Cambios:\n{resumen}\n\n"
                        "Saludos cordiales."
                    )
                    if getattr(prof_usuario, "email", None):
                        _send_email(prof_usuario.email, subject_mod, body_email)
                    crear_notificacion(
                        prof_usuario.id,
                        title_mod,
                        f"La actividad '{actividad.name}' programada para {when} fue modificada.",
                        db,
                    )
                except Exception:
                    logger.exception("Error notificando al profesor %s sobre modificación", profesor_nuevo)


def notify_medical_clearance_status(cliente_id: int, status: str, db: Session) -> None:
    """Notifica al cliente (email + in-app) que su apto físico fue aprobado o rechazado."""
    cliente = db.query(User).filter(User.id == cliente_id).first()
    if not cliente:
        return

    aprobado = status == "approved"
    title = "Apto físico aprobado" if aprobado else "Apto físico rechazado"
    subject = "Tu apto físico fue aprobado" if aprobado else "Tu apto físico fue rechazado"
    cuerpo = (
        "Tu apto físico fue aprobado. Ya podés ingresar a tus actividades."
        if aprobado else
        "Tu apto físico fue rechazado. Por favor, subí un nuevo certificado válido."
    )
    body_email = (
        f"Hola {cliente.name} {cliente.lastname},\n\n"
        f"{cuerpo}\n\n"
        "Saludos cordiales."
    )
    if getattr(cliente, "email", None):
        _send_email(cliente.email, subject, body_email)
    crear_notificacion(cliente_id, title, cuerpo, db)


def notify_reintegration_requested(cliente_id: int, db: Session) -> None:
    """Notifica a todos los administradores (email + in-app) cuando un cliente suspendido pide reintegro."""
    cliente = db.query(User).filter(User.id == cliente_id).first()
    if not cliente:
        return

    nombre = f"{cliente.name} {cliente.lastname}"
    title = f"Solicitud de reintegro: {nombre}"
    subject = f"Nueva solicitud de reintegro de {nombre}"

    admins = db.query(User).filter(User.role == "admin").all()
    if not admins:
        return

    for admin in admins:
        try:
            body_email = (
                f"Hola {admin.name} {admin.lastname},\n\n"
                f"El cliente {nombre} (DNI: {cliente.dni or 'sin registrar'}) solicitó el reintegro de su cuenta suspendida.\n\n"
                "Podés revisar y resolver la solicitud desde el panel de administración.\n\n"
                "Saludos cordiales."
            )
            if getattr(admin, "email", None):
                _send_email(admin.email, subject, body_email)
            crear_notificacion(admin.id, title, f"{nombre} solicitó el reintegro de su cuenta. Revisá la solicitud en el panel de administración.", db, link="/admin/clientes")
        except Exception:
            logger.exception("Error notificando al admin %s sobre solicitud de reintegro de cliente %s", admin.id, cliente_id)


def notify_account_suspended(cliente_id: int, motivo: str, db: Session) -> None:
    """Notifica al cliente (email + in-app) que su cuenta fue suspendida."""
    cliente = db.query(User).filter(User.id == cliente_id).first()
    if not cliente:
        return
    subject = "Tu cuenta ha sido suspendida"
    body_email = (
        f"Hola {cliente.name} {cliente.lastname},\n\n"
        f"Te informamos que tu cuenta en Rehabilitar ha sido suspendida.\n"
        f"Motivo: {motivo}\n\n"
        "Si creés que esto es un error, podés solicitar un reintegro desde la plataforma.\n\n"
        "Saludos cordiales."
    )
    if getattr(cliente, "email", None):
        _send_email(cliente.email, subject, body_email)
    crear_notificacion(cliente_id, "Cuenta suspendida", f"Tu cuenta fue suspendida. Motivo: {motivo}", db)


def notify_account_reinstated(cliente_id: int, db: Session) -> None:
    """Notifica al cliente (email + in-app) que su cuenta fue reintegrada."""
    cliente = db.query(User).filter(User.id == cliente_id).first()
    if not cliente:
        return
    subject = "Tu cuenta ha sido reintegrada"
    body_email = (
        f"Hola {cliente.name} {cliente.lastname},\n\n"
        "Nos complace informarte que tu cuenta en Rehabilitar ha sido reintegrada "
        "y ya podés acceder a todas las funcionalidades nuevamente.\n\n"
        "¡Te esperamos!\n\n"
        "Saludos cordiales."
    )
    if getattr(cliente, "email", None):
        _send_email(cliente.email, subject, body_email)
    crear_notificacion(cliente_id, "Cuenta reintegrada", "Tu cuenta fue reintegrada. Ya podés acceder a todas las funcionalidades.", db)


def notify_reintegration_rejected(cliente_id: int, db: Session) -> None:
    """Notifica al cliente (email + in-app) que su solicitud de reintegro fue rechazada."""
    cliente = db.query(User).filter(User.id == cliente_id).first()
    if not cliente:
        return
    subject = "Tu solicitud de reintegro fue rechazada"
    body_email = (
        f"Hola {cliente.name} {cliente.lastname},\n\n"
        "Lamentamos informarte que tu solicitud de reintegro fue rechazada por la administración. "
        "Tu cuenta permanece suspendida.\n\n"
        "Si tenés dudas, podés comunicarte con nosotros para obtener más información.\n\n"
        "Saludos cordiales."
    )
    if getattr(cliente, "email", None):
        _send_email(cliente.email, subject, body_email)
    crear_notificacion(cliente_id, "Solicitud de reintegro rechazada", "Tu solicitud de reintegro fue rechazada. Tu cuenta permanece suspendida.", db)


def notify_reservation_created(user_id: int, activity_id: int, db: Session) -> None:
    """Notifica al cliente (email + in-app) que su inscripción a una actividad fue confirmada."""
    from app.models.activity import Activity as _Activity
    usuario = db.query(User).filter(User.id == user_id).first()
    actividad = db.query(_Activity).filter(_Activity.id == activity_id).first()
    if not usuario or not actividad:
        return
    when = _when_label(actividad)
    subject = f"Inscripción confirmada: {actividad.name or 'Actividad'}"
    body_email = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        f"Tu inscripción a '{actividad.name}' programada para {when} fue confirmada con éxito.\n\n"
        "Podés ver tus reservas en la plataforma.\n\n"
        "Saludos cordiales."
    )
    if getattr(usuario, "email", None):
        _send_email(usuario.email, subject, body_email)
    crear_notificacion(
        user_id,
        f"Inscripción confirmada: {actividad.name or 'Actividad'}",
        f"Tu inscripción a '{actividad.name}' programada para {when} fue confirmada.",
        db,
    )


def notify_waitlist_added(user_id: int, activity_id: int, position: int, db: Session) -> None:
    """Notifica al cliente (email + in-app) que quedó en lista de espera de una actividad."""
    from app.models.activity import Activity as _Activity
    usuario = db.query(User).filter(User.id == user_id).first()
    actividad = db.query(_Activity).filter(_Activity.id == activity_id).first()
    if not usuario or not actividad:
        return
    when = _when_label(actividad)
    subject = f"Estás en lista de espera: {actividad.name or 'Actividad'}"
    body_email = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        f"Te anotaste en la lista de espera de '{actividad.name}' programada para {when}. "
        f"Tu posición actual es la número {position}.\n\n"
        "Te notificaremos si se libera un cupo.\n\n"
        "Saludos cordiales."
    )
    if getattr(usuario, "email", None):
        _send_email(usuario.email, subject, body_email)
    crear_notificacion(
        user_id,
        f"En lista de espera: {actividad.name or 'Actividad'}",
        f"Quedaste en lista de espera de '{actividad.name}' (posición {position}). Te avisaremos si hay un cupo.",
        db,
    )


def notify_waitlist_promoted(user_id: int, activity_id: int, db: Session) -> None:
    """Notifica al cliente (email + in-app) que se le asignó automáticamente un cupo liberado."""
    from app.models.activity import Activity as _Activity
    usuario = db.query(User).filter(User.id == user_id).first()
    actividad = db.query(_Activity).filter(_Activity.id == activity_id).first()
    if not usuario or not actividad:
        return
    when = _when_label(actividad)
    subject = f"¡Conseguiste un cupo!: {actividad.name or 'Actividad'}"
    body_email = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        f"Se liberó un cupo en '{actividad.name}' programada para {when} y fuiste inscripto/a "
        "automáticamente por ser el siguiente en la lista de espera.\n\n"
        "Revisá tus reservas en la plataforma para más detalles.\n\n"
        "Saludos cordiales."
    )
    if getattr(usuario, "email", None):
        _send_email(usuario.email, subject, body_email)
    crear_notificacion(
        user_id,
        f"Cupo asignado: {actividad.name or 'Actividad'}",
        f"Se liberó un cupo en '{actividad.name}' y fuiste inscripto/a automáticamente.",
        db,
        link="/cliente/reservas",
    )


def notify_waitlist_removed(user_id: int, activity_id: int, db: Session) -> None:
    """Notifica al cliente (email + in-app) que fue dado de baja en la lista de espera."""
    from app.models.activity import Activity as _Activity
    usuario = db.query(User).filter(User.id == user_id).first()
    actividad = db.query(_Activity).filter(_Activity.id == activity_id).first()
    if not usuario or not actividad:
        return
    when = _when_label(actividad)
    subject = f"Baja de lista de espera: {actividad.name or 'Actividad'}"
    body_email = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        f"Te confirmamos que fuiste dado/a de baja en la lista de espera de '{actividad.name}' "
        f"programada para {when}.\n\n"
        "Si fue un error, podés volver a anotarte desde la plataforma.\n\n"
        "Saludos cordiales."
    )
    if getattr(usuario, "email", None):
        _send_email(usuario.email, subject, body_email)
    crear_notificacion(
        user_id,
        f"Baja de lista de espera: {actividad.name or 'Actividad'}",
        f"Fuiste dado/a de baja en la lista de espera de '{actividad.name}' programada para {when}.",
        db,
    )


def notify_class_cancelled_by_center(user_id: int, activity_id: int, credito_otorgado: bool,
                                      refund_percent: Optional[int], db: Session) -> None:
    """Notifica al cliente (email + in-app) que el centro canceló su clase por falta de
    profesor asignado a <= 12 hs del inicio. El cliente no es penalizado: si es abonado
    recibe un crédito (salvo que ya alcanzó el tope mensual); si no es abonado se le
    reintegra el porcentaje que haya abonado."""
    from app.models.activity import Activity as _Activity
    usuario = db.query(User).filter(User.id == user_id).first()
    actividad = db.query(_Activity).filter(_Activity.id == activity_id).first()
    if not usuario or not actividad:
        return
    when = _when_label(actividad)
    subject = f"Clase cancelada por el centro: {actividad.name or 'Actividad'}"

    if refund_percent is not None:
        beneficio = f"Se te reintegra el {refund_percent}% que habías abonado."
        resumen = f"Se te reintegró el {refund_percent}%."
    elif credito_otorgado:
        beneficio = "Como beneficio, te otorgamos un crédito que podés usar para anotarte en otra clase."
        resumen = "Se te otorgó un crédito."
    else:
        beneficio = "Lamentablemente ya alcanzaste el límite de créditos de este mes, por lo que no se otorgó un crédito adicional."
        resumen = "Ya alcanzaste el límite mensual de créditos."

    body_email = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        f"Te informamos que la clase '{actividad.name}' programada para {when} fue cancelada por el centro "
        "al no contar con un profesor asignado.\n\n"
        f"{beneficio}\n\n"
        "Saludos cordiales."
    )
    if getattr(usuario, "email", None):
        _send_email(usuario.email, subject, body_email)
    crear_notificacion(
        user_id,
        subject,
        f"La clase '{actividad.name}' programada para {when} fue cancelada por el centro (sin profesor asignado). {resumen}",
        db,
        link="/cliente/reservas",
    )


def notify_activity_assumed(activity_id: int, professor: User, db: Session) -> None:
    """Notifica (email + in-app) a todos los administradores y al propio profesor
    cuando este asume una actividad disponible."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        logger.warning("notify_activity_assumed: actividad %s no encontrada", activity_id)
        return

    when = _when_label(actividad)
    nombre_profesor = f"{professor.name} {professor.lastname}".strip()

    # Aviso a los administradores
    title_admin = f"Profesor asignado: {actividad.name or 'Actividad'}"
    subject_admin = f"Aviso: {nombre_profesor} asumió '{actividad.name or 'Actividad'}'"
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        try:
            body_email = (
                f"Hola {admin.name} {admin.lastname},\n\n"
                f"El profesor {nombre_profesor} asumió la actividad '{actividad.name}' "
                f"programada para {when}.\n\n"
                "Saludos cordiales."
            )
            if getattr(admin, "email", None):
                _send_email(admin.email, subject_admin, body_email)
            crear_notificacion(
                admin.id,
                title_admin,
                f"El profesor {nombre_profesor} asumió '{actividad.name}' programada para {when}.",
                db,
            )
        except Exception:
            logger.exception(
                "Error notificando al admin %s sobre asignación de profesor en actividad %s",
                admin.id, activity_id,
            )

    # Confirmación al profesor
    try:
        subject_prof = f"Confirmación: asumiste '{actividad.name or 'Actividad'}'"
        body_email_prof = (
            f"Hola {professor.name} {professor.lastname},\n\n"
            f"Confirmamos que asumiste la actividad '{actividad.name}' programada para {when}.\n\n"
            "Saludos cordiales."
        )
        if getattr(professor, "email", None):
            _send_email(professor.email, subject_prof, body_email_prof)
        crear_notificacion(
            professor.id,
            f"Asumiste: {actividad.name or 'Actividad'}",
            f"Confirmamos que asumiste la actividad '{actividad.name}' programada para {when}.",
            db,
        )
    except Exception:
        logger.exception(
            "Error notificando al profesor %s sobre asignación a actividad %s",
            professor.id, activity_id,
        )


def notify_professor_resignation(activity_id: int, professor_name: str, db: Session) -> None:
    """Notifica a todos los administradores (email + in-app) cuando un profesor renuncia a una actividad."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        logger.warning("notify_professor_resignation: actividad %s no encontrada", activity_id)
        return

    when = _when_label(actividad)
    title = f"Renuncia de profesor: {actividad.name or 'Actividad'}"
    subject = f"Aviso: renuncia de profesor en '{actividad.name or 'Actividad'}'"

    admins = db.query(User).filter(User.role == "admin").all()
    if not admins:
        logger.info("notify_professor_resignation: no hay administradores en el sistema")
        return

    for admin in admins:
        try:
            body_email = (
                f"Hola {admin.name} {admin.lastname},\n\n"
                f"El profesor {professor_name} renunció a la actividad '{actividad.name}' "
                f"programada para {when}.\n\n"
                "La actividad queda sin profesor asignado y puede necesitar atención.\n\n"
                "Saludos cordiales."
            )
            if getattr(admin, "email", None):
                _send_email(admin.email, subject, body_email)

            crear_notificacion(
                admin.id,
                title,
                f"El profesor {professor_name} renunció a '{actividad.name}' programada para {when}.",
                db,
            )
        except Exception:
            logger.exception(
                "Error notificando al admin %s sobre renuncia en actividad %s",
                admin.id, activity_id,
            )
