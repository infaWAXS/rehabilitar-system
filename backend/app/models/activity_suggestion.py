from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base


class ActivitySuggestion(Base):
    """
    Sugerencia de actividad creada por un profesor.
    Queda pendiente hasta que un admin la acepta (se convierte en Activity)
    o la rechaza.
    """
    __tablename__ = "activity_suggestions"

    id = Column(Integer, primary_key=True)

    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    specialization = Column(String(120), nullable=False)   # "tren superior"
    activity_type = Column(String(20), nullable=False)     # "fixed" | "individual"
    schedule = Column(String(200), nullable=True)           # clases fijas: "Lunes · 15:00-16:00"
    specific_date = Column(Date, nullable=True)              # clases individuales
    time_slot = Column(String(10), nullable=True)            # clases individuales: "15:00"
    capacity = Column(Integer, nullable=False)
    description = Column(String(500), nullable=True)
    requirements = Column(String(300), nullable=True)

    status = Column(String(20), nullable=False, default="pending")  # pending | accepted | rejected
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint("activity_type IN ('fixed', 'individual')", name="chk_suggestion_type"),
        CheckConstraint("status IN ('pending', 'accepted', 'rejected')", name="chk_suggestion_status"),
        CheckConstraint("capacity > 0", name="chk_suggestion_capacity"),
    )

    professor = relationship("User")
    room = relationship("Room")