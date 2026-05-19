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

import sys
import os

# Asegura que el directorio raíz del backend esté en el path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import SessionLocal, engine, Base
from app.models.user import User
from app.utils.security import hash_password

# Importar todos los modelos para que Base cree las tablas si no existen
import app.models.reservation  # noqa
import app.models.waitlist      # noqa

USUARIOS_MOCK = [
    {
        "name": "Super",
        "lastname": "Admin",
        "email": "admin@rehabilitar.com",
        "password": "Admin123",
        "role": "admin",
        "dni": "11111111",
    },
    {
        "name": "Carlos",
        "lastname": "Cliente",
        "email": "cliente@rehabilitar.com",
        "password": "Cliente123",
        "role": "client",
        "dni": "22222222",
    },
    {
        "name": "Laura",
        "lastname": "Recepcion",
        "email": "empleado@rehabilitar.com",
        "password": "Empleado123",
        "role": "receptionist",
        "dni": "33333333",
    },
    {
        "name": "Marcos",
        "lastname": "Profesor",
        "email": "profesor@rehabilitar.com",
        "password": "Profesor123",
        "role": "professor",
        "dni": "44444444",
        "specialization": "Kinesiología deportiva",
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


if __name__ == "__main__":
    seed()
    print("\nCredenciales de acceso:")
    print(f"  admin@rehabilitar.com    /  Admin123")
    print(f"  cliente@rehabilitar.com  /  Cliente123")
    print(f"  empleado@rehabilitar.com /  Empleado123")
    print(f"  kinesio@rehabilitar.com  /  Kinesio123")
