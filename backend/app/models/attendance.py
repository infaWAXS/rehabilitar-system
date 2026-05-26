# Responsable: Ezequiel - modelo de asistencias
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database.connection import Base


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")
    comment = Column(String, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="attendances")
    activity = relationship("Activity", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("user_id", "activity_id", name="uix_user_activity"),
        CheckConstraint("status IN ('pending', 'present', 'absent')", name="check_status_valid"),
    )
