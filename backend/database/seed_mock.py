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
from app.models.credit_transaction import CreditTransaction
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
    {
        # Profesor de "Rehabilitar Muñeca" — HU "Cancelar actividad" (E1).
        # Especialidad exclusiva: así "Rehabilitar Muñeca" no aparece en la lista de
        # "actividades para asumir" de ningún otro profesor.
        "name": "Franco",
        "lastname": "Ibarra",
        "email": "franco@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "47000002",
        "specialization": "Kinesiologia respiratoria",
        "birth_date": date(1986, 5, 14),
    },
    {
        # Profesora saliente de "Tren superior" — HU "Modificar actividad" (E2).
        "name": "Ámbar",
        "lastname": "Soto",
        "email": "ambar@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "47000003",
        "specialization": "Kinesiologia traumatologica",
        "birth_date": date(1989, 1, 25),
    },
    {
        # Profesor entrante de "Tren superior" — HU "Modificar actividad" (E2).
        # Comparte especialidad con Ámbar: por eso "cumple la condición" y el selector
        # de profesor de la pantalla de edición lo ofrece.
        "name": "Pablo",
        "lastname": "Ruiz",
        "email": "pablo@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "47000004",
        "specialization": "Kinesiologia traumatologica",
        "birth_date": date(1984, 10, 2),
    },
    {
        # Profesor que renuncia — HU "Renunciar actividad" (E1). El mail es el que
        # indica la HU.
        "name": "Ariel",
        "lastname": "Gómez",
        "email": "profe@gmail.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "47000005",
        "specialization": "Osteopatia",
        "birth_date": date(1980, 12, 8),
    },
    {
        # Cliente inscripto en "Pilates" — HU "Cancelar actividad" (E4). Es un cliente
        # aparte para no ensuciar "Mis reservas" de cliente@, que se usa en las HUs de
        # inscripción y de cancelar turno.
        "name": "Nadia",
        "lastname": "Pilatera",
        "email": "pilates.demo@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "47000006",
        "birth_date": date(1993, 4, 4),
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

    _seed_apto_fisico_demo()
    _reparar_profesor_rehabilitar_codo()
    _seed_actividades_modificar_cancelar_renunciar()
    _seed_cancelar_turno()


def _reparar_profesor_rehabilitar_codo() -> None:
    """Devuelve el profesor a "Rehabilitar Codo" si quedó sin asignar.

    Las dos "Rehabilitar Codo" (fija e individual) solo se crean si no existen, así que
    una demo previa de renuncia/edición puede dejarlas sin profesor y el seed ya no las
    arregla. Sin profesor la clase entra en la cancelación automática de <= 12 hs y
    aparece en el listado de "actividades para asumir", que no es lo que describen las
    HUs de inscripción.
    """
    db = SessionLocal()
    try:
        marcos = db.query(User).filter(User.email == "profesor@rehabilitar.com").first()
        if not marcos:
            return
        nombre = f"{marcos.name} {marcos.lastname}"
        reparadas = (
            db.query(Activity)
            .filter(
                Activity.name == "Rehabilitar Codo",
                Activity.status == "active",
                Activity.professor.is_(None),
            )
            .update({Activity.professor: nombre}, synchronize_session=False)
        )
        db.commit()
        if reparadas:
            print(f"[seed_mock] 'Rehabilitar Codo': profesor reasignado a {nombre} ({reparadas} actividad/es).")
    finally:
        db.close()


def _seed_apto_fisico_demo() -> None:
    """Aprueba el apto físico de los clientes de demo.

    Sin apto aprobado, create_reservation rechaza cualquier inscripción, así que las
    HUs de inscripción no se pueden demostrar en una base recién creada.
    """
    db = SessionLocal()
    try:
        emails = ["cliente@rehabilitar.com", "abonado@rehabilitar.com", "pilates.demo@rehabilitar.com"]
        aprobados = []
        for usuario in db.query(User).filter(User.email.in_(emails)).all():
            if usuario.medical_certificate_status != "approved":
                usuario.medical_certificate_status = "approved"
                aprobados.append(usuario.email)
        db.commit()
        if aprobados:
            print(f"[seed_mock] Apto físico aprobado para: {', '.join(aprobados)}")
        else:
            print("[seed_mock] Apto físico demo: ya estaba aprobado, sin cambios.")
    finally:
        db.close()


# Fechas de las HUs de Modificar actividad. Son las que indica la HU y siguen siendo
# futuras, así que se usan tal cual.
FECHA_YOGA_MODIFICAR = date(2027, 10, 19)   # Martes
FECHA_TREN_SUPERIOR = date(2026, 8, 20)     # Jueves


def _proximo_dia(dia_semana: int, semanas_extra: int = 0) -> date:
    """Próxima fecha futura estricta del día dado (0=Lunes … 6=Domingo)."""
    hoy = date.today()
    dias_hasta = (dia_semana - hoy.weekday()) % 7 or 7
    return hoy + timedelta(days=dias_hasta, weeks=semanas_extra)


def _seed_actividades_modificar_cancelar_renunciar() -> None:
    """Datos para las HUs Modificar actividad, Cancelar actividad y Renunciar actividad.

    Aditivo e idempotente: cada actividad se identifica por nombre + fecha, así que
    volver a correr el seed no duplica ni pisa el estado de una demo ya hecha.
    Para repetir una demo ya "gastada" (p. ej. una actividad ya cancelada) hay que
    borrarla a mano; ver GUION_DEMO_HUS.md.
    """
    db = SessionLocal()
    try:
        salas = {sala.name: sala for sala in db.query(Room).all()}
        cliente = db.query(User).filter(User.email == "cliente@rehabilitar.com").first()
        nadia = db.query(User).filter(User.email == "pilates.demo@rehabilitar.com").first()
        carlos_pilates = db.query(User).filter(User.email == "profe3@rehabilitar.com").first()

        def _existe(nombre: str, fecha: date, hora: str) -> bool:
            # La identidad incluye la hora: la base arrastra actividades canceladas de
            # demos anteriores con el mismo nombre y fecha (p. ej. varias "Pilates" de
            # los viernes), y sin la hora estas actividades no se sembrarían nunca.
            return db.query(Activity).filter(
                Activity.name == nombre,
                Activity.specific_date == fecha,
                Activity.time_slot == hora,
            ).first() is not None

        def _crear(nombre, sala, spec, fecha, hora_ini, hora_fin, profesor, price, capacity, desc):
            dia = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][fecha.weekday()]
            act = Activity(
                room_id=sala.id,
                name=nombre,
                specialization=spec,
                activity_type="fixed",
                schedule=f"{dia} · {hora_ini}–{hora_fin}",
                specific_date=fecha,
                time_slot=hora_ini,
                professor=profesor,
                price=price,
                capacity=capacity,
                status="active",
                description=desc,
            )
            db.add(act)
            db.flush()
            return act

        creadas = []

        # ── HU "Modificar actividad" E1: cambio de sala ────────────────────────
        # La HU se contradice: el "Dado" habla de Sala 5 → Sala 6, pero el mensaje
        # esperado dice "Sala: Sala 2 → Sala 3". Se siembra en Sala 2 para que la
        # notificación coincida palabra por palabra con el mensaje de la HU.
        # Sala 3 (cap. 10) queda libre ese día/hora y tiene capacidad ≥ Sala 2, que es
        # lo que exige editar_actividad, así que el selector la ofrece.
        if salas.get("Sala 2") and not _existe("Yoga", FECHA_YOGA_MODIFICAR, "10:00"):
            yoga_mod = _crear(
                "Yoga", salas["Sala 2"], "Yoga", FECHA_YOGA_MODIFICAR, "10:00", "11:00",
                "Alex Rivas", 5000, 6,
                "Demo HU Modificar actividad (E1): cambio de sala.",
            )
            creadas.append("Yoga (modificar sala)")
            if cliente:
                db.add(Reservation(
                    user_id=cliente.id,
                    activity_id=yoga_mod.id,
                    reservation_type="fixed",
                    status="confirmed",
                    payment_status="completed",
                    reservation_date=datetime(
                        FECHA_YOGA_MODIFICAR.year, FECHA_YOGA_MODIFICAR.month,
                        FECHA_YOGA_MODIFICAR.day, 10, 0,
                    ),
                ))

        # ── HU "Modificar actividad" E2: cambio de profesor ────────────────────
        # Ámbar y Pablo comparten especialidad y ningún otro profesor la tiene: el
        # selector de profesor muestra exactamente esos dos.
        if salas.get("Sala 3") and not _existe("Tren superior", FECHA_TREN_SUPERIOR, "13:00"):
            tren_mod = _crear(
                "Tren superior", salas["Sala 3"], "Kinesiologia traumatologica",
                FECHA_TREN_SUPERIOR, "13:00", "14:00", "Ámbar Soto", 6000, 8,
                "Demo HU Modificar actividad (E2): cambio de profesor.",
            )
            creadas.append("Tren superior (modificar profesor)")
            if cliente:
                db.add(Reservation(
                    user_id=cliente.id,
                    activity_id=tren_mod.id,
                    reservation_type="fixed",
                    status="confirmed",
                    payment_status="completed",
                    reservation_date=datetime(
                        FECHA_TREN_SUPERIOR.year, FECHA_TREN_SUPERIOR.month,
                        FECHA_TREN_SUPERIOR.day, 13, 0,
                    ),
                ))

        # ── HU "Renunciar actividad" E1 ────────────────────────────────────────
        # "Tren superior" aparte del de Modificar E2, para que las dos HUs no compitan
        # por el mismo profesor. Se distinguen por fecha/sala/horario.
        fecha_renuncia = _proximo_dia(0, semanas_extra=3)  # lunes, 3 semanas adelante
        if salas.get("Sala 5") and not _existe("Tren superior", fecha_renuncia, "09:00"):
            _crear(
                "Tren superior", salas["Sala 5"], "Osteopatia", fecha_renuncia,
                "09:00", "10:00", "Ariel Gómez", 6000, 8,
                "Demo HU Renunciar actividad (E1).",
            )
            creadas.append("Tren superior (renunciar)")

        # ── HU "Cancelar actividad" E1 y E2 ────────────────────────────────────
        # Misma actividad para los dos escenarios: E2 aborta la cancelación y E1 la
        # concreta. Hay que demostrar E2 ANTES que E1. Sin inscriptos, como pide la HU.
        fecha_munieca = _proximo_dia(0, semanas_extra=1)  # lunes, para que el aviso diga "Lunes ..."
        if salas.get("Sala 6") and not _existe("Rehabilitar Muñeca", fecha_munieca, "10:00"):
            _crear(
                "Rehabilitar Muñeca", salas["Sala 6"], "Kinesiologia respiratoria",
                fecha_munieca, "10:00", "11:00", "Franco Ibarra", 5000, 4,
                "Demo HU Cancelar actividad (E2 abortar y E1 confirmar, en ese orden).",
            )
            creadas.append("Rehabilitar Muñeca (con profesor)")

        # ── HU "Cancelar actividad" E3: sin profesor ───────────────────────────
        # Especialidad sin ningún profesor asignado: así no ensucia la lista de
        # "actividades para asumir" de nadie.
        fecha_munieca_sp = _proximo_dia(0, semanas_extra=2)
        if salas.get("Sala 6") and not _existe("Rehabilitar Muñeca", fecha_munieca_sp, "12:00"):
            _crear(
                "Rehabilitar Muñeca", salas["Sala 6"], "Electroterapia",
                fecha_munieca_sp, "12:00", "13:00", None, 5000, 4,
                "Demo HU Cancelar actividad (E3): sin profesor ni inscriptos.",
            )
            creadas.append("Rehabilitar Muñeca (sin profesor)")

        # ── HU "Cancelar actividad" E4: con inscriptos ─────────────────────────
        # Viernes 17:00 en Sala 5 para no chocar con la sugerencia "Pilates" pendiente
        # (Sala 2, viernes 15:00) que usa la HU de Aceptar actividad.
        fecha_pilates = _proximo_dia(4)  # viernes
        if salas.get("Sala 5") and carlos_pilates and not _existe("Pilates", fecha_pilates, "17:00"):
            pilates = _crear(
                "Pilates", salas["Sala 5"], "Pilates terapeutico", fecha_pilates,
                "17:00", "18:00", f"{carlos_pilates.name} {carlos_pilates.lastname}",
                5500, 8, "Demo HU Cancelar actividad (E4): tiene un cliente inscripto.",
            )
            creadas.append("Pilates (con inscripto)")
            if nadia:
                db.add(Reservation(
                    user_id=nadia.id,
                    activity_id=pilates.id,
                    reservation_type="fixed",
                    status="confirmed",
                    payment_status="completed",
                    reservation_date=datetime(
                        fecha_pilates.year, fecha_pilates.month, fecha_pilates.day, 17, 0,
                    ),
                ))

        db.commit()
        if creadas:
            print(f"[seed_mock] Actividades demo (modificar/cancelar/renunciar): {', '.join(creadas)}")
        else:
            print("[seed_mock] Actividades demo (modificar/cancelar/renunciar): ya existían, sin cambios.")
    finally:
        db.close()


