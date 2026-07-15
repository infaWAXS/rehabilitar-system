from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from database.connection import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user, require_role

# Importamos TODOS los servicios
from app.services.reportes.servicio_reportes import generar_reporte_estadistico_service
from app.services.reportes.servicio_repfinanzas import generar_reporte_financiero_service
from app.services.reportes.servicio_repclientes import generar_reporte_clientes_service
from app.services.reportes.servicio_repsalas import generar_reporte_salas_service
from app.services.reportes.servicio_repstaff import generar_reporte_staff_service
from app.services.reportes.servicio_rephub import generar_reporte_hub_service

router = APIRouter(
    prefix="/api/reports",
    tags=["Reportes"]
)

# 1. Endpoint Original (Intacto, por si otros módulos lo siguen usando)
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

# 🌟 NUEVO: Endpoint Exclusivo para el HUB
@router.get("/hub")
def get_reporte_hub(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if fecha_inicio > fecha_fin:
        raise HTTPException(status_code=400, detail="Fecha inválida")
    return generar_reporte_hub_service(db, fecha_inicio, fecha_fin)


# ... (El resto de tus endpoints se mantienen exactamente igual)
@router.get("/finances")
def get_reporte_financiero(fecha_inicio: date = Query(...), fecha_fin: date = Query(...), db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    return generar_reporte_financiero_service(db, fecha_inicio, fecha_fin)

@router.get("/clients")
def get_reporte_clientes(fecha_inicio: date = Query(...), fecha_fin: date = Query(...), db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    return generar_reporte_clientes_service(db, fecha_inicio, fecha_fin)

@router.get("/staff")
def get_reporte_staff(fecha_inicio: date = Query(...), fecha_fin: date = Query(...), db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    return generar_reporte_staff_service(db, fecha_inicio, fecha_fin)

@router.get("/rooms")
def get_reporte_salas(fecha_inicio: date = Query(...), fecha_fin: date = Query(...), db: Session = Depends(get_db)):
    return generar_reporte_salas_service(db, fecha_inicio, fecha_fin)