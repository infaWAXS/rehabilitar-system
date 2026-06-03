# Responsable legacy: Francis + Agustin - modulo de usuarios y autenticacion.
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base



class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    lastname = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    dni = Column(String, nullable=True)           # Número DNI
    dni_photo_path = Column(String, nullable=True) # Ruta foto DNI subida - validación pendiente por sistema externo
    direccion = Column(String, nullable=True)
    telefono  = Column(String, nullable=True)
    role = Column(String, nullable=False, default="client")
    specialization = Column(String, nullable=True)
    account_status = Column(String, nullable=False, default="active")
    dni_verified = Column(Boolean, default=False)
    medical_certificate_path = Column(String, nullable=True)
    medical_certificate_status = Column(String, default="none")
    failed_login_attempts = Column(Integer, default=0)
    credits = Column(Integer, nullable=False, default=0, server_default='0')
    pending_discount_percent = Column(Integer, nullable=False, default=0, server_default='0')
    created_at = Column(DateTime, server_default=func.now())
    birth_date = Column(Date, nullable=False)

    attendances = relationship("Attendance", back_populates="user")
    user_plans = relationship("UserPlan", back_populates="user")