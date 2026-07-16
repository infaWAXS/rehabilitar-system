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
from app.models.activity_suggestion import ActivitySuggestion
from app.models.attendance import Attendance
from app.models.attendance_qr import AttendanceQrCode
from app.models.plan import Plan
from app.models.user_plan import UserPlan
from app.models.notification import Notification
from app.models.credit_transaction import CreditTransaction

from app.routes.rutas_autenticacion import router as auth_router
from app.routes.rutas_usuarios import router as user_router
from app.routes.rutas_clientes import router as client_router
from app.routes.rutas_actividades import router as activity_router
from app.routes.rutas_salas import router as room_router
from app.routes.rutas_reservas import router as reservation_router
from app.routes.rutas_lista_espera import router as waitlist_router
from app.routes.rutas_asistencias import router as attendance_router
from app.routes.rutas_pagos import router as payment_router
from app.routes.rutas_notificaciones import router as notification_router
from app.routes.rutas_sugerencias import router as suggestion_router
from app.routes.rutas_auditoria import router as audit_router
from database.seed_mock import seed as seed_mock_users
from app.routes.rutas_reportes import router as reportes_router

from seed_estadisticas import seed_estadisticas #para mockear estadisticas
from seed_auditoria_clientes import seed_auditoria_clientes



app = FastAPI()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Permitir peticiones desde el frontend en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\..+|192\.168\..+|172\.(1[6-9]|2\d|3[0-1])\..+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Migración ligera: agrega columnas nuevas si la BD ya existía antes de agregarlas al modelo
def _migrate(engine):
    from sqlalchemy import text
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(users)"))]
        if "notifications_enabled" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT 1"))
            conn.commit()
        notif_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(notifications)"))]
        if "link" not in notif_cols:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN link TEXT"))
            conn.commit()
        reservation_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(reservations)"))]
        if "deposit_percent" not in reservation_cols:
            conn.execute(text("ALTER TABLE reservations ADD COLUMN deposit_percent INTEGER"))
            conn.commit()
        if "cancellation_result" not in reservation_cols:
            conn.execute(text("ALTER TABLE reservations ADD COLUMN cancellation_result TEXT"))
            conn.commit()
        if "user_plan_id" not in reservation_cols:
            conn.execute(text("ALTER TABLE reservations ADD COLUMN user_plan_id INTEGER"))
            conn.commit()
        if "is_deleted" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0"))
            conn.commit()
        if "deleted_at" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN deleted_at DATETIME"))
            conn.commit()
        if "deleted_by" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN deleted_by INTEGER"))
            conn.commit()
        if "suspension_reason" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN suspension_reason TEXT"))
            conn.commit()

_migrate(engine)

# Cargar usuarios mock al arrancar (sólo crea los que no existen)
seed_mock_users()

#CARGAR DATA PARA ESTADISTICAS
from database.connection import SessionLocal
db_test = SessionLocal()
try:
    # Validamos si ya hay asistencias creadas para no duplicar datos infinitamente
    if db_test.query(Attendance).count() == 0:
        seed_estadisticas(db_test)
        seed_auditoria_clientes(db_test) 
finally:
    db_test.close()

# Tarea programada: cancela clases sin profesor asignado a <= 12 hs de su inicio
# y otorga un crédito al abonado afectado.
from apscheduler.schedulers.background import BackgroundScheduler
from database.connection import SessionLocal
from app.services.servicio_auto_cancelacion import auto_cancel_unstaffed_classes


from app.services.servicio_reintegros import refund_expired_waitlist_entries


def _run_auto_cancel_job():
    db = SessionLocal()
    try:
        auto_cancel_unstaffed_classes(db)
    finally:
        db.close()


# Tarea programada: cierra las entradas de lista de espera cuya clase ya pasó y
# reintegra a quien había pagado su lugar en la cola sin que le tocara el cupo.
def _run_waitlist_refund_job():
    db = SessionLocal()
    try:
        refund_expired_waitlist_entries(db)
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(_run_auto_cancel_job, "interval", minutes=15)
scheduler.add_job(_run_waitlist_refund_job, "interval", minutes=15)
scheduler.start()

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(user_router)
app.include_router(client_router)
app.include_router(room_router)
app.include_router(activity_router)
app.include_router(reservation_router)
app.include_router(waitlist_router)
app.include_router(attendance_router)
app.include_router(payment_router)
app.include_router(notification_router)
app.include_router(suggestion_router)
app.include_router(audit_router)
app.include_router(reportes_router)

@app.get("/")
def home():
    return {"message": "Backend funcionando"}