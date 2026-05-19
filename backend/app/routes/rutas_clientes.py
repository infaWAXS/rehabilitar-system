from fastapi import APIRouter

router = APIRouter(prefix="/clients", tags=["Clientes"])


@router.get("/health")
def clients_module_health():
    return {"module": "clients", "status": "ready"}
