from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from typing import List
from datetime import datetime
from app.schemas.esquema_auditoria import AuditLogResponse
from app.models.audit_log import AuditAction, AuditResult, AuditType
from app.services.servicio_auditoria import get_audit_logs
from app.utils.dependencies import require_role, get_current_user

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/", response_model=List[AuditLogResponse])
def listar_auditoria(
    token: str,
    db: Session = Depends(get_db),
    search: str = None,
    type: AuditType = None,
    action: AuditAction = None,
    date_from: datetime = None,
    date_to: datetime = None,
    result: AuditResult = None,
):
    current_user = get_current_user(token, db)
    require_role(["admin"])(current_user)
    return get_audit_logs(db, search, type, action, date_from, date_to, result)