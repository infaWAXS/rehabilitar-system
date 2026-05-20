from fastapi import FastAPI

from database.connection import engine, Base
from app.models.user import User

from app.routes.userRoutes import router as user_router
from app.routes import rutas_clientes

app = FastAPI()

Base.metadata.create_all(bind=engine)
app.include_router(user_router)
app.include_router(rutas_clientes.router)

@app.get("/")
def home():
    return {"message": "Backend funcionando"}