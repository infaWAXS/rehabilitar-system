# Responsable: Ezequiel - esquemas de asistencias
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AsistenciaRespuesta(BaseModel):
    id: int
    user_id: int
    activity_id: int
    status: str
    comment: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class AsistenciaConUsuario(BaseModel):
    id: int
    user_id: int
    nombre: str
    apellido: str
    dni: str
    status: str
    comment: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class MarcarAsistenciaPorDNI(BaseModel):
    dni: str
    activity_id: int
    comment: Optional[str] = None


class ActualizarComentario(BaseModel):
    comment: str


class GenerarQRAistenciaRequest(BaseModel):
    activity_id: int


class GenerarQRAistenciaResponse(BaseModel):
    token: str
    activity_id: int
    expires_at: datetime
    qr_payload: str


class RegistrarAsistenciaQRRequest(BaseModel):
    token: str


class EstadoSesionAsistenciaResponse(BaseModel):
    activity_id: int
    session_active: bool
    status: str
    restrictions_enforced: bool
