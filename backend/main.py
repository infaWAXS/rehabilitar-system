from fastapi import FastAPI

from database.connection import engine, Base
from app.models.user import User

from app.routes.userRoutes import router as user_router

app = FastAPI()

Base.metadata.create_all(bind=engine)
app.include_router(user_router)

@app.get("/")
def home():
    return {"message": "Backend funcionando"}