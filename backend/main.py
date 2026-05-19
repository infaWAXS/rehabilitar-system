# # Responsable legacy: Francis y Agustin - integracion inicial del backend.
from fastapi import FastAPI

from database.connection import engine, Base
from app.models.user import User

from app.routes.authRoutes import router as auth_router
from app.routes.userRoutes import router as user_router
from app.routes.clientRoutes import router as client_router
from app.routes.activityRoutes import router as activity_router
from app.routes.reservationRoutes import router as reservation_router
from app.routes.waitlistRoutes import router as waitlist_router
from app.routes.attendanceRoutes import router as attendance_router
from app.routes.paymentRoutes import router as payment_router

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