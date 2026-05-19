from fastapi import APIRouter

router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.get("/health")
def reservations_module_health():
    return {"module": "reservations", "status": "ready"}
