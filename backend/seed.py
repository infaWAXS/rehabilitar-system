# Responsable: Nahuel - Script para modificar usuarios existentes en pruebas locales
import os
import sys

# 1. Forzar a Python a reconocer la carpeta raíz del backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 🌟 TRUCO REAL: Importamos el objeto FastAPI desde main. 
# Esto obliga a que se ejecute TODO el archivo main.py de la banda, 
# el cual importa automáticamente cada una de las rutas y modelos de todo el sistema
# en el orden exacto que requiere SQLAlchemy.
from main import app

# 2. Ahora traemos los conectores y el modelo limpios
from database.connection import SessionLocal, engine, Base
from app.models.user import User

# ... el resto de tu función crear_usuario() queda exactamente igual ...

# 🌟 EL PARCHE OBLIGATORIO MEJORADO: Importamos absolutamente todos los modelos
# en el orden en que SQLAlchemy los necesita para que no falle por nombres ausentes.
try:
    from app.models.attendance import Attendance
    from app.models.user_plan import UserPlan  # O como se llame el archivo de planes de usuario
except ImportError:
    # Si no encontrás los archivos sueltos, 'import main' se encarga del resto
    import main

# Ahora sí, traemos el modelo User con la cancha ya marcada
from app.models.user import User

def crear_usuario():
    db = SessionLocal()
    try:
        # Buscamos si ya existe para no duplicar por el email único
        existe = db.query(User).filter(User.email == "juan@cliente.com").first()
        if existe:
            print("El usuario ya existía en la base de datos.")
            return

        # Creamos el usuario respetando la estructura completa de user.py
        usuario = User(
            name="Juan",
            lastname="Perez",
            email="juan@cliente.com",
            password="password123", # Recordá usar hash si ya implementaron hashing de contraseñas
            role="client",
            account_status="active",
            dni="12345678",
            direccion="Calle Falsa 123",
            telefono="2211234567",
            medical_certificate_status="none",
            credits=0,
            pending_discount_percent=0
        )
        
        db.add(usuario)
        db.commit()
        print("¡¡USUARIO JUAN PEREZ CREADO CON ÉXITO EN DATABASE.DB!!")
    except Exception as e:
        db.rollback()
        print(f"Hubo un error al guardar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Creamos las tablas físicas en database.db si por alguna razón no existían
    Base.metadata.create_all(bind=engine)
    
    # Corremos la inyección
    crear_usuario()