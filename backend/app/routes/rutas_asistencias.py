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
    EstadoSesionAsistenciaResponse,
)
from app.services.servicio_asistencias import (
    marcar_asistencia_por_dni,
    actualizar_comentario,
    eliminar_comentario,
    listar_asistencias_por_actividad,
    pregenerar_ausentes,
    finalizar_asistencias,
    generar_qr_asistencia,
    registrar_asistencia_por_qr,
    obtener_estado_sesion_asistencia,
)
from app.utils.dependencies import get_current_user
from app.exceptions.http_exceptions import forbidden_exception

router = APIRouter(prefix="/attendances", tags=["Asistencias"])


# Pre-genera registros 'absent' para todos los inscriptos de la actividad
@router.post("/initialize/{activity_id}")
def inicializar_asistencias(activity_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    if current_user.role != "professor":
        raise forbidden_exception()
    return pregenerar_ausentes(activity_id, db)


# Finaliza la clase: registra las inasistencias definitivas y evalúa la suspensión
# automática por asistencia (más de 3 faltas o menos del 50% mensual).
@router.post("/finalize/{activity_id}")
def finalizar_clase_asistencias(activity_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    if current_user.role != "professor":
        raise forbidden_exception()
    return finalizar_asistencias(activity_id, db)


@router.post("/by-dni", response_model=AsistenciaRespuesta, status_code=201)
def registrar_asistencia(request: MarcarAsistenciaPorDNI, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    if current_user.role != "professor":
        raise forbidden_exception()
    return marcar_asistencia_por_dni(request.dni, request.activity_id, request.comment, db)


@router.get("/by-activity/{activity_id}", response_model=List[AsistenciaConUsuario])
def listar_por_actividad(activity_id: int, db: Session = Depends(get_db)):
    return listar_asistencias_por_actividad(activity_id, db)


@router.patch("/{attendance_id}/comment", response_model=AsistenciaRespuesta)
def modificar_comentario(attendance_id: int, request: ActualizarComentario, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    if current_user.role != "professor":
        raise forbidden_exception()
    return actualizar_comentario(attendance_id, request.comment, db)


@router.delete("/{attendance_id}/comment", response_model=AsistenciaRespuesta)
def borrar_comentario(attendance_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    if current_user.role != "professor":
        raise forbidden_exception()
    return eliminar_comentario(attendance_id, db)

@router.get("/session-status/{activity_id}", response_model=EstadoSesionAsistenciaResponse)
def estado_sesion(activity_id: int, db: Session = Depends(get_db)):
    return obtener_estado_sesion_asistencia(activity_id, db)


@router.post("/qr/scan", response_model=AsistenciaRespuesta)
def escanear_qr(request: EscanearQr, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    return registrar_asistencia_por_qr(request.code, current_user, db)


@router.post("/qr/{activity_id}", response_model=QrCodeRespuesta)
def generar_qr(activity_id: int, token: str, db: Session = Depends(get_db)):
    current_user = get_current_user(token, db)
    return generar_qr_asistencia(activity_id, current_user, db)
