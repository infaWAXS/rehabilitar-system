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
