from fastapi import APIRouter

router = APIRouter(prefix="/payments", tags=["Pagos"])


@router.get("/health")
def payments_module_health():
    return {"module": "payments", "status": "ready"}
