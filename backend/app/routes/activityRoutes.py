from fastapi import APIRouter

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("/health")
def activities_module_health():
    return {"module": "activities", "status": "ready"}
