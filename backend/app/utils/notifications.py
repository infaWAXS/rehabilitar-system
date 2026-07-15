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
    """Notifica (email + in-app) al profesor cuando se elimina una actividad.
    Solo se puede eliminar una actividad sin clientes inscriptos, por lo que no hace
    falta avisar a ningún cliente.
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

    subject_profesor = f"Aviso para profesor: cancelación de {actividad.name or 'Actividad'}"

    if not actividad.professor:
        return

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
        return

    # Notificación in-app para el profesor resuelto (o el primer candidato como fallback)
    destinatario_app = profesor_usuario or candidatos_profesor[0]
    if destinatario_app:
        crear_notificacion(
            destinatario_app.id,
            f"Actividad cancelada: {actividad.name or 'Actividad'}",
            f"Te informamos que la actividad '{actividad.name}' programada para {when} fue cancelada.",
            db,
        )

    enviados_profesor = set()
    for candidato in candidatos_profesor:
        if not candidato or not getattr(candidato, "email", None):
            continue
        if candidato.email in enviados_profesor:
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


def notify_activity_modified(activity_id: int, cambios: dict, profesor_anterior: Optional[str],
                              room_id_anterior: Optional[int], db: Session) -> None:
    """Notifica (email + in-app) a clientes y profesor(es) cuando se modifica una actividad,
    indicando explícitamente qué se cambió: la sala, el profesor, o ambos."""
    from app.models.reservation import Reservation
    from app.models.waitlist import Waitlist
    from app.models.room import Room

    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        logger.warning("notify_activity_modified: actividad %s no encontrada", activity_id)
        return

    when = _when_label(actividad)

    cambio_sala = "room_id" in cambios
    cambio_profesor = "professor" in cambios

    # Qué se modificó, en palabras (para títulos/asuntos)
    partes = []
    if cambio_sala:
        partes.append("la sala")
    if cambio_profesor:
        partes.append("el profesor")
    que_cambio = " y ".join(partes) if partes else "la actividad"

    # Resumen detallado de los cambios (anterior → nuevo)
    lineas: list[str] = []
    sala_cambio_texto = ""
    if cambio_sala:
        sala_nueva = db.query(Room).filter(Room.id == cambios["room_id"]).first()
        sala_anterior = db.query(Room).filter(Room.id == room_id_anterior).first() if room_id_anterior else None
        nombre_nueva = sala_nueva.name if sala_nueva else cambios["room_id"]
        sala_cambio_texto = (
            f"{sala_anterior.name} → {nombre_nueva}"
            if sala_anterior and sala_anterior.id != cambios["room_id"]
            else str(nombre_nueva)
        )
        lineas.append(f"  - Sala: {sala_cambio_texto}")
    if cambio_profesor:
        profesor_nuevo_valor = cambios["professor"]
        nombre_nuevo = profesor_nuevo_valor if profesor_nuevo_valor else "sin asignar"
        if profesor_anterior and profesor_anterior != profesor_nuevo_valor:
            lineas.append(f"  - Profesor: {profesor_anterior} → {nombre_nuevo}")
        else:
            lineas.append(f"  - Profesor: {nombre_nuevo}")
    resumen = "\n".join(lineas) if lineas else "  - (cambios generales)"
    resumen_corto = "; ".join(l.strip("- ") for l in lineas) if lineas else "cambios generales"

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

    title_mod = f"Actividad modificada ({que_cambio}): {actividad.name or 'Actividad'}"
    subject_mod = f"Aviso: se modificó {que_cambio} en '{actividad.name or 'Actividad'}'"

    for user_id in ids_clientes:
        try:
            usuario = db.query(User).filter(User.id == user_id).first()
            if not usuario:
                continue
            body_email = (
                f"Hola {usuario.name} {usuario.lastname},\n\n"
                f"Te informamos que se modificó {que_cambio} de la actividad '{actividad.name}' programada para {when}.\n\n"
                f"Cambios:\n{resumen}\n\n"
                "Si tenés dudas, comunicate con la administración.\n\n"
                "Saludos cordiales."
            )
            if getattr(usuario, "email", None):
                _send_email(usuario.email, subject_mod, body_email)
            crear_notificacion(
                user_id, title_mod,
                f"Se modificó {que_cambio} de '{actividad.name}'. {resumen_corto}.",
                db,
            )
        except Exception:
            logger.exception("Error notificando usuario %s sobre modificación de actividad %s", user_id, activity_id)

    # Notificación al profesor
    profesor_nuevo = actividad.professor
    ids_prof_notificados: set[int] = set()
    nota_sala = f" Además, la sala cambió: {sala_cambio_texto}." if cambio_sala else ""

    if cambio_profesor:
        # Notificar al profesor anterior que fue removido
        if profesor_anterior and profesor_anterior != profesor_nuevo:
            prof_ant = _resolve_professor_user(profesor_anterior, db)
            if prof_ant and prof_ant.id not in ids_prof_notificados:
                try:
                    body_email = (
                        f"Hola {prof_ant.name} {prof_ant.lastname},\n\n"
                        f"Te informamos que fuiste removido/a de la actividad '{actividad.name}' "
                        f"programada para {when}.{nota_sala}\n\n"
                        "Saludos cordiales."
                    )
                    if getattr(prof_ant, "email", None):
                        _send_email(prof_ant.email, f"Cambio en actividad: {actividad.name or 'Actividad'}", body_email)
                    crear_notificacion(
                        prof_ant.id,
                        f"Cambio en actividad: {actividad.name or 'Actividad'}",
                        f"Fuiste removido/a de la actividad '{actividad.name}' programada para {when}.{nota_sala}",
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
                        f"programada para {when}.{nota_sala}\n\n"
                        "Saludos cordiales."
                    )
                    if getattr(prof_nuevo, "email", None):
                        _send_email(prof_nuevo.email, f"Asignación a actividad: {actividad.name or 'Actividad'}", body_email)
                    crear_notificacion(
                        prof_nuevo.id,
                        f"Asignación a actividad: {actividad.name or 'Actividad'}",
                        f"Fuiste asignado/a como profesor/a de '{actividad.name}' programada para {when}.{nota_sala}",
                        db,
                    )
                    ids_prof_notificados.add(prof_nuevo.id)
                except Exception:
                    logger.exception("Error notificando al nuevo profesor %s", profesor_nuevo)
    else:
        # El profesor no cambió; notificarle sobre los cambios en la actividad (solo sala)
        if profesor_nuevo:
            prof_usuario = _resolve_professor_user(profesor_nuevo, db)
            if prof_usuario:
                try:
                    body_email = (
                        f"Hola {prof_usuario.name} {prof_usuario.lastname},\n\n"
                        f"Te informamos que se modificó {que_cambio} de la actividad '{actividad.name}' programada para {when}.\n\n"
                        f"Cambios:\n{resumen}\n\n"
                        "Saludos cordiales."
                    )
                    if getattr(prof_usuario, "email", None):
                        _send_email(prof_usuario.email, subject_mod, body_email)
                    crear_notificacion(
                        prof_usuario.id,
                        title_mod,
                        f"Se modificó {que_cambio} de '{actividad.name}'. {resumen_corto}.",
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


def notify_activity_suggestion_created(suggestion, db: Session) -> None:
    """Notifica a todos los administradores (solo in-app) que un profesor sugirió una actividad."""
    profesor = suggestion.professor
    nombre = f"{profesor.name} {profesor.lastname}" if profesor else "Un profesor"
    titulo_actividad = suggestion.name or suggestion.specialization

    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        try:
            crear_notificacion(
                admin.id,
                f"Nueva sugerencia de actividad: {titulo_actividad}",
                f"{nombre} sugirió la actividad \"{titulo_actividad}\". Revisala en el panel de sugerencias.",
                db,
                link="/admin/sugerencias",
            )
        except Exception:
            logger.exception("Error notificando al admin %s sobre nueva sugerencia %s", admin.id, suggestion.id)


def notify_activity_suggestion_accepted(suggestion, db: Session) -> None:
    """Notifica al profesor (solo in-app) que su sugerencia de actividad fue aceptada."""
    profesor = suggestion.professor
    if not profesor:
        return
    titulo_actividad = suggestion.name or suggestion.specialization
    try:
        crear_notificacion(
            profesor.id,
            f"Sugerencia aceptada: {titulo_actividad}",
            f"Tu sugerencia de actividad \"{titulo_actividad}\" fue aceptada y ya está disponible.",
            db,
            link="/profesor/actividades",
        )
    except Exception:
        logger.exception("Error notificando al profesor %s sobre aceptación de sugerencia %s", profesor.id, suggestion.id)


def notify_activity_suggestion_rejected(suggestion, db: Session) -> None:
    """Notifica al profesor (solo in-app) que su sugerencia de actividad fue rechazada."""
    profesor = suggestion.professor
    if not profesor:
        return
    titulo_actividad = suggestion.name or suggestion.specialization
    try:
        crear_notificacion(
            profesor.id,
            f"Sugerencia rechazada: {titulo_actividad}",
            f"Tu sugerencia de actividad \"{titulo_actividad}\" fue rechazada por un administrador.",
            db,
            link="/profesor/actividades",
        )
    except Exception:
        logger.exception("Error notificando al profesor %s sobre rechazo de sugerencia %s", profesor.id, suggestion.id)


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


def notify_account_created_with_temp_password(user_id: int, temp_password: str, db: Session) -> None:
    """Notifica (email + in-app) al usuario recién creado por un administrador, indicándole
    su contraseña temporal y que debe cambiarla desde 'Cambiar contraseña'."""
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        return
    subject = "Tu cuenta en Rehabilitar fue creada"
    body_email = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        "Un administrador creó tu cuenta en Rehabilitar. Tu contraseña temporal es:\n\n"
        f"    {temp_password}\n\n"
        "Por seguridad, te pedimos que ingreses con esta contraseña y la cambies "
        "desde la sección 'Cambiar contraseña' apenas puedas.\n\n"
        "Saludos cordiales."
    )
    if getattr(usuario, "email", None):
        _send_email(usuario.email, subject, body_email)
    crear_notificacion(
        user_id,
        "Cambiá tu contraseña",
        "Tu cuenta fue creada por un administrador con una contraseña temporal (enviada por mail). "
        "Te recomendamos cambiarla desde 'Cambiar contraseña'.",
        db,
    )


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


def notify_subscription_confirmed(user_id: int, plan_name: str, specialization: str,
                                   end_date, price_paid: float, discount_percent: int,
                                   db: Session, discount_reason: str = "por cancelación previa") -> None:
    """Notifica al cliente (email + in-app) que su suscripción a un plan fue confirmada."""
    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        return

    fin = end_date.strftime("%d/%m/%Y") if hasattr(end_date, "strftime") else str(end_date)
    linea_descuento = (
        f"Se aplicó un {discount_percent}% de descuento {discount_reason}.\n"
        if discount_percent else ""
    )
    resumen_descuento = f" (con {discount_percent}% de descuento)" if discount_percent else ""

    subject = f"Suscripción confirmada: {plan_name} en {specialization}"
    body_email = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        f"Tu suscripción al plan '{plan_name}' en {specialization} fue confirmada con éxito.\n"
        f"Pagaste ${price_paid:.2f} y tu suscripción está activa hasta el {fin}.\n"
        f"{linea_descuento}\n"
        "Podés ver el detalle en la sección Suscripciones de la plataforma.\n\n"
        "Saludos cordiales."
    )
    if getattr(usuario, "email", None):
        _send_email(usuario.email, subject, body_email)
    crear_notificacion(
        user_id,
        f"Suscripción confirmada: {plan_name}",
        f"Tu suscripción al plan '{plan_name}' en {specialization} fue confirmada y está activa hasta el {fin}{resumen_descuento}.",
        db,
        link="/cliente/suscripciones",
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
    """Notifica (email + in-app) a todos los administradores, al propio profesor y a los
    clientes inscriptos (reservas activas + lista de espera) cuando un profesor asume
    una actividad disponible."""
    from app.models.reservation import Reservation
    from app.models.waitlist import Waitlist

    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad:
        logger.warning("notify_activity_assumed: actividad %s no encontrada", activity_id)
        return

    when = _when_label(actividad)
    nombre_profesor = f"{professor.name} {professor.lastname}".strip()

    # Aviso a los clientes inscriptos (reservas activas + lista de espera)
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
    for user_id in ids_reservas | ids_espera:
        try:
            usuario = db.query(User).filter(User.id == user_id).first()
            if not usuario:
                continue
            subject_cliente = f"Profesor asignado: {actividad.name or 'Actividad'}"
            body_email = (
                f"Hola {usuario.name} {usuario.lastname},\n\n"
                f"Te informamos que la actividad '{actividad.name}' programada para {when} "
                f"ya tiene profesor/a asignado/a: {nombre_profesor}.\n\n"
                "Saludos cordiales."
            )
            if getattr(usuario, "email", None):
                _send_email(usuario.email, subject_cliente, body_email)
            crear_notificacion(
                user_id,
                subject_cliente,
                f"La actividad '{actividad.name}' ya tiene profesor/a asignado/a: {nombre_profesor}.",
                db,
            )
        except Exception:
            logger.exception(
                "Error notificando al cliente %s sobre asignación de profesor en actividad %s",
                user_id, activity_id,
            )

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


def notify_activity_created(activity_id: int, db: Session, total_ocurrencias: int = 1) -> None:
    """Notifica (email + in-app) al profesor cuando el administrador crea una actividad
    asignándolo directamente desde el alta."""
    actividad = db.query(Activity).filter(Activity.id == activity_id).first()
    if not actividad or not actividad.professor:
        return

    profesor = _resolve_professor_user(actividad.professor, db)
    if not profesor:
        logger.info(
            "notify_activity_created: profesor '%s' no encontrado/sin email para actividad %s",
            actividad.professor, activity_id,
        )
        return

    when = _when_label(actividad)
    extra = f" (con {total_ocurrencias} clases programadas en total)" if total_ocurrencias > 1 else ""
    subject = f"Nueva actividad asignada: {actividad.name or 'Actividad'}"
    body_email = (
        f"Hola {profesor.name} {profesor.lastname},\n\n"
        f"Se creó la actividad '{actividad.name}' y fuiste asignado/a como profesor/a. "
        f"Está programada para {when}{extra}.\n\n"
        "Saludos cordiales."
    )
    try:
        if getattr(profesor, "email", None):
            _send_email(profesor.email, subject, body_email)
        crear_notificacion(
            profesor.id,
            subject,
            f"Fuiste asignado/a como profesor/a de la nueva actividad '{actividad.name}' programada para {when}{extra}.",
            db,
        )
    except Exception:
        logger.exception(
            "Error notificando al profesor %s sobre la creación de la actividad %s",
            profesor.id, activity_id,
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


def notify_password_recovery_requested(user_email: str, recovery_link: str, token_expires_in_minutes: int, db: Session) -> None:
    """Notifica (email) al usuario que solicitó recuperación de contraseña con el link de recuperación."""
    import smtplib
    import ssl
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    usuario = db.query(User).filter(User.email == user_email).first()
    if not usuario:
        return

    subject = "Recupera tu contraseña en Rehabilitar"

    # Crear email HTML con botón clickeable
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Recupera tu contraseña</h2>
                <p>Hola {usuario.name} {usuario.lastname},</p>
                <p>Recibimos tu solicitud de recuperación de contraseña. Hacé clic en el botón de abajo para restablecerla:</p>

                <div style="margin: 30px 0; text-align: center;">
                    <a href="{recovery_link}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Restablecer contraseña
                    </a>
                </div>

                <p style="font-size: 12px; color: #7f8c8d;">
                    O copia y pega este link en tu navegador:<br/>
                    <span style="word-break: break-all; background-color: #ecf0f1; padding: 10px; display: block; margin-top: 10px; border-radius: 3px;">
                        {recovery_link}
                    </span>
                </p>

                <p style="color: #e74c3c; font-weight: bold;">⏰ Este link es válido por {token_expires_in_minutes} minutos.</p>

                <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">

                <p style="font-size: 12px; color: #95a5a6;">
                    Si no solicitaste la recuperación de contraseña, podés ignorar este mensaje.
                </p>
                <p style="font-size: 12px; color: #95a5a6;">
                    Saludos cordiales,<br/>
                    <strong>El equipo de Rehabilitar</strong>
                </p>
            </div>
        </body>
    </html>
    """

    # Versión texto plano para compatibilidad
    text_body = (
        f"Hola {usuario.name} {usuario.lastname},\n\n"
        f"Recibimos tu solicitud de recuperación de contraseña. Hacé clic en el siguiente link para restablecerla:\n\n"
        f"{recovery_link}\n\n"
        f"⏰ Este link es válido por {token_expires_in_minutes} minutos.\n\n"
        "Si no solicitaste la recuperación de contraseña, podés ignorar este mensaje.\n\n"
        "Saludos cordiales.\n"
        "El equipo de Rehabilitar"
    )

    cfg = _smtp_config()
    if not cfg["enabled"]:
        logger.info("SMTP deshabilitado; simulando envío a %s: %s", user_email, subject)
        logger.debug("Email body: %s", text_body)
        return

    if not cfg["host"] or not cfg["port"]:
        logger.warning("SMTP configurado incorrectamente (HOST/PORT faltantes). Simulando envío.")
        logger.debug("Email to=%s subject=%s", user_email, subject)
        return

    try:
        # Crear mensaje multipart (HTML + texto)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = cfg["from"]
        msg["To"] = user_email

        # Agregar versión texto
        msg.attach(MIMEText(text_body, "plain"))
        # Agregar versión HTML (se usa si el cliente lo soporta)
        msg.attach(MIMEText(html_body, "html"))

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

        logger.info("Email de recuperación enviado a %s", user_email)
    except Exception as e:
        logger.exception("Error enviando email de recuperación a %s: %s", user_email, e)
