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
import uuid
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
    {
        # Abonado de "Kinesiologia deportiva" — HU Inscribir fija E4 (lista de espera
        # con prioridad). Es un cliente APARTE de abonado@ a propósito: si el token de
        # Kinesiologia deportiva fuera de Ana, ella no podría comprar esa especialidad
        # y se caería la HU "Adquirir plan" E2 (que es la única con descuento pendiente).
        "name": "Diego",
        "lastname": "Deportivo",
        "email": "deportivo@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "47000010",
        "birth_date": date(1991, 11, 6),
    },
    {
        # Cliente de 75 años — HU "Adquirir plan" E4 (20% de descuento por edad).
        # La HU lo llama "Juan". La fecha se elige para que tenga 75 cumplidos.
        "name": "Juan",
        "lastname": "Mayor",
        "email": "juan.mayor@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "47000011",
        "birth_date": date(1951, 1, 10),
    },
    {
        # Cliente SIN apto físico aprobado — HU "Adquirir plan" E5 y HU "Ver planes y
        # abonos" E3. La HU lo llama "Pepe". Queda con medical_certificate_status="none"
        # (el default del modelo): _seed_apto_fisico_demo lo excluye a propósito.
        "name": "Pepe",
        "lastname": "SinApto",
        "email": "pepe.sinapto@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "47000012",
        "birth_date": date(1990, 3, 18),
    },
    # Clientes de relleno — HU 9 E4/E5 (lista de espera). Solo existen para ocupar los
    # 3 cupos de "Rehabilitar Codo (lista de espera)" y que abonado@ y cliente@ caigan
    # en la lista. No se usan para ninguna otra demo ni hace falta loguearse con ellos.
    {
        "name": "Rita",
        "lastname": "Relleno",
        "email": "relleno1@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "47000007",
        "birth_date": date(1994, 2, 17),
    },
    {
        "name": "Tomas",
        "lastname": "Relleno",
        "email": "relleno2@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "47000008",
        "birth_date": date(1990, 10, 30),
    },
    {
        "name": "Vera",
        "lastname": "Relleno",
        "email": "relleno3@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "47000009",
        "birth_date": date(1996, 7, 9),
    },
    # Clientes utilizados para reintegrar cuenta y rechazar cuenta en la demo
    {
        "name": "Reintegrar",
        "lastname": "Sin Solicitud",
        "email": "reintegrar@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "44332211",
        "birth_date": date(2000, 1, 1),
    },
    {
        "name": "Rechazar",
        "lastname": "Solicitud",
        "email": "rechazar@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "44332212",
        "birth_date": date(2000, 1, 1),
    }
]

# Clientes que ocupan los 3 cupos de "Rehabilitar Codo (lista de espera)" — HU 9 E4/E5.
EMAILS_RELLENO_CODO = (
    "relleno1@rehabilitar.com",
    "relleno2@rehabilitar.com",
    "relleno3@rehabilitar.com",
)


def _llenar_cupos_codo_espera(actividad, fecha_turno, db) -> None:
    """Deja "Rehabilitar Codo (lista de espera)" con los 3 cupos ocupados por los
    clientes de relleno, y saca de la actividad a abonado@ y cliente@.

    Es lo que hace repetible E4/E5: sin esto, la primera corrida de la demo deja a
    abonado@ y cliente@ ya anotados y el segundo intento falla por duplicado.

    La reserva se inserta directo en la tabla y no vía create_reservation a propósito:
    ese camino exige apto físico aprobado y simula el pago, y acá solo interesa que el
    cupo figure ocupado.
    """
    from app.models.waitlist import Waitlist

    # La disponibilidad de una fija se cuenta por día calendario contra la fecha del
    # turno (servicio_actividades.py:289), así que la reserva tiene que caer ese día.
    inicio_turno = datetime(fecha_turno.year, fecha_turno.month, fecha_turno.day, 12, 0)

    rellenos = db.query(User).filter(User.email.in_(EMAILS_RELLENO_CODO)).all()
    ocupados = []
    for cliente in rellenos:
        reserva = db.query(Reservation).filter(
            Reservation.user_id == cliente.id,
            Reservation.activity_id == actividad.id,
        ).first()
        if not reserva:
            db.add(Reservation(
                user_id=cliente.id,
                activity_id=actividad.id,
                reservation_type="fixed",
                status="confirmed",
                payment_status="completed",
                reservation_date=inicio_turno,
                deposit_percent=100,
            ))
            ocupados.append(cliente.email)
        else:
            # Se reutiliza la fila: la actividad se reprograma cada semana y una demo
            # de cancelación pudo dejarla cancelada.
            if reserva.status != "confirmed" or reserva.reservation_date != inicio_turno:
                reserva.status = "confirmed"
                reserva.payment_status = "completed"
                reserva.reservation_date = inicio_turno
                ocupados.append(cliente.email)

    # E4/E5 anotan a abonado@ y cliente@ en la lista de espera: hay que dejarlos fuera
    # de la actividad para que la demo se pueda repetir.
    limpiados = []
    demo = db.query(User).filter(User.email.in_(
        ["abonado@rehabilitar.com", "cliente@rehabilitar.com"]
    )).all()
    for cliente in demo:
        en_espera = db.query(Waitlist).filter(
            Waitlist.user_id == cliente.id,
            Waitlist.activity_id == actividad.id,
            Waitlist.status == "waiting",
        ).all()
        for entrada in en_espera:
            db.delete(entrada)
            limpiados.append(f"{cliente.email} (lista de espera)")

        reservas = db.query(Reservation).filter(
            Reservation.user_id == cliente.id,
            Reservation.activity_id == actividad.id,
            Reservation.status.in_(["pending", "confirmed"]),
        ).all()
        for reserva in reservas:
            db.delete(reserva)
            limpiados.append(f"{cliente.email} (reserva)")

    db.commit()

    faltantes = set(EMAILS_RELLENO_CODO) - {c.email for c in rellenos}
    if faltantes:
        print(f"[seed_mock] ⚠ Clientes de relleno faltantes, 'Rehabilitar Codo (lista de espera)' "
              f"queda con cupos libres: {', '.join(sorted(faltantes))}")
    if ocupados:
        print(f"[seed_mock] Cupos de 'Rehabilitar Codo' (lista de espera) ocupados por: {', '.join(ocupados)}")
    if limpiados:
        print(f"[seed_mock] 'Rehabilitar Codo' (lista de espera) liberada de: {', '.join(limpiados)}")


