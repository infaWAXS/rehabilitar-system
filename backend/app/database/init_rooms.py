# Script para inicializar salas en la base de datos
from sqlalchemy.orm import sessionmaker
from database.connection import engine
from app.models.room import Room

Session = sessionmaker(bind=engine)
session = Session()

# 4 salas fijas
rooms = [
    Room(name="Sala Fija 1", type="fija"),
    Room(name="Sala Fija 2", type="fija"),
    Room(name="Sala Fija 3", type="fija"),
    Room(name="Sala Fija 4", type="fija"),
    # 2 salas individuales
    Room(name="Sala Individual 1", type="individual"),
    Room(name="Sala Individual 2", type="individual"),
]

for room in rooms:
    exists = session.query(Room).filter_by(name=room.name).first()
    if not exists:
        session.add(room)

session.commit()
session.close()
