# Responsable: Francis - modelo de salas para pruebas
from sqlalchemy import Column, Integer, String
from database.connection import Base

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "fija" o "individual"