def _migrar_activity_group_id() -> None:
    """Agrega activities.activity_group_id y agrupa las actividades que ya existían.

    El id de lote lo asigna crear_actividad al crear las ocurrencias juntas, pero las
    actividades anteriores a la columna no lo tienen. Para esas se infiere el lote por
    nombre + sala + hora + especialidad dentro del mismo mes calendario, que es como se
    crearon: es una heurística y solo se corre una vez, sobre las que quedaron en NULL.
    """
    _migrar_columna("activities", "activity_group_id", "VARCHAR(36)")
    _agrupar_actividades_existentes()


def _migrar_columna(tabla: str, columna: str, tipo_sql: str) -> None:
    """Agrega una columna si no existe. El proyecto no usa Alembic: las migraciones se
    aplican acá, al arrancar el seed."""
    from sqlalchemy import inspect, text

    try:
        inspector = inspect(engine)
        columnas = [col["name"] for col in inspector.get_columns(tabla)]
        if columna in columnas:
            return
        print(f"[seed_mock] Agregando columna '{columna}' a tabla {tabla}...")
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN {columna} {tipo_sql}"))
            conn.commit()
        print(f"[seed_mock] Columna '{columna}' agregada exitosamente.")
    except Exception as e:
        print(f"[seed_mock] Error agregando {tabla}.{columna}: {e}")


