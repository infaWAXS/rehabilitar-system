from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class UserSuspension(Base):
    __tablename__ = "user_suspensions"

    # CORREGIDO: primary_key en lugar de primary key
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 1. Datos de la suspensión
    suspension_date = Column(DateTime, default=func.now(), nullable=False)
    suspension_reason = Column(String, nullable=False) 
    
    # 2. Estado actual de esta sanción
    is_active = Column(Boolean, default=True, nullable=False) 
    
    # 3. Datos del reintegro (Opcionales)
    reinstatement_date = Column(DateTime, nullable=True)
    reinstatement_reason = Column(String, nullable=True)

    # Relación para acceder a los datos del cliente fácilmente
    user = relationship("User", backref="suspensions")