#Encargado Francis - Modelo de Salas
from sqlalchemy import Column, Integer, String
from database.connection import Base


class Room(Base):
    """
    Espacio físico del centro de kinesiología.
    Las 7 salas son fijas — se crean via seed, no por API.
    El admin no crea ni elimina salas, solo consulta y asigna actividades.
    """
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)   # "Sala 1" … "Sala 7"
    capacity = Column(Integer, nullable=False)                # capacidad máxima física
