from fastapi import APIRouter

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


@router.get("/health")
def waitlist_module_health():
    return {"module": "waitlist", "status": "ready"}
