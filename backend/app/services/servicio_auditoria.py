from sqlalchemy.orm import Session
from app.models.audit_log import AuditType, AuditLog, AuditAction, AuditResult
from datetime import datetime, timezone, timedelta
from typing import List

def register_audit(
    db: Session,
    user_id: int,
    type: AuditType,
    action: AuditAction,
    result: AuditResult,
    detail: str
) -> AuditLog:
    
    audit = AuditLog(
        user_id=user_id,
        type=type,
        action=action,
        result=result,
        detail=detail
    )

    db.add(audit)
    return audit

def get_audit_logs(db: Session, search: str = None, type: AuditType = None, action: AuditAction = None, date_from: datetime = None, date_to: datetime = None, result: AuditResult = None) -> List[AuditLog]:
    query = db.query(AuditLog)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(AuditLog.detail.ilike(search_pattern))

    if type:
        query = query.filter(AuditLog.type == type)

    if action:
        query = query.filter(AuditLog.action == action)

    if date_from:
        query = query.filter(AuditLog.timestamp >= date_from)

    if date_to:
        query = query.filter(AuditLog.timestamp < date_to + timedelta(days=1))

    if result:
        query = query.filter(AuditLog.result == result)

    logs = query.order_by(AuditLog.timestamp.desc()).all()

    for log in logs:
        if log.timestamp.tzinfo is None:
            log.timestamp = log.timestamp.replace(tzinfo=timezone.utc)

    return logs