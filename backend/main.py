# # Responsable legacy: Francis y Agustin - integracion inicial del backend.
from fastapi import FastAPI

from database.connection import engine, Base
from app.models.user import User
from app.models.reservation import Reservation
from app.models.waitlist import Waitlist

from app.routes.rutas_autenticacion import router as auth_router
from app.routes.rutas_usuarios import router as user_router
from app.routes.rutas_clientes import router as client_router
from app.routes.rutas_actividades import router as activity_router
from app.routes.rutas_reservas import router as reservation_router
from app.routes.rutas_lista_espera import router as waitlist_router
from app.routes.rutas_asistencias import router as attendance_router
from app.routes.rutas_pagos import router as payment_router

app = FastAPI()

Base.metadata.create_all(bind=engine)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(client_router)
app.include_router(activity_router)
app.include_router(reservation_router)
app.include_router(waitlist_router)
app.include_router(attendance_router)
app.include_router(payment_router)

@app.get("/")
def home():
    return {"message": "Backend funcionando"}