"""
seed_mock.py — Responsable: Francis
Crea usuarios de prueba para cada rol si todavía no existen en la BD.

Ejecutar manualmente (desde la carpeta backend/):
    python database/seed_mock.py

También se llama automáticamente desde main.py al iniciar el servidor.

Credenciales de acceso:
┌──────────────────────────────┬───────────────────────────────┬──────────────┐
│ Rol                          │ Email                         │ Contraseña   │
├──────────────────────────────┼───────────────────────────────┼──────────────┤
│ Administrador (admin)        │ admin@rehabilitar.com         │ Admin123     │
│ Cliente (client)             │ cliente@rehabilitar.com       │ Cliente123   │
│ Recepcionista (receptionist) │ empleado@rehabilitar.com      │ Empleado123  │
│ Profesor (professor)         │ profesor@rehabilitar.com      │ Profesor123  │
└──────────────────────────────┴───────────────────────────────┴──────────────┘
"""
from datetime import date
import sys
import os
from datetime import date, timedelta, datetime

# Asegura que el directorio raíz del backend esté en el path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import SessionLocal, engine, Base
from app.models.user import User
from app.models.room import Room
from app.models.plan import Plan
from app.models.user_plan import UserPlan
from app.models.notification import Notification
from app.models.activity import Activity
from app.models.activity_suggestion import ActivitySuggestion
from app.models.reservation import Reservation
from app.utils.security import hash_password

# Importar todos los modelos para que Base cree las tablas si no existen
import app.models.reservation  # noqa
import app.models.waitlist      # noqa
import app.models.attendance    # noqa

