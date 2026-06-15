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
    QrCodeRespuesta,
    EscanearQr,
)
from app.services.servicio_asistencias import (
    marcar_asistencia_por_dni,
    actualizar_comentario,
    eliminar_comentario,
    listar_asistencias_por_actividad,
    pregenerar_ausentes,
    generar_qr_asistencia,
    registrar_asistencia_por_qr,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/attendances", tags=["Asistencias"])


# Pre-genera registros 'absent' para todos los inscriptos de la actividad
@router.post("/initialize/{activity_id}")
def inicializar_asistencias(activity_id: int, db: Session = Depends(get_db)):
    return pregenerar_ausentes(activity_id, db)


@router.post("/by-dni", response_model=AsistenciaRespuesta, status_code=201)
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


@router.post("/qr/{activity_id}", response_model=QrCodeRespuesta)
def generar_qr(activity_id: int, token: str, db: Session = Depends(get_db)):
    get_current_user(token, db)
    return generar_qr_asistencia(activity_id, db)


@router.post("/qr/scan", response_model=AsistenciaRespuesta)
def escanear_qr(request: EscanearQr, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    return registrar_asistencia_por_qr(request.code, current_user.id, db)
