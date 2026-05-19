from fastapi import APIRouter

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/health")
def clients_module_health():
    return {"module": "clients", "status": "ready"}