USUARIOS_MOCK = [
    {
        "name": "Super",
        "lastname": "Admin",
        "email": "admin@rehabilitar.com",
        "password": "Admin123",
        "role": "admin",
        "dni": "11111111",
        "birth_date": date(1990, 1, 15),
    },
    {
        "name": "Carlos",
        "lastname": "Cliente",
        "email": "cliente@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "22222222",
        "birth_date": date(1995, 6, 20),
    },
    {
        "name": "Laura",
        "lastname": "Recepcion",
        "email": "empleado@rehabilitar.com",
        "password": "Empleado123",
        "role": "receptionist",
        "dni": "33333333",
        "birth_date": date(1988, 3, 10),
    },
    {
        "name": "Marcos",
        "lastname": "Profesor",
        "email": "profesor@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "44444444",
        "specialization": "Fisioterapia",
        "birth_date": date(1985, 11, 5),
    },
    {
        "name": "Sofia",
        "lastname": "Kinesiologia",
        "email": "profe2@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "44444445",
        "specialization": "Kinesiologia deportiva",
        "birth_date": date(1990, 4, 15),
    },
    {
        "name": "Carlos",
        "lastname": "Pilates",
        "email": "profe3@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "44444446",
        "specialization": "Pilates terapeutico",
        "birth_date": date(1983, 7, 22),
    },
    {
        "name": "Maria",
        "lastname": "Neurologia",
        "email": "profe4@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "44444447",
        "specialization": "Kinesiologia neurologica",
        "birth_date": date(1987, 2, 8),
    },
    {
        "name": "Ana",
        "lastname": "Abonada",
        "email": "abonado@rehabilitar.com",
        "password": "Abonado123",
        "role": "client",
        "dni": "55555555",
        "birth_date": date(1992, 8, 12),
    },
    # Profesores extra para escenarios de demo
    {
        "name": "Pepe",
        "lastname": "Muñoz",
        "email": "pepemunoz@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "66666666",
        "specialization": "Kinesiologia deportiva",
        "birth_date": date(1978, 3, 22),
    },
    {
        # DNI 46201004 usado en HU "Crear Cuenta" E7 (DNI ya registrado como profesor)
        "name": "Bruno",
        "lastname": "Demo",
        "email": "brunodemo@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "46201004",
        "specialization": "Kinesiologia deportiva",
        "birth_date": date(1982, 6, 15),
    },
    {
        # Profesor de especialidad "Yoga" para HU "Asumir actividad" (E1).
        # Su especialidad coincide con la actividad "Yoga" sin profesor.
        "name": "Alex",
        "lastname": "Rivas",
        "email": "alex@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "47000001",
        "specialization": "Yoga",
        "birth_date": date(1991, 9, 3),
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    
    # Migración manual: agregar columna specialization a user_plans si no existe
    db = SessionLocal()
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        user_plans_columns = [col['name'] for col in inspector.get_columns('user_plans')]
        if 'specialization' not in user_plans_columns:
            print("[seed_mock] Agregando columna 'specialization' a tabla user_plans...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE user_plans ADD COLUMN specialization VARCHAR(120) NOT NULL DEFAULT 'Sin especificar'"))
                conn.commit()
            print("[seed_mock] Columna 'specialization' agregada exitosamente.")
    except Exception as e:
        print(f"[seed_mock] Error durante migración manual: {e}")
    finally:
        db.close()
    creados = []
    omitidos = []
    reactivados = []

    try:
        for datos in USUARIOS_MOCK:
            existe = db.query(User).filter(User.email == datos["email"]).first()
            if existe:
                cambio = False
                # Revertir la baja lógica y restaurar la identidad canónica del usuario
                # mock (nombre, apellido, rol, especialidad) SOLO al reactivar una cuenta
                # borrada. No se tocan las cuentas activas para no pisar ediciones hechas
                # a propósito (ej. cambiar el apellido desde el perfil). El DNI no se toca
                # para evitar choques de unicidad.
                if existe.is_deleted:
                    existe.is_deleted = False
                    existe.deleted_at = None
                    existe.deleted_by = None
                    existe.name = datos["name"]
                    existe.lastname = datos["lastname"]
                    existe.role = datos["role"]
                    existe.specialization = datos.get("specialization")
                    cambio = True
                # Reactivar si quedó deshabilitada (no altera nombre ni datos).
                if existe.account_status != "active":
                    existe.account_status = "active"
                    cambio = True
                if cambio:
                    db.commit()
                    reactivados.append(datos["email"])
                else:
                    omitidos.append(datos["email"])
                continue

            usuario = User(
                name=datos["name"],
                lastname=datos["lastname"],
                email=datos["email"],
                password=hash_password(datos["password"]),
                role=datos["role"],
                dni=datos["dni"],
                account_status="active",
                specialization=datos.get("specialization"),
                birth_date=datos["birth_date"],
            )
            db.add(usuario)
            creados.append(datos["email"])

        db.commit()
    finally:
        db.close()

    if creados:
        print(f"[seed_mock] Usuarios creados: {', '.join(creados)}")
    if reactivados:
        print(f"[seed_mock] Usuarios reactivados (baja lógica revertida): {', '.join(reactivados)}")
    if omitidos:
        print(f"[seed_mock] Ya existían (omitidos): {', '.join(omitidos)}")
    if not creados and not omitidos and not reactivados:
        print("[seed_mock] Sin cambios.")

    # ── Seed de las 7 salas físicas ────────────────────────────────────────────
    SALAS = [
        {"name": "Sala 1", "capacity": 10},
        {"name": "Sala 2", "capacity": 10},
        {"name": "Sala 3", "capacity": 10},
        {"name": "Sala 4", "capacity":  8},
        {"name": "Sala 5", "capacity":  8},
        {"name": "Sala 6", "capacity":  5},
        {"name": "Sala 7", "capacity":  1},
    ]

    db = SessionLocal()
    try:
        salas_creadas = []
        for datos in SALAS:
            existe = db.query(Room).filter(Room.name == datos["name"]).first()
            if not existe:
                db.add(Room(name=datos["name"], capacity=datos["capacity"]))
                salas_creadas.append(datos["name"])
        db.commit()
        if salas_creadas:
            print(f"[seed_mock] Salas creadas: {', '.join(salas_creadas)}")
        else:
            print("[seed_mock] Salas: ya existían, sin cambios.")
    finally:
        db.close()

    # ── Seed de planes ────────────────────────────────────────────────────────
    # Único plan del sistema: mensual (30 días), hasta 4 clases fijas de la
    # especialidad elegida al suscribirse. Un cliente puede tener varios planes
    # (suscripciones) a la vez, por ejemplo uno por cada especialidad.
    PLANES = [
        {
            "name": "Plan Mensual",
            "description": "Hasta 4 clases fijas por mes de la especialidad elegida.",
            "price": 20000,
            "duration_days": 30,
            "coverage_type": "Hasta 4 clases fijas por mes",
        },
    ]

    db = SessionLocal()
    try:
        planes_creados = []
        planes_actualizados = []
        for datos in PLANES:
            existe = db.query(Plan).filter(Plan.name == datos["name"]).first()
            if not existe:
                db.add(Plan(
                    name=datos["name"],
                    description=datos["description"],
                    price=datos["price"],
                    duration_days=datos["duration_days"],
                    coverage_type=datos["coverage_type"],
                    status="active",
                ))
                planes_creados.append(datos["name"])
            else:
                cambio = False
                for campo in ("description", "price", "duration_days", "coverage_type"):
                    if str(getattr(existe, campo)) != str(datos[campo]):
                        setattr(existe, campo, datos[campo])
                        cambio = True
                if existe.status != "active":
                    existe.status = "active"
                    cambio = True
                if cambio:
                    planes_actualizados.append(datos["name"])

        # Solo debe existir un plan disponible (el mensual): cualquier otro plan
        # que haya quedado de versiones anteriores del sistema se desactiva.
        nombres_vigentes = [datos["name"] for datos in PLANES]
        obsoletos = db.query(Plan).filter(Plan.name.notin_(nombres_vigentes), Plan.status == "active").all()
        for plan_obsoleto in obsoletos:
            plan_obsoleto.status = "inactive"

        db.commit()
        if planes_creados:
            print(f"[seed_mock] Planes creados: {', '.join(planes_creados)}")
        if planes_actualizados:
            print(f"[seed_mock] Planes actualizados: {', '.join(planes_actualizados)}")
        if obsoletos:
            print(f"[seed_mock] Planes desactivados (obsoletos): {', '.join(p.name for p in obsoletos)}")
        if not planes_creados and not planes_actualizados and not obsoletos:
            print("[seed_mock] Planes: ya existían, sin cambios.")
    finally:
        db.close()

    # ── Seed del UserPlan del usuario abonado ──────────────────────────────────
    db = SessionLocal()
    try:
        usuario_abonado = db.query(User).filter(User.email == "abonado@rehabilitar.com").first()
        plan_mensual = db.query(Plan).filter(Plan.name == "Plan Mensual").first()
        if usuario_abonado and plan_mensual:
            try:
                ya_tiene_plan = db.query(UserPlan).filter(
                    UserPlan.user_id == usuario_abonado.id,
                    UserPlan.status == "active",
                ).first()
            except Exception as e:
                # Si hay error (ej: columna no existe), eliminar los planes viejos e intentar de nuevo
                print(f"[seed_mock] Error consultando UserPlan (probablemente falta la columna specialization): {e}")
                print("[seed_mock] Intentando eliminar UserPlans viejos...")
                try:
                    db.query(UserPlan).delete()
                    db.commit()
                    print("[seed_mock] UserPlans viejos eliminados.")
                except:
                    db.rollback()
                ya_tiene_plan = None
            
            if not ya_tiene_plan:
                hoy = date.today()
                db.add(UserPlan(
                    user_id=usuario_abonado.id,
                    plan_id=plan_mensual.id,
                    specialization="Fisioterapia",  # especialidad elegida por el usuario
                    start_date=hoy,
                    end_date=hoy + timedelta(days=plan_mensual.duration_days),
                    status="active",
                ))
                db.commit()
                print("[seed_mock] UserPlan abonado@rehabilitar.com → Plan Mensual (Fisioterapia) creado.")
            else:
                print("[seed_mock] UserPlan abonado@rehabilitar.com: ya existía, sin cambios.")
    finally:
        db.close()


    # ── Seed de notificaciones de demo (HU Marcar notificación como leído) ──────
    # 4 notificaciones unread para cliente@rehabilitar.com.
    # Idempotente: solo crea si el usuario tiene menos de 4 notificaciones unread.
    NOTIFICACIONES_DEMO = [
        {
            "title": "Turno confirmado",
            "body": "Tu reserva para Fisioterapia del lunes 14/07 a las 10:00 fue confirmada.",
        },
        {
            "title": "Apto físico aprobado",
            "body": "Tu certificado médico fue revisado y aprobado por el administrador.",
        },
        {
            "title": "Nueva actividad disponible",
            "body": "Se abrió una nueva clase de Pilates terapéutico. ¡Reservá tu lugar!",
        },
        {
            "title": "Recordatorio de clase",
            "body": "Mañana tenés Kinesiología deportiva a las 09:00. ¡No te olvides!",
        },
    ]

    db = SessionLocal()
    try:
        cliente_demo = db.query(User).filter(User.email == "cliente@rehabilitar.com").first()
        if cliente_demo:
            unread_count = db.query(Notification).filter(
                Notification.user_id == cliente_demo.id,
                Notification.read == False,
            ).count()
            notifs_a_crear = NOTIFICACIONES_DEMO[unread_count:]
            for datos in notifs_a_crear:
                db.add(Notification(
                    user_id=cliente_demo.id,
                    title=datos["title"],
                    body=datos["body"],
                    read=False,
                ))
            db.commit()
            if notifs_a_crear:
                print(f"[seed_mock] Notificaciones demo creadas: {len(notifs_a_crear)}")
            else:
                print("[seed_mock] Notificaciones demo: ya existían 4 unread, sin cambios.")

        # Una única notificación unread para abonado@ (Ana) — HU "Marcar como leído" E2:
        # al leer la única, el badge debe desaparecer por completo.
        ana_demo = db.query(User).filter(User.email == "abonado@rehabilitar.com").first()
        if ana_demo:
            unread_ana = db.query(Notification).filter(
                Notification.user_id == ana_demo.id,
                Notification.read == False,
            ).count()
            if unread_ana == 0:
                db.add(Notification(
                    user_id=ana_demo.id,
                    title="Recordatorio de pago",
                    body="Tu abono mensual vence en 3 días. Renovalo para no perder tu lugar.",
                    read=False,
                ))
                db.commit()
                print("[seed_mock] Notificación única para abonado@ creada (demo marcar la única).")
            else:
                print("[seed_mock] Notificación única para abonado@: ya tenía unread, sin cambios.")
    finally:
        db.close()


    # ── Seed de actividades para demo ─────────────────────────────────────────
    db = SessionLocal()
    try:
        sala1 = db.query(Room).filter(Room.name == "Sala 1").first()
        sala2 = db.query(Room).filter(Room.name == "Sala 2").first()
        sala3 = db.query(Room).filter(Room.name == "Sala 3").first()
        marcos = db.query(User).filter(User.email == "profesor@rehabilitar.com").first()
        carlos_pilates = db.query(User).filter(User.email == "profe3@rehabilitar.com").first()

        actividades_nuevas = []

        # "Rehabilitar Codo" fija — para HU Inscribir Actividad Fija
        if sala1 and marcos and not db.query(Activity).filter(
            Activity.name == "Rehabilitar Codo",
            Activity.activity_type == "fixed",
        ).first():
            actividades_nuevas.append(Activity(
                room_id=sala1.id,
                name="Rehabilitar Codo",
                specialization="Fisioterapia",
                activity_type="fixed",
                schedule="Martes · 10:00–11:00",
                professor=f"{marcos.name} {marcos.lastname}",
                price=5000,
                capacity=3,
                status="active",
                description="Clase de rehabilitación enfocada en el codo.",
            ))

        # "Fisioterapia sin asignar" fija — para HU Asumir Actividad (E1)
        if sala2 and not db.query(Activity).filter(
            Activity.name == "Fisioterapia sin asignar",
        ).first():
            actividades_nuevas.append(Activity(
                room_id=sala2.id,
                name="Fisioterapia sin asignar",
                specialization="Fisioterapia",
                activity_type="fixed",
                schedule="Jueves · 11:00–12:00",
                professor=None,
                price=4500,
                capacity=5,
                status="active",
            ))

        for act in actividades_nuevas:
            db.add(act)
        db.commit()
        if actividades_nuevas:
            print(f"[seed_mock] Actividades demo creadas: {len(actividades_nuevas)}")
        else:
            print("[seed_mock] Actividades demo fijas: ya existían, sin cambios.")

        # "Rehabilitar Codo" individual — para HU Inscribir Actividad Individual
        hoy = date.today()
        hay_individual = db.query(Activity).filter(
            Activity.name == "Rehabilitar Codo",
            Activity.activity_type == "individual",
            Activity.specific_date >= hoy,
        ).first()
        if sala1 and marcos and not hay_individual:
            fecha_demo = hoy + timedelta(days=14)
            db.add(Activity(
                room_id=sala1.id,
                name="Rehabilitar Codo",
                specialization="Fisioterapia",
                activity_type="individual",
                specific_date=fecha_demo,
                time_slot="14:00",
                professor=f"{marcos.name} {marcos.lastname}",
                price=8000,
                capacity=3,
                status="active",
                description="Sesión individual de rehabilitación de codo.",
            ))
            db.commit()
            print(f"[seed_mock] Actividad individual 'Rehabilitar Codo' creada para {fecha_demo}.")
        else:
            print("[seed_mock] Actividad individual 'Rehabilitar Codo': ya existe una futura, sin cambios.")

        # "Yoga" sin profesor — para HU "Asumir actividad" (E1).
        # Se programa el próximo martes estricto para que:
        #   - la clase siga siendo futura/asumible cualquier día que se demuestre, y
        #   - el inbox diga exactamente "Martes YYYY-MM-DD · 10:00–11:00".
        # El profesor Alex (especialidad "Yoga") puede asumirla. Se inscribe a
        # cliente@ para poder mostrar también el aviso a los clientes inscriptos.
        sala4 = db.query(Room).filter(Room.name == "Sala 4").first()
        cliente_yoga = db.query(User).filter(User.email == "cliente@rehabilitar.com").first()
        dias_hasta_martes = (1 - hoy.weekday()) % 7 or 7   # Martes = 1; próximo martes estricto
        martes_yoga = hoy + timedelta(days=dias_hasta_martes)
        yoga = db.query(Activity).filter(
            Activity.name == "Yoga",
            Activity.specialization == "Yoga",
            Activity.activity_type == "fixed",
            Activity.professor.is_(None),
            Activity.status == "active",
            Activity.specific_date >= hoy,
        ).first()
        if sala4 and not yoga:
            yoga = Activity(
                room_id=sala4.id,
                name="Yoga",
                specialization="Yoga",
                activity_type="fixed",
                schedule="Martes · 10:00–11:00",
                specific_date=martes_yoga,
                time_slot="10:00",
                professor=None,
                price=5000,
                capacity=5,
                status="active",
                description="Clase de Yoga sin profesor asignado (demo Asumir actividad).",
            )
            db.add(yoga)
            db.commit()
            db.refresh(yoga)
            print(f"[seed_mock] Actividad 'Yoga' sin profesor creada para {martes_yoga}.")
            if cliente_yoga:
                ya_reservado = db.query(Reservation).filter(
                    Reservation.user_id == cliente_yoga.id,
                    Reservation.activity_id == yoga.id,
                ).first()
                if not ya_reservado:
                    db.add(Reservation(
                        user_id=cliente_yoga.id,
                        activity_id=yoga.id,
                        reservation_type="fixed",
                        status="confirmed",
                        payment_status="completed",
                        reservation_date=datetime(martes_yoga.year, martes_yoga.month, martes_yoga.day, 10, 0),
                    ))
                    db.commit()
                    print("[seed_mock] Reserva de cliente@ en 'Yoga' creada (demo aviso a inscriptos).")
        else:
            print("[seed_mock] Actividad 'Yoga' sin profesor: ya existe una futura, sin cambios.")

        # ── HU "Aceptar actividad" E3: aceptación fallida por sala no disponible ──
        # Sugerencia individual "Yoga" (Sala 4, 22/07/2026 · 14:00, 4 cupos) + una
        # actividad ya programada en la MISMA sala/fecha/hora. Al aceptar la sugerencia,
        # crear_actividad valida la sala y rechaza con "La sala no está disponible…".
        # La fecha es fija: la colisión se evalúa sobre actividades 'active' sin importar
        # si la fecha ya pasó, así que el escenario funciona cualquier día que se demuestre.
        alex_prof = db.query(User).filter(User.email == "alex@rehabilitar.com").first()
        fecha_colision = date(2026, 7, 22)
        hora_colision = "14:00"
        if sala4:
            bloqueante = db.query(Activity).filter(
                Activity.room_id == sala4.id,
                Activity.specific_date == fecha_colision,
                Activity.time_slot == hora_colision,
                Activity.status == "active",
            ).first()
            if not bloqueante:
                db.add(Activity(
                    room_id=sala4.id,
                    name="Turno reservado Sala 4",
                    specialization="Fisioterapia",
                    activity_type="individual",
                    specific_date=fecha_colision,
                    time_slot=hora_colision,
                    professor=None,
                    price=5000,
                    capacity=5,
                    status="active",
                    description="Ocupa la Sala 4 el 22/07/2026 14:00 (demo aceptar sugerencia fallida).",
                ))
                db.commit()
                print("[seed_mock] Actividad bloqueante en Sala 4 (22/07 14:00) creada.")
            else:
                print("[seed_mock] Actividad bloqueante Sala 4: ya existía, sin cambios.")

            sug_yoga_ind = db.query(ActivitySuggestion).filter(
                ActivitySuggestion.name == "Yoga",
                ActivitySuggestion.activity_type == "individual",
                ActivitySuggestion.status == "pending",
            ).first()
            if alex_prof and not sug_yoga_ind:
                db.add(ActivitySuggestion(
                    professor_id=alex_prof.id,
                    room_id=sala4.id,
                    name="Yoga",
                    specialization="Yoga",
                    activity_type="individual",
                    specific_date=fecha_colision,
                    time_slot=hora_colision,
                    capacity=4,
                    status="pending",
                ))
                db.commit()
                print("[seed_mock] Sugerencia individual 'Yoga' (Sala 4, 22/07 14:00) creada.")
            else:
                print("[seed_mock] Sugerencia individual 'Yoga': ya existía, sin cambios.")

        # Sugerencias pendientes — para HU Aceptar Actividad
        # Necesitan time_slot y dates para que aceptar_sugerencia pueda llamar a crear_actividad.
        def _proximas_fechas(dia_semana: int, cantidad: int = 4) -> str:
            """Devuelve fechas futuras del día dado (0=Lun … 6=Dom) como CSV ISO."""
            hoy_s = date.today()
            dias_hasta = (dia_semana - hoy_s.weekday()) % 7 or 7
            primera = hoy_s + timedelta(days=dias_hasta)
            return ",".join((primera + timedelta(weeks=i)).isoformat() for i in range(cantidad))

        SUGERENCIAS_CONFIG = [
            {
                "name": "Prueba",
                "profesor": marcos,
                "sala": sala3,
                "specialization": "Fisioterapia",
                "schedule": "Miércoles · 09:00–10:00",
                "time_slot": "09:00",
                "dates": _proximas_fechas(2),  # miércoles = weekday 2
                "capacity": 5,
            },
            {
                "name": "Pilates",
                "profesor": carlos_pilates,
                "sala": sala2,
                "specialization": "Pilates terapeutico",
                "schedule": "Viernes · 15:00–16:00",
                "time_slot": "15:00",
                "dates": _proximas_fechas(4),  # viernes = weekday 4
                "capacity": 8,
            },
        ]

        sugerencias_nuevas = []
        sugerencias_actualizadas = 0
        for cfg in SUGERENCIAS_CONFIG:
            prof = cfg["profesor"]
            sala = cfg["sala"]
            if not prof or not sala:
                continue

            existente = db.query(ActivitySuggestion).filter(
                ActivitySuggestion.name == cfg["name"],
                ActivitySuggestion.status == "pending",
            ).first()

            if existente:
                # Completar campos faltantes en sugerencias creadas sin time_slot/dates
                if not existente.dates or not existente.time_slot:
                    existente.dates = cfg["dates"]
                    existente.time_slot = cfg["time_slot"]
                    existente.professor_id = prof.id
                    sugerencias_actualizadas += 1
            else:
                sugerencias_nuevas.append(ActivitySuggestion(
                    professor_id=prof.id,
                    room_id=sala.id,
                    name=cfg["name"],
                    specialization=cfg["specialization"],
                    activity_type="fixed",
                    schedule=cfg["schedule"],
                    time_slot=cfg["time_slot"],
                    dates=cfg["dates"],
                    capacity=cfg["capacity"],
                    status="pending",
                ))

        for sug in sugerencias_nuevas:
            db.add(sug)
        db.commit()
        if sugerencias_nuevas:
            print(f"[seed_mock] Sugerencias demo creadas: {len(sugerencias_nuevas)}")
        if sugerencias_actualizadas:
            print(f"[seed_mock] Sugerencias demo actualizadas (se agregaron dates/time_slot): {sugerencias_actualizadas}")
        if not sugerencias_nuevas and not sugerencias_actualizadas:
            print("[seed_mock] Sugerencias demo: ya existían completas, sin cambios.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("\nCredenciales de acceso:")
    print(f"  admin@rehabilitar.com      /  Admin123")
    print(f"  cliente@rehabilitar.com    /  Cliente123")
    print(f"  empleado@rehabilitar.com   /  Empleado123")
    print(f"  profesor@rehabilitar.com   /  Profesor123")
    print(f"  abonado@rehabilitar.com    /  Abonado123")
    print(f"  pepemunoz@rehabilitar.com  /  Profesor123")
