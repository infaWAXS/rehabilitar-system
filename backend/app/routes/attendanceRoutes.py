from fastapi import APIRouter

router = APIRouter(prefix="/attendances", tags=["Attendances"])


@router.get("/health")
def attendances_module_health():
    return {"module": "attendances", "status": "ready"}
