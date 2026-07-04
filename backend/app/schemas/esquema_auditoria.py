from pydantic import BaseModel
from datetime import datetime
from app.models.audit_log import AuditAction, AuditResult, AuditType

class AuditUser(BaseModel):
    id: int
    name: str
    lastname: str

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    user: AuditUser
    type: AuditType
    action: AuditAction
    result: AuditResult
    detail: str | None

    class Config:
        from_attributes = True

