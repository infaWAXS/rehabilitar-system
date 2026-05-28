# # Responsable legacy: Francis y Agustin - integracion inicial del backend.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database.connection import engine, Base, get_db
from app.models.user import User
from app.models.reservation import Reservation
from app.models.waitlist import Waitlist
from app.models.room import Room
from app.models.activity import Activity
from app.models.attendance import Attendance

from app.routes.rutas_autenticacion import router as auth_router
from app.routes.rutas_usuarios import router as user_router
from app.routes.rutas_clientes import router as client_router
from app.routes.rutas_actividades import router as activity_router
from app.routes.rutas_salas import router as room_router
from app.routes.rutas_reservas import router as reservation_router
from app.routes.rutas_lista_espera import router as waitlist_router
from app.routes.rutas_asistencias import router as attendance_router
from app.routes.rutas_pagos import router as payment_router
from database.seed_mock import seed as seed_mock_users

app = FastAPI()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Permitir peticiones desde el frontend en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Cargar usuarios mock al arrancar (sólo crea los que no existen)
seed_mock_users()
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(user_router)
app.include_router(client_router)
app.include_router(room_router)
app.include_router(activity_router)
app.include_router(reservation_router)
app.include_router(waitlist_router)
app.include_router(attendance_router)
app.include_router(payment_router)

@app.get("/")
def home():
    return {"message": "Backend funcionando"}

