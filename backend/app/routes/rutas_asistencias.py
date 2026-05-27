# Responsable: Ezequiel - endpoints de asistencias
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from app.schemas.esquema_asistencias import (
    AsistenciaRespuesta,
    AsistenciaConUsuario,
    MarcarAsistenciaPorDNI,
    ActualizarComentario,
)
from app.services.servicio_asistencias import (
    marcar_asistencia_por_dni,
    actualizar_comentario,
    eliminar_comentario,
    listar_asistencias_por_actividad,
    pregenerar_ausentes,
)

router = APIRouter(prefix="/attendances", tags=["Asistencias"])


# Pre-genera registros 'absent' para todos los inscriptos de la actividad
@router.post("/initialize/{activity_id}")
def inicializar_asistencias(activity_id: int, db: Session = Depends(get_db)):
    return pregenerar_ausentes(activity_id, db)

 response_model=AsistenciaRespuesta, status_code=201)
def registrar_asistencia(request: MarcarAsistenciaPorDNI, db: Session = Depends(get_db)):
    return marcar_asistencia_por_dni(request.dni, request.activity_id, request.comment, db)


@router.get("/by-activity/{activity_id}", response_model=List[AsistenciaConUsuario])
def listar_por_actividad(activity_id: int, db: Session = Depends(get_db)):
    return listar_asistencias_por_actividad(activity_id, db)


@router.patch("/{attendance_id}/comment", response_model=AsistenciaRespuesta)
def modificar_comentario(attendance_id: int, request: ActualizarComentario, db: Session = Depends(get_db)):
    return actualizar_comentario(attendance_id, request.comment, db)


@router.delete("/{attendance_id}/comment", response_model=AsistenciaRespuesta)
def borrar_comentario(attendance_id: int, db: Session = Depends(get_db)):
    return eliminar_comentario(attendance_id, db)
