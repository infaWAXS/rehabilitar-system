from fastapi import APIRouter

router = APIRouter(prefix="/attendances", tags=["Asistencias"])


@router.get("/health")
def attendances_module_health():
    return {"module": "attendances", "status": "ready"}
