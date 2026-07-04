from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database.connection import Base

from enum import Enum

class AuditType(Enum):
    ACCOUNT = "ACCOUNT"
    ACTIVITY = "ACTIVITY"
    PAYMENT = "PAYMENT"

class AuditAction(Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    RESET_PASSWORD = "RESET_PASSWORD"
    SUSPEND_ACCOUNT = "SUSPEND_ACCOUNT"
    REINTEGRATE_ACCOUNT = "REINTEGRATE_ACCOUNT"
    DENY_REINTEGRATION = "DENY_REINTEGRATION"
    UPDATE_MEDICAL_CERTIFICATE = "UPDATE_MEDICAL_CERTIFICATE"
    SUGGEST_ACTIVITY = "SUGGEST_ACTIVITY"
    APPROVE_SUGGESTION = "APPROVE_SUGGESTION"
    REJECT_SUGGESTION = "REJECT_SUGGESTION"
    CLAIM_ACTIVITY = "CLAIM_ACTIVITY"
    RESIGN_ACTIVITY = "RESIGN_ACTIVITY"
    SUBSCRIPTION = "SUBSCRIPTION"
    INDIVIDUAL = "INDIVIDUAL"
    REFUND = "REFUND"

class AuditResult(Enum):
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SqlEnum(AuditType), nullable=False)
    action = Column(SqlEnum(AuditAction), nullable=False)
    result = Column(SqlEnum(AuditResult), nullable=False)
    detail = Column(String, nullable=True)

    user = relationship("User", backref="audit_logs")