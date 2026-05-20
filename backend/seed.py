# backend/seed.py
from database.connection import SessionLocal
from app.models.user import User

def crear_usuario():
    try:
        db = SessionLocal()
        # Buscamos si ya existe para no duplicar por el email único
        existe = db.query(User).filter(User.email == "juan@cliente.com").first()
        if existe:
            print("El usuario ya existía en la base de datos.")
            return

        usuario = User(
            name="Juan",
            lastname="Perez",
            email="juan@cliente.com",
            password="password123",
            role="client",
            account_status="active"
        )
        db.add(usuario)
        db.commit()
        print("¡¡USUARIO JUAN PEREZ CREADO CON ÉXITO EN DATABASE.DB!!")
    except Exception as e:
        print(f"Hubo un error al guardar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    crear_usuario()

    #modificar base de datos sin endpoints