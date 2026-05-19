from fastapi import APIRouter

router = APIRouter(prefix="/reservations", tags=["Reservas"])


@router.get("/health")
def reservations_module_health():
    return {"module": "reservations", "status": "ready"}
