from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from database.connection import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user, require_role

# Importamos AMBOS servicios
from app.services.servicio_reportes import generar_reporte_estadistico_service
from app.services.servicio_repfinanzas import generar_reporte_financiero_service

router = APIRouter(
    prefix="/api/reports",
    tags=["Reportes"]
)

# 1. Endpoint Original (Sigue alimentando al Hub y a Clientes)
@router.get("/statistics")
def get_reporte_estadistico(
    fecha_inicio: date = Query(..., description="Fecha de inicio del reporte (YYYY-MM-DD)"),
    fecha_fin: date = Query(..., description="Fecha de fin del reporte (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if fecha_inicio > fecha_fin:
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser posterior a la fecha de fin")
        
    return generar_reporte_estadistico_service(db, fecha_inicio, fecha_fin)

# 2. NUEVO Endpoint Exclusivo para Finanzas
@router.get("/finances")
def get_reporte_financiero(
    fecha_inicio: date = Query(..., description="Fecha de inicio del reporte (YYYY-MM-DD)"),
    fecha_fin: date = Query(..., description="Fecha de fin del reporte (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if fecha_inicio > fecha_fin:
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser posterior a la fecha de fin")
        
    return generar_reporte_financiero_service(db, fecha_inicio, fecha_fin)

    