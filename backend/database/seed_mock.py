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
    db = SessionLocal()
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
            "name": "Plan Mensual Básico",
            "description": "Acceso a 2 clases fijas por semana.",
            "price": 15000,
            "duration_days": 30,
            "coverage_type": "2 clases/semana",
        },
        {
            "name": "Plan Mensual Completo",
            "description": "Acceso ilimitado a todas las actividades del mes.",
            "price": 25000,
            "duration_days": 30,
            "coverage_type": "Acceso ilimitado",
        },
        {
            "name": "Plan Trimestral",
            "description": "Acceso ilimitado por 3 meses con descuento.",
            "price": 65000,
            "duration_days": 90,
            "coverage_type": "Acceso ilimitado",
        },
        {
            "name": "Plan Semestral",
            "description": "Acceso ilimitado por 6 meses, el plan de mayor ahorro.",
            "price": 110000,
            "duration_days": 180,
            "coverage_type": "Acceso ilimitado",
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
        plan_completo = db.query(Plan).filter(Plan.name == "Plan Mensual Completo").first()
        if usuario_abonado and plan_completo:
            ya_tiene_plan = db.query(UserPlan).filter(
                UserPlan.user_id == usuario_abonado.id,
                UserPlan.status == "active",
            ).first()
            if not ya_tiene_plan:
                hoy = date.today()
                db.add(UserPlan(
                    user_id=usuario_abonado.id,
                    plan_id=plan_completo.id,
                    start_date=hoy,
                    end_date=hoy + timedelta(days=plan_completo.duration_days),
                    status="active",
                ))
                db.commit()
                print("[seed_mock] UserPlan abonado@rehabilitar.com → Plan Mensual Completo creado.")
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