# Prefijo de las actividades de la HU "Cancelar turno". Se reconstruyen enteras en cada
# corrida del seed, así que el prefijo tiene que ser exclusivo de esta demo.
PREFIJO_CANCELAR_TURNO = "Cancelación "

# nombre, horas desde ahora, email del cliente, % de seña abonada
ESCENARIOS_CANCELAR_TURNO = [
    ("Cancelación +48h (abonado)",      60, "abonado@rehabilitar.com", None),
    ("Cancelación con crédito (+48h)",  72, "abonado@rehabilitar.com", None),
    ("Cancelación 24-48h (1ra)",        36, "abonado@rehabilitar.com", None),
    ("Cancelación 24-48h (2da)",        40, "abonado@rehabilitar.com", None),
    ("Cancelación 24-48h (3ra)",        44, "abonado@rehabilitar.com", None),
    ("Cancelación -24h (abonado)",      12, "abonado@rehabilitar.com", None),
    ("Cancelación +24h (no abonado)",   30, "cliente@rehabilitar.com", 50),
    ("Cancelación -24h (no abonado)",   10, "cliente@rehabilitar.com", 50),
]


def _seed_cancelar_turno() -> None:
    """Datos para la HU "Cancelar turno" (8 escenarios).

    A diferencia del resto del seed, este bloque NO es aditivo: borra y vuelve a crear
    sus actividades, reservas y créditos en cada corrida. Es a propósito — las ventanas
    de la HU (>48 h, 24-48 h, <24 h) se calculan como offsets desde "ahora", así que el
    seed hay que correrlo el mismo día de la demo (idealmente un rato antes). Correrlo
    de nuevo también es la forma de resetear la demo si ya se cancelaron los turnos.

    Todo lo que toca es exclusivo de esta HU salvo dos cosas de abonado@rehabilitar.com
    que se resetean a propósito: su descuento pendiente y su ledger de créditos.
    """
    db = SessionLocal()
    try:
        abonado = db.query(User).filter(User.email == "abonado@rehabilitar.com").first()
        sala = db.query(Room).filter(Room.name == "Sala 6").first()
        marcos = db.query(User).filter(User.email == "profesor@rehabilitar.com").first()
        if not (abonado and sala and marcos):
            print("[seed_mock] Cancelar turno: faltan usuario abonado / Sala 6 / profesor, se omite.")
            return

        # ── Reset ──────────────────────────────────────────────────────────────
        viejas = db.query(Activity).filter(Activity.name.like(f"{PREFIJO_CANCELAR_TURNO}%")).all()
        ids_viejas = [a.id for a in viejas]
        if ids_viejas:
            reservas_viejas = db.query(Reservation).filter(Reservation.activity_id.in_(ids_viejas)).all()
            ids_reservas = [r.id for r in reservas_viejas]
            if ids_reservas:
                db.query(CreditTransaction).filter(
                    CreditTransaction.reservation_id.in_(ids_reservas)
                ).delete(synchronize_session=False)
            db.query(Reservation).filter(
                Reservation.activity_id.in_(ids_viejas)
            ).delete(synchronize_session=False)
            db.query(Activity).filter(
                Activity.id.in_(ids_viejas)
            ).delete(synchronize_session=False)

        # El ledger de créditos y el descuento pendiente de abonado@ se reconstruyen
        # desde cero: si no, los movimientos que dejó una demo anterior corren la cuenta
        # de cancelaciones del mes y los escenarios E2/E3/E4 dan el descuento equivocado.
        db.query(CreditTransaction).filter(CreditTransaction.user_id == abonado.id).delete(
            synchronize_session=False
        )
        abonado.pending_discount_percent = 0
        db.commit()
        # Los delete() masivos no limpian la identity map y SQLite reusa los ids que
        # acaban de quedar libres: sin esto, el alta de abajo avisa que está pisando
        # objetos ya cargados. Hay que guardar los ids antes de expulgar: después de
        # expunge_all() las instancias quedan desacopladas y ni se les puede leer.
        abonado_id, sala_id, marcos_id = abonado.id, sala.id, marcos.id
        db.expunge_all()
        abonado = db.query(User).filter(User.id == abonado_id).first()
        sala = db.query(Room).filter(Room.id == sala_id).first()
        marcos = db.query(User).filter(User.id == marcos_id).first()

        # ── Alta ───────────────────────────────────────────────────────────────
        ahora = datetime.now()
        dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        creadas = []

        for nombre, horas, email, deposito in ESCENARIOS_CANCELAR_TURNO:
            usuario = db.query(User).filter(User.email == email).first()
            if not usuario:
                continue
            inicio = ahora + timedelta(hours=horas)
            hora_ini = inicio.strftime("%H:00")
            hora_fin = f"{(inicio.hour + 1) % 24:02d}:00"
            actividad = Activity(
                room_id=sala.id,
                name=nombre,
                # Fisioterapia = la especialidad del plan de abonado@. La política de
                # cancelación del abonado solo aplica si el plan cubre la especialidad
                # de la actividad; con otra especialidad caería en la rama de no abonado.
                specialization="Fisioterapia",
                activity_type="fixed",
                schedule=f"{dias[inicio.weekday()]} · {hora_ini}–{hora_fin}",
                specific_date=inicio.date(),
                time_slot=hora_ini,
                professor=f"{marcos.name} {marcos.lastname}",
                price=5000,
                capacity=5,
                status="active",
                description=f"Demo HU Cancelar turno — la clase empieza en ~{horas} h.",
            )
            db.add(actividad)
            db.flush()

            reserva = Reservation(
                user_id=usuario.id,
                activity_id=actividad.id,
                reservation_type="fixed",
                status="confirmed",
                payment_status="completed" if deposito is None else "partial",
                # Es lo que lee la política de cancelación para saber cuánto falta.
                reservation_date=inicio.replace(minute=0, second=0, microsecond=0),
                deposit_percent=deposito,
                # Deliberadamente sin user_plan_id: si se imputaran al plan de abonado@,
                # consumirían las 4 clases fijas incluidas y romperían la HU de
                # inscripción por suscripción activa.
                user_plan_id=None,
            )
            db.add(reserva)
            db.flush()

            # E8: la reserva tiene que figurar como pagada con un crédito para que la
            # cancelación responda "No se otorga crédito: esta clase fue reservada
            # usando un crédito."
            if nombre == "Cancelación con crédito (+48h)":
                db.add(CreditTransaction(
                    user_id=usuario.id,
                    amount=-1,
                    reservation_id=reserva.id,
                    reason="spent_reservation",
                ))
            creadas.append(nombre)

        # Saldo base de abonado@: 2 créditos ganados este mes (uno se gasta en la reserva
        # de E8, queda 1 disponible). Con 2 ganados sigue por debajo del tope de 3, así
        # que el escenario E1 todavía puede otorgar el suyo; y el crédito que queda libre
        # habilita la inscripción con crédito de la HU de actividad fija.
        for _ in range(2):
            db.add(CreditTransaction(
                user_id=abonado.id,
                amount=1,
                activity_type="Fisioterapia",
                reason="cancellation_48h",
            ))

        db.commit()
        print(f"[seed_mock] Cancelar turno: {len(creadas)} turnos demo recreados (offsets desde {ahora:%Y-%m-%d %H:%M}).")
        print("[seed_mock]   Creditos de abonado@ reseteados: 2 ganados, 1 gastado (saldo 1).")
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
