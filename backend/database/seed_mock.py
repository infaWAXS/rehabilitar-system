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
from datetime import date, timedelta

# Asegura que el directorio raíz del backend esté en el path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import SessionLocal, engine, Base
from app.models.user import User
from app.models.room import Room
from app.models.plan import Plan
from app.models.user_plan import UserPlan
from app.utils.security import hash_password

# Importar todos los modelos para que Base cree las tablas si no existen
import app.models.reservation  # noqa
import app.models.waitlist      # noqa
import app.models.activity      # noqa
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

    try:
        for datos in USUARIOS_MOCK:
            existe = db.query(User).filter(User.email == datos["email"]).first()
            if existe:
                # Corregir account_status si está en formato incorrecto (ej: "Active" → "active")
                if existe.account_status != "active":
                    existe.account_status = "active"
                    db.commit()
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
    if omitidos:
        print(f"[seed_mock] Ya existían (omitidos): {', '.join(omitidos)}")
    if not creados and not omitidos:
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
    PLANES = [
        {
            "name": "Plan Mensual",
            "description": "Acceso a todas las clases fijas semanales de una especialidad.",
            "price": 20000,
            "duration_days": 30,
            "coverage_type": "Todas las clases de la especialidad elegida",
        },
    ]

    db = SessionLocal()
    try:
        planes_creados = []
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
        db.commit()
        if planes_creados:
            print(f"[seed_mock] Planes creados: {', '.join(planes_creados)}")
        else:
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


if __name__ == "__main__":
    seed()
    print("\nCredenciales de acceso:")
    print(f"  admin@rehabilitar.com    /  Admin123")
    print(f"  cliente@rehabilitar.com  /  Cliente123")
    print(f"  empleado@rehabilitar.com /  Empleado123")
    print(f"  kinesio@rehabilitar.com  /  Kinesio123")
    print(f"  abonado@rehabilitar.com  /  Abonado123")
