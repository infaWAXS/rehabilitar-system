from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database.connection import Base


class User(Base):
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    lastname = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    dni = Column(String, nullable=False)
    role = Column(String, nullable=False, default="client")
    account_status = Column(String, nullable=False, default="active")
    dni_verified = Column(Boolean, default=False)
    physical_clearance_status = Column(String, default="none")
    failed_login_attempts = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())