def _agrupar_actividades_existentes() -> None:
    """Backfill: las actividades creadas antes de la columna no tienen lote."""
    db = SessionLocal()
    try:
        pendientes = db.query(Activity).filter(
            Activity.activity_type == "fixed",
            Activity.specific_date.isnot(None),
            Activity.activity_group_id.is_(None),
        ).all()
        if not pendientes:
            return

        grupos = {}
        for act in pendientes:
            clave = (
                act.name,
                act.room_id,
                act.time_slot,
                act.specialization,
                act.specific_date.year,
                act.specific_date.month,
            )
            grupos.setdefault(clave, []).append(act)

        for actividades in grupos.values():
            group_id = str(uuid.uuid4())
            for act in actividades:
                act.activity_group_id = group_id
        db.commit()
        print(f"[seed_mock] activity_group_id asignado: {len(pendientes)} actividades en {len(grupos)} lotes.")
    except Exception as e:
        db.rollback()
        print(f"[seed_mock] Error agrupando actividades existentes: {e}")
    finally:
        db.close()


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

    _migrar_activity_group_id()
    _migrar_columna("users", "pending_discount_reason", "VARCHAR(40)")
    _migrar_columna("waitlist", "payment_status", "VARCHAR(20) NOT NULL DEFAULT 'none'")
    _migrar_columna("waitlist", "deposit_percent", "INTEGER")
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
    # Único plan del sistema. "Mensual" NO son 30 días: son las 4 clases de un mes de la
    # actividad que elijas. Es un token de un solo uso que no vence, y lo usás cuando
    # querés. Un cliente puede tener varios tokens, pero uno solo por especialidad.
    # duration_days queda en 30 por compatibilidad del modelo Plan; ya no define vigencia.
    PLANES = [
        {
            "name": "Mensual",
            "description": "Las 4 clases de un mes de la actividad fija que elijas. No vence: la usás cuando quieras.",
            "price": 20000,
            "duration_days": 30,
            "coverage_type": "Las 4 clases de un mes de una actividad fija",
        },
    ]

    # El nombre del plan es dato, pero sale dentro de un texto que la HU "Adquirir plan"
    # fija palabra por palabra: "Te suscribiste al plan 'Mensual' en X". Con el nombre
    # viejo el mensaje decía "al plan 'Plan Mensual'". Se RENOMBRA la fila existente en
    # lugar de crear una nueva: los UserPlan ya comprados apuntan a este plan_id, y crear
    # otra dejaría a las suscripciones viejas colgadas de un plan desactivado.
    RENOMBRES_PLAN = {"Plan Mensual": "Mensual"}

    db = SessionLocal()
    try:
        for nombre_viejo, nombre_nuevo in RENOMBRES_PLAN.items():
            fila = db.query(Plan).filter(Plan.name == nombre_viejo).first()
            ya_existe_nuevo = db.query(Plan).filter(Plan.name == nombre_nuevo).first()
            if fila and not ya_existe_nuevo:
                fila.name = nombre_nuevo
                db.commit()
                print(f"[seed_mock] Plan '{nombre_viejo}' renombrado a '{nombre_nuevo}'.")

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
        plan_mensual = db.query(Plan).filter(Plan.name == "Mensual").first()
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

        # "Rehabilitar Codo" fija (E1/E2/E3) ya NO se crea acá: la HU pide 4 clases del
        # mes agrupadas, y eso lo arma _seed_lotes_fijos_suscripcion() más abajo, que
        # además adopta la fila legacy que este bloque había creado sin fecha.

        # "Fisioterapia sin asignar" fija — para HU Asumir Actividad (E1).
        # Se restaura a activa y sin profesor: es lo que hace repetible el escenario
        # después de asumirla o cancelarla en una demo.
        fisio_sin_asignar = db.query(Activity).filter(
            Activity.name == "Fisioterapia sin asignar",
        ).first()
        if fisio_sin_asignar:
            arreglos = []
            if fisio_sin_asignar.status != "active":
                arreglos.append(f"estaba en estado '{fisio_sin_asignar.status}'")
                fisio_sin_asignar.status = "active"
            if fisio_sin_asignar.professor:
                arreglos.append(f"estaba asumida por {fisio_sin_asignar.professor}")
                fisio_sin_asignar.professor = None
            if arreglos:
                db.commit()
                print(f"[seed_mock] Actividad 'Fisioterapia sin asignar' restaurada para la demo ({'; '.join(arreglos)}).")
        if sala2 and not fisio_sin_asignar:
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

        # ── "Rehabilitar Codo (lista de espera)" — HU 9 E4/E5 ─────────────────────
        # Segunda actividad fija homónima, con los 3 cupos YA llenos por clientes de
        # relleno. Hace falta una aparte porque los escenarios se contradicen sobre la
        # misma actividad: E1/E2/E3 piden cupos libres con abonado@/cliente@ sin
        # inscribir, y E4/E5 piden cupos llenos por *otros* clientes. Es el mismo
        # criterio de las dos "Rehabilitar Muñeca" de la HU de cancelar actividad.
        #
        # Lleva specific_date a propósito: sin fecha puntual el selector ofrece los
        # próximos 8 martes (InscribirActividad.jsx:199) y la disponibilidad de una
        # fija se cuenta contra la fecha elegida (servicio_actividades.py:289), así que
        # los cupos llenos de un martes dejarían libres los otros 7. Con specific_date
        # el selector ofrece un único turno: el que el seed llena.
        hoy = date.today()
        dias_hasta_martes_codo = (1 - hoy.weekday()) % 7 or 7   # Martes = 1; próximo martes estricto
        martes_codo = hoy + timedelta(days=dias_hasta_martes_codo)

        # La identidad es nombre + tipo + hora, y NO incluye la fecha ni el estado: así
        # la fila se reutiliza y se reprograma semana a semana en vez de acumular una
        # actividad nueva por cada corrida (que es como aparecieron las 'Yoga' repetidas).
        codo_espera = db.query(Activity).filter(
            Activity.name == "Rehabilitar Codo",
            Activity.activity_type == "fixed",
            Activity.time_slot == "12:00",
        ).first()

        if not codo_espera and sala1 and marcos:
            codo_espera = Activity(
                room_id=sala1.id,
                name="Rehabilitar Codo",
                specialization="Fisioterapia",
                activity_type="fixed",
                schedule="Martes · 12:00–13:00",
                specific_date=martes_codo,
                time_slot="12:00",
                professor=f"{marcos.name} {marcos.lastname}",
                price=5000,
                capacity=3,
                status="active",
                description="Clase de rehabilitación de codo con los cupos llenos (demo lista de espera).",
            )
            db.add(codo_espera)
            db.commit()
            db.refresh(codo_espera)
            print(f"[seed_mock] Actividad 'Rehabilitar Codo' (lista de espera) creada para {martes_codo}.")
        elif codo_espera:
            arreglos = []
            if codo_espera.specific_date != martes_codo:
                arreglos.append(f"estaba programada para {codo_espera.specific_date}")
                codo_espera.specific_date = martes_codo
            if codo_espera.status != "active":
                arreglos.append(f"estaba en estado '{codo_espera.status}'")
                codo_espera.status = "active"
            if marcos and not codo_espera.professor:
                arreglos.append("estaba sin profesor")
                codo_espera.professor = f"{marcos.name} {marcos.lastname}"
            if arreglos:
                db.commit()
                print(f"[seed_mock] Actividad 'Rehabilitar Codo' (lista de espera) restaurada ({'; '.join(arreglos)}).")

        if codo_espera:
            _llenar_cupos_codo_espera(codo_espera, martes_codo, db)

        # "Rehabilitar Codo" individual — para HU Inscribir Actividad Individual.
        # Igual que la fija: la identidad es nombre+tipo+fecha futura y no incluye el
        # estado, así que hay que restaurarla si una demo de cancelación la dejó cancelada.
        hay_individual = db.query(Activity).filter(
            Activity.name == "Rehabilitar Codo",
            Activity.activity_type == "individual",
            Activity.specific_date >= hoy,
        ).first()
        if hay_individual and marcos:
            arreglos = []
            if hay_individual.status != "active":
                arreglos.append(f"estaba en estado '{hay_individual.status}'")
                hay_individual.status = "active"
            if not hay_individual.professor:
                arreglos.append("estaba sin profesor")
                hay_individual.professor = f"{marcos.name} {marcos.lastname}"
            if arreglos:
                db.commit()
                print(f"[seed_mock] Actividad individual 'Rehabilitar Codo' restaurada para la demo ({'; '.join(arreglos)}).")
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
        # La identidad es sala + fecha + hora, y NO incluye ni el profesor ni el estado:
        #  - si incluyera el profesor, apenas Alex asume la actividad en una demo la
        #    corrida siguiente no la encontraría y crearía un duplicado pisando la misma
        #    sala, día y hora (así aparecieron las 'Yoga' repetidas de la base);
        #  - si incluyera el estado, una demo de cancelación la dejaría inservible.
        # Hay que acotar por sala y fecha: sin eso, .first() puede devolver la 'Yoga' de
        # la HU de modificar actividad y dejarla sin profesor.
        yoga = None
        if sala4:
            yoga = db.query(Activity).filter(
                Activity.name == "Yoga",
                Activity.specialization == "Yoga",
                Activity.activity_type == "fixed",
                Activity.room_id == sala4.id,
                Activity.specific_date == martes_yoga,
                Activity.time_slot == "10:00",
            ).first()
        # Se restaura al estado que pide la HU: activa y sin profesor. Es lo que hace
        # repetible el escenario después de asumirla o cancelarla en una demo.
        if yoga:
            arreglos = []
            if yoga.professor:
                arreglos.append(f"estaba asumida por {yoga.professor}")
                yoga.professor = None
            if yoga.status != "active":
                arreglos.append(f"estaba en estado '{yoga.status}'")
                yoga.status = "active"
            if arreglos:
                db.commit()
                print(f"[seed_mock] Actividad 'Yoga' restaurada para la demo ({'; '.join(arreglos)}).")
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
        else:
            print("[seed_mock] Actividad 'Yoga' sin profesor: ya existe una futura, sin cambios.")

        # El inscripto va aparte del alta: si la reserva se creara solo al crear la
        # actividad, una demo que la cancele dejaría la 'Yoga' sin clientes y el aviso
        # a inscriptos de la HU no se podría mostrar nunca más.
        if yoga and cliente_yoga:
            reserva_yoga = db.query(Reservation).filter(
                Reservation.user_id == cliente_yoga.id,
                Reservation.activity_id == yoga.id,
            ).first()
            if not reserva_yoga:
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
            elif reserva_yoga.status != "confirmed":
                reserva_yoga.status = "confirmed"
                reserva_yoga.cancellation_result = None
                db.commit()
                print("[seed_mock] Reserva de cliente@ en 'Yoga' estaba cancelada: restaurada.")

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
    _seed_lotes_fijos_suscripcion()
    _reparar_profesor_rehabilitar_codo()
    _seed_actividades_modificar_cancelar_renunciar()
    _seed_cancelar_turno()
    suspender_usuarios_demo(db)


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

    OJO: pepe.sinapto@rehabilitar.com NO está en la lista a propósito — es el cliente
    "Pepe" que usan la HU "Adquirir plan" E5 y la HU "Ver planes y abonos" E3, que
    justamente demuestran el bloqueo por apto físico pendiente.
    """
    db = SessionLocal()
    try:
        emails = [
            "cliente@rehabilitar.com",
            "abonado@rehabilitar.com",
            "pilates.demo@rehabilitar.com",
            # Clientes de las HUs de suscripción/inscripción agregadas después.
            "deportivo@rehabilitar.com",
            "juan.mayor@rehabilitar.com",
        ]
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


# ── Lotes de clases fijas para las HUs de suscripción ────────────────────────────
#
# Las HUs "Inscribir a actividad fija" (E1/E4) y "Ver planes y abonos" dependen del
# modelo de token: el plan cubre LAS CLASES DE UN MES de una actividad fija, así que
# inscribirse a una anota al mes entero. Para que eso pase, las 4 clases tienen que ser
# filas hermanas —mismo activity_group_id— con specific_date en el MISMO mes calendario
# (ver _inscribir_ocurrencias_del_mes en servicio_reservas.py).

# Actividad fija de la HU Inscribir E1/E2/E3/E6 y de "Ver planes y abonos" E1.
LOTE_CODO = dict(
    nombre="Rehabilitar Codo", especialidad="Fisioterapia", sala="Sala 1",
    dia_semana=1, hora_ini="10:00", hora_fin="11:00",   # Martes
    email_profesor="profesor@rehabilitar.com", price=5000, capacity=3,
    descripcion="Clase de rehabilitación enfocada en el codo.",
)
# Actividad fija de la HU Inscribir E4 (lista de espera con prioridad del abonado).
LOTE_TOBILLO = dict(
    nombre="Rehabilitar tobillo", especialidad="Kinesiologia deportiva", sala="Sala 2",
    dia_semana=2, hora_ini="10:00", hora_fin="11:00",   # Miércoles
    email_profesor="profe2@rehabilitar.com", price=6000, capacity=3,
    descripcion="Clase de rehabilitación de tobillo (demo lista de espera con prioridad).",
)

# Clientes que se anotan en estos lotes durante la demo. El seed los saca de las
# actividades en cada corrida: sin eso, la segunda demo falla por reserva duplicada.
EMAILS_DEMO_LOTES = (
    "abonado@rehabilitar.com",
    "cliente@rehabilitar.com",
    "deportivo@rehabilitar.com",
)


def _fechas_lote(dia_semana: int, cantidad: int = 4) -> list:
    """Las primeras `cantidad` fechas de `dia_semana` del mes que viene.

    Se usa el mes que viene y no el actual a propósito: el mes en curso puede tener menos
    de 4 martes por delante, y `_inscribir_ocurrencias_del_mes` solo cuenta las clases
    futuras. Con 2 clases el token dispararía además el descuento por "mes corto"
    (subscriptions.SHORT_MONTH_CLASSES), que no es lo que describe la HU.

    La primera ocurrencia cae siempre entre el día 1 y el 7, así que las 4 entran en el
    mismo mes calendario (7 + 21 = 28).
    """
    hoy = date.today()
    primero_mes_siguiente = (hoy.replace(day=1) + timedelta(days=32)).replace(day=1)
    dias_hasta = (dia_semana - primero_mes_siguiente.weekday()) % 7
    primera = primero_mes_siguiente + timedelta(days=dias_hasta)
    return [primera + timedelta(weeks=i) for i in range(cantidad)]


def _asegurar_lote(db, spec: dict, clases: int = 4) -> list:
    """Deja exactamente `clases` ocurrencias hermanas de una fija, todas del mismo mes.

    Reutiliza y reprograma las filas que ya existan con ese nombre + hora en vez de crear
    otras nuevas: es lo que evita que cada corrida del seed acumule una actividad más
    (así aparecieron las 'Yoga' y 'Pilates' repetidas que arrastra la base).
    """
    import uuid

    sala = db.query(Room).filter(Room.name == spec["sala"]).first()
    profe = db.query(User).filter(User.email == spec["email_profesor"]).first()
    if not (sala and profe):
        print(f"[seed_mock] ⚠ Lote '{spec['nombre']}': falta {spec['sala']} o {spec['email_profesor']}, se omite.")
        return []

    fechas = _fechas_lote(spec["dia_semana"], clases)
    dia = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][spec["dia_semana"]]

    existentes = db.query(Activity).filter(
        Activity.name == spec["nombre"],
        Activity.activity_type == "fixed",
        Activity.time_slot == spec["hora_ini"],
    ).order_by(Activity.id.asc()).all()

    # La fija "legacy" (sin fecha ni hora) es la que creaban las versiones viejas del
    # seed. Se la adopta como una ocurrencia más del lote en vez de dejarla suelta: si
    # quedara, en la pantalla de inscripción aparecería una "Rehabilitar Codo" de más,
    # sin fecha, compitiendo con las 4 del mes.
    if len(existentes) < clases:
        existentes += db.query(Activity).filter(
            Activity.name == spec["nombre"],
            Activity.activity_type == "fixed",
            Activity.time_slot.is_(None),
            Activity.specific_date.is_(None),
        ).all()

    lote_id = next((a.activity_group_id for a in existentes if a.activity_group_id), None) or str(uuid.uuid4())

    creadas = 0
    for i, fecha in enumerate(fechas):
        act = existentes[i] if i < len(existentes) else None
        if act is None:
            act = Activity(name=spec["nombre"], activity_type="fixed")
            db.add(act)
            creadas += 1
        act.room_id = sala.id
        act.specialization = spec["especialidad"]
        act.schedule = f"{dia} · {spec['hora_ini']}–{spec['hora_fin']}"
        act.specific_date = fecha
        act.time_slot = spec["hora_ini"]
        act.activity_group_id = lote_id
        act.professor = f"{profe.name} {profe.lastname}"
        act.price = spec["price"]
        act.capacity = spec["capacity"]
        act.status = "active"
        act.description = spec["descripcion"]
    db.commit()

    print(f"[seed_mock] Lote '{spec['nombre']}': {clases} clases en {fechas[0]:%m/%Y} "
          f"({', '.join(f'{f:%d/%m}' for f in fechas)}), {creadas} creada/s, {clases - creadas} reprogramada/s.")
    return db.query(Activity).filter(
        Activity.activity_group_id == lote_id
    ).order_by(Activity.specific_date.asc()).all()


def _limpiar_clientes_demo_del_lote(db, actividades: list) -> None:
    """Saca a los clientes de demo de las actividades del lote (reservas y lista de espera).

    Es lo que hace repetibles las HUs de inscripción: si no, la segunda corrida de la
    demo falla porque el cliente ya está inscripto de la vez anterior.
    """
    from app.models.waitlist import Waitlist

    ids = [a.id for a in actividades]
    if not ids:
        return
    clientes = db.query(User).filter(User.email.in_(EMAILS_DEMO_LOTES)).all()
    ids_clientes = [c.id for c in clientes]
    if not ids_clientes:
        return

    borradas = db.query(Reservation).filter(
        Reservation.activity_id.in_(ids),
        Reservation.user_id.in_(ids_clientes),
    ).delete(synchronize_session=False)
    en_espera = db.query(Waitlist).filter(
        Waitlist.activity_id.in_(ids),
        Waitlist.user_id.in_(ids_clientes),
    ).delete(synchronize_session=False)
    db.commit()
    if borradas or en_espera:
        print(f"[seed_mock]   Clientes demo liberados del lote: {borradas} reserva/s, {en_espera} en lista de espera.")


# Suscripción que tiene que tener cada cliente de demo al empezar (None = no abonado).
# TODO lo demás se borra en cada corrida, y es a propósito: la base arrastra tokens de
# especialidades sueltas comprados en demos anteriores de "Adquirir plan", y rompían
# varias HUs a la vez —cliente@ figuraba como abonado (y los escenarios lo piden NO
# abonado), y ni él ni Ana podían comprar "Kinesiologia deportiva" porque ya tenían un
# token sin usar de esa especialidad, que es justo lo que el sistema no deja repetir.
SUSCRIPCIONES_DEMO = {
    "abonado@rehabilitar.com":     "Fisioterapia",            # Ver planes E1 · Inscribir E1
    "deportivo@rehabilitar.com":   "Kinesiologia deportiva",  # Inscribir E4
    "cliente@rehabilitar.com":     None,                      # Inscribir E2/E3/E5/E7 · Adquirir E1
    "juan.mayor@rehabilitar.com":  None,                      # Adquirir E4
    "pepe.sinapto@rehabilitar.com": None,                     # Adquirir E5
}


def _normalizar_suscripciones_demo() -> None:
    """Deja a cada cliente de demo con exactamente la suscripción que pide su HU.

    Dos cosas que no son obvias:

    - Un token se considera gastado si existe CUALQUIER reserva imputada a él, incluidas
      las canceladas (is_token_usado en subscriptions.py: la fila cancelada es el registro
      de que el token ya se usó). Por eso no alcanza con cancelar los turnos de la demo
      anterior — hay que borrar esas reservas, o la suscripción arranca "usada" y la
      inscripción por suscripción activa falla.
    - Solo se borran las reservas imputadas a un token (user_plan_id no nulo). Las de la
      HU "Cancelar turno" se siembran con user_plan_id=None a propósito, así que este
      bloque no las toca.
    """
    db = SessionLocal()
    try:
        plan = db.query(Plan).filter(Plan.name == "Mensual").first()
        if not plan:
            print("[seed_mock] ⚠ Falta el plan 'Mensual', se omite la normalización de suscripciones.")
            return

        for email, especialidad in SUSCRIPCIONES_DEMO.items():
            usuario = db.query(User).filter(User.email == email).first()
            if not usuario:
                continue

            tokens = db.query(UserPlan).filter(UserPlan.user_id == usuario.id).all()
            sobrantes = [t for t in tokens if t.specialization != especialidad]
            conservado = next((t for t in tokens if t.specialization == especialidad), None)

            # Los duplicados de la MISMA especialidad también sobran: se conserva uno.
            sobrantes += [t for t in tokens
                          if t.specialization == especialidad and t is not conservado]

            if sobrantes:
                ids = [t.id for t in sobrantes]
                db.query(Reservation).filter(Reservation.user_plan_id.in_(ids)).delete(
                    synchronize_session=False
                )
                for t in sobrantes:
                    db.delete(t)

            if especialidad is None:
                db.commit()
                if sobrantes:
                    print(f"[seed_mock]   {email}: {len(sobrantes)} suscripción/es vieja/s borrada/s (queda NO abonado).")
                continue

            if conservado:
                gastadas = db.query(Reservation).filter(
                    Reservation.user_plan_id == conservado.id
                ).delete(synchronize_session=False)
                conservado.status = "active"
                db.commit()
                print(f"[seed_mock]   {email}: token de {especialidad} sin usar"
                      f"{f' ({gastadas} reserva/s imputadas borradas)' if gastadas else ''}"
                      f"{f', {len(sobrantes)} suscripción/es vieja/s borrada/s' if sobrantes else ''}.")
            else:
                hoy = date.today()
                db.add(UserPlan(
                    user_id=usuario.id,
                    plan_id=plan.id,
                    specialization=especialidad,
                    start_date=hoy,
                    end_date=hoy + timedelta(days=plan.duration_days),
                    status="active",
                ))
                db.commit()
                print(f"[seed_mock]   {email}: token de {especialidad} creado.")
    finally:
        db.close()


def _llenar_clase(db, actividad, capacidad: int) -> None:
    """Ocupa todos los cupos de UNA ocurrencia con los clientes de relleno.

    La reserva se inserta directo y no vía create_reservation a propósito: ese camino
    exige apto físico aprobado y simula el pago, y acá solo interesa el cupo ocupado.
    """
    rellenos = db.query(User).filter(User.email.in_(EMAILS_RELLENO_CODO)).limit(capacidad).all()
    inicio = datetime(
        actividad.specific_date.year, actividad.specific_date.month,
        actividad.specific_date.day, int(actividad.time_slot.split(":")[0]), 0,
    )
    for cliente in rellenos:
        reserva = db.query(Reservation).filter(
            Reservation.user_id == cliente.id,
            Reservation.activity_id == actividad.id,
        ).first()
        if not reserva:
            db.add(Reservation(
                user_id=cliente.id, activity_id=actividad.id, reservation_type="fixed",
                status="confirmed", payment_status="completed",
                reservation_date=inicio, deposit_percent=100,
            ))
        else:
            reserva.status = "confirmed"
            reserva.payment_status = "completed"
            reserva.reservation_date = inicio
    db.commit()
    print(f"[seed_mock]   '{actividad.name}' del {actividad.specific_date:%d/%m} llena "
          f"({len(rellenos)}/{capacidad} cupos ocupados).")


def _seed_lotes_fijos_suscripcion() -> None:
    """Datos de las HUs "Inscribir a actividad fija", "Ver planes y abonos" y "Adquirir plan".

    Deja, en cada corrida:
      - "Rehabilitar Codo": 4 clases del mes que viene, martes 10:00, con cupo libre.
      - "Rehabilitar tobillo": 4 clases, miércoles 10:00, con la PRIMERA sin cupos.
      - cada cliente de demo con la suscripción exacta que pide su HU (SUSCRIPCIONES_DEMO).

    El orden importa: primero se liberan las reservas del lote y recién después se
    normalizan las suscripciones, porque el estado "usado" de un token se deduce de las
    reservas que lo referencian.
    """
    db = SessionLocal()
    try:
        codo = _asegurar_lote(db, LOTE_CODO)
        tobillo = _asegurar_lote(db, LOTE_TOBILLO)

        _limpiar_clientes_demo_del_lote(db, codo + tobillo)

        # E4 pide que UNA de las 4 clases no tenga cupos. Se llena la primera del mes:
        # es la más fácil de identificar en vivo.
        if tobillo:
            _llenar_clase(db, tobillo[0], LOTE_TOBILLO["capacity"])
    finally:
        db.close()

    _normalizar_suscripciones_demo()


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

    Cada corrida deja estas actividades EXACTAMENTE en el estado inicial que describe
    la HU: si una demo previa las canceló, les cambió la sala o el profesor, o el
    cliente se dio de baja, el seed lo revierte. Volver a correr el seed es, entonces,
    la forma de repetir cualquiera de estas demos.
    """
    db = SessionLocal()
    try:
        salas = {sala.name: sala for sala in db.query(Room).all()}
        # Las inscripciones demo van a nombre de Nadia y NO de cliente@: cliente@ es
        # quien usa "Mis reservas" en la HU de cancelar turno, y ahí es facilísimo
        # cancelar sin querer estos turnos y quedarse sin los avisos a clientes.
        nadia = db.query(User).filter(User.email == "pilates.demo@rehabilitar.com").first()
        carlos_pilates = db.query(User).filter(User.email == "profe3@rehabilitar.com").first()

        creadas, restauradas = [], []

        def _asegurar(nombre, sala, spec, fecha, hora_ini, hora_fin, profesor, price, capacity, desc):
            """Crea la actividad demo o la devuelve al estado inicial de la HU.

            La identidad es nombre + fecha + hora: no incluye ni el estado ni el
            profesor ni la sala, justamente porque son las cosas que las demos cambian.
            Si los incluyera, apenas una demo modifica algo el seed dejaría de
            reconocerla y crearía un duplicado (así aparecieron las 'Yoga' y 'Pilates'
            repetidas que arrastra la base).
            """
            dia = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][fecha.weekday()]
            act = db.query(Activity).filter(
                Activity.name == nombre,
                Activity.specific_date == fecha,
                Activity.time_slot == hora_ini,
            ).first()

            if not act:
                act = Activity(
                    room_id=sala.id, name=nombre, specialization=spec,
                    activity_type="fixed", schedule=f"{dia} · {hora_ini}–{hora_fin}",
                    specific_date=fecha, time_slot=hora_ini, professor=profesor,
                    price=price, capacity=capacity, status="active", description=desc,
                )
                db.add(act)
                db.flush()
                creadas.append(f"{nombre} {hora_ini}")
                return act

            arreglos = []
            if act.status != "active":
                arreglos.append(f"estaba '{act.status}'")
                act.status = "active"
            if act.professor != profesor:
                arreglos.append(f"profesor era {act.professor!r}")
                act.professor = profesor
            if act.room_id != sala.id:
                arreglos.append(f"estaba en sala {act.room_id}")
                act.room_id = sala.id
            if arreglos:
                restauradas.append(f"{nombre} {hora_ini} ({', '.join(arreglos)})")
            return act

        def _asegurar_reserva(usuario, act, dt):
            """Deja al usuario inscripto en la actividad, aunque haya cancelado antes."""
            if not usuario:
                return
            res = db.query(Reservation).filter(
                Reservation.user_id == usuario.id,
                Reservation.activity_id == act.id,
            ).first()
            if not res:
                db.add(Reservation(
                    user_id=usuario.id, activity_id=act.id, reservation_type="fixed",
                    status="confirmed", payment_status="completed", reservation_date=dt,
                ))
            elif res.status != "confirmed":
                res.status = "confirmed"
                res.cancellation_result = None
                restauradas.append(f"reserva de {usuario.email} en {act.name}")

        # ── HU "Modificar actividad" E1: cambio de sala ────────────────────────
        # La HU se contradice: el "Dado" habla de Sala 5 → Sala 6, pero el mensaje
        # esperado dice "Sala: Sala 2 → Sala 3". Se siembra en Sala 2 para que la
        # notificación coincida palabra por palabra con el mensaje de la HU.
        # Sala 3 (cap. 10) queda libre ese día/hora y tiene capacidad ≥ Sala 2, que es
        # lo que exige editar_actividad, así que el selector la ofrece.
        if salas.get("Sala 2"):
            yoga_mod = _asegurar(
                "Yoga", salas["Sala 2"], "Yoga", FECHA_YOGA_MODIFICAR, "10:00", "11:00",
                "Alex Rivas", 5000, 6,
                "Demo HU Modificar actividad (E1): cambio de sala.",
            )
            _asegurar_reserva(nadia, yoga_mod, datetime(
                FECHA_YOGA_MODIFICAR.year, FECHA_YOGA_MODIFICAR.month, FECHA_YOGA_MODIFICAR.day, 10, 0))

        # ── HU "Modificar actividad" E2: cambio de profesor ────────────────────
        # Ámbar y Pablo comparten especialidad y ningún otro profesor la tiene: el
        # selector de profesor muestra exactamente esos dos.
        if salas.get("Sala 3"):
            tren_mod = _asegurar(
                "Tren superior", salas["Sala 3"], "Kinesiologia traumatologica",
                FECHA_TREN_SUPERIOR, "13:00", "14:00", "Ámbar Soto", 6000, 8,
                "Demo HU Modificar actividad (E2): cambio de profesor.",
            )
            _asegurar_reserva(nadia, tren_mod, datetime(
                FECHA_TREN_SUPERIOR.year, FECHA_TREN_SUPERIOR.month, FECHA_TREN_SUPERIOR.day, 13, 0))

        # ── HU "Renunciar actividad" E1 ────────────────────────────────────────
        # "Tren superior" aparte del de Modificar E2, para que las dos HUs no compitan
        # por el mismo profesor. Se distinguen por fecha/sala/horario.
        fecha_renuncia = _proximo_dia(0, semanas_extra=3)  # lunes, 3 semanas adelante
        if salas.get("Sala 5"):
            _asegurar(
                "Tren superior", salas["Sala 5"], "Osteopatia", fecha_renuncia,
                "09:00", "10:00", "Ariel Gómez", 6000, 8,
                "Demo HU Renunciar actividad (E1).",
            )

        # ── HU "Cancelar actividad" E1 y E2 ────────────────────────────────────
        # Misma actividad para los dos escenarios: E2 aborta la cancelación y E1 la
        # concreta. Hay que demostrar E2 ANTES que E1. Sin inscriptos, como pide la HU.
        fecha_munieca = _proximo_dia(0, semanas_extra=1)  # lunes, para que el aviso diga "Lunes ..."
        if salas.get("Sala 6"):
            _asegurar(
                "Rehabilitar Muñeca", salas["Sala 6"], "Kinesiologia respiratoria",
                fecha_munieca, "10:00", "11:00", "Franco Ibarra", 5000, 4,
                "Demo HU Cancelar actividad (E2 abortar y E1 confirmar, en ese orden).",
            )

        # ── HU "Cancelar actividad" E3: sin profesor ───────────────────────────
        # Especialidad sin ningún profesor asignado: así no ensucia la lista de
        # "actividades para asumir" de nadie.
        fecha_munieca_sp = _proximo_dia(0, semanas_extra=2)
        if salas.get("Sala 6"):
            _asegurar(
                "Rehabilitar Muñeca", salas["Sala 6"], "Electroterapia",
                fecha_munieca_sp, "12:00", "13:00", None, 5000, 4,
                "Demo HU Cancelar actividad (E3): sin profesor ni inscriptos.",
            )

        # ── HU "Cancelar actividad" E4: con inscriptos ─────────────────────────
        # Viernes 17:00 en Sala 5 para no chocar con la sugerencia "Pilates" pendiente
        # (Sala 2, viernes 15:00) que usa la HU de Aceptar actividad.
        fecha_pilates = _proximo_dia(4)  # viernes
        if salas.get("Sala 5") and carlos_pilates:
            pilates = _asegurar(
                "Pilates", salas["Sala 5"], "Pilates terapeutico", fecha_pilates,
                "17:00", "18:00", f"{carlos_pilates.name} {carlos_pilates.lastname}",
                5500, 8, "Demo HU Cancelar actividad (E4): tiene un cliente inscripto.",
            )
            # La inscripción es lo que hace fallar la cancelación: sin ella el escenario
            # no demuestra nada.
            _asegurar_reserva(nadia, pilates, datetime(
                fecha_pilates.year, fecha_pilates.month, fecha_pilates.day, 17, 0))

        db.commit()
        if creadas:
            print(f"[seed_mock] Actividades demo creadas (modificar/cancelar/renunciar): {', '.join(creadas)}")
        if restauradas:
            print(f"[seed_mock] Actividades demo restauradas al estado de la HU: {'; '.join(restauradas)}")
        if not creadas and not restauradas:
            print("[seed_mock] Actividades demo (modificar/cancelar/renunciar): ya estaban OK, sin cambios.")
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

def suspender_usuarios_demo(db):

    usuario1 = db.query(User).filter(User.email == "reintegrar@rehabilitar.com",).first()
    usuario1.account_status = "suspended"
    usuario1.suspension_reason = "No pagó"

    usuario2 = db.query(User).filter(User.email == "rechazar@rehabilitar.com",).first()
    usuario2.account_status = "suspended"
    usuario2.suspension_reason = "No pagó"
    db.commit()
    from app.services.servicio_clientes import registrar_reintegro
    registrar_reintegro(usuario2.id, "Si pagué", db)

if __name__ == "__main__":
    seed()
    print("\nCredenciales de acceso:")
    print(f"  admin@rehabilitar.com      /  Admin123")
    print(f"  cliente@rehabilitar.com    /  Cliente123")
    print(f"  empleado@rehabilitar.com   /  Empleado123")
    print(f"  profesor@rehabilitar.com   /  Profesor123")
    print(f"  abonado@rehabilitar.com    /  Abonado123")
    print(f"  pepemunoz@rehabilitar.com  /  Profesor123")
