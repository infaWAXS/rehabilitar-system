from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, CheckConstraint, Date
from sqlalchemy.orm import relationship
from database.connection import Base


class Activity(Base):
    """
    Clase/actividad programada en una sala.
    El admin crea, edita y cancela actividades.
    Una sala puede tener varias actividades en distintos horarios.
    """
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True)

    # Sala física donde se dicta la actividad
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    # ── Datos de la clase ──────────────────────────────────────────────────────
    name = Column(String(120), nullable=False)           # "Yoga Terapéutico", etc.
    specialization = Column(String(120), nullable=False)  # ej: "Kinesiología deportiva"
    activity_type = Column(String(20), nullable=False)   # "fixed" | "individual"
    schedule = Column(String(200), nullable=True)         # "Lunes, Miércoles · 09:00–10:00" (clases fijas)
    specific_date = Column(Date, nullable=True)           # fecha puntual (solo clases individuales)
    time_slot = Column(String(10), nullable=True)         # "15:00" (hora del turno individual)
    professor = Column(String(120), nullable=True)        # nombre del kinesiólogo (opcional para clases individuales)
    price = Column(Numeric(10, 2), nullable=False)
    capacity = Column(Integer, nullable=False)            # cupos ofrecidos (≤ Room.capacity)
    description = Column(String(500), nullable=True)
    requirements = Column(String(300), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # "active" | "cancelled"

    __table_args__ = (
        CheckConstraint("activity_type IN ('fixed', 'individual')", name="chk_activity_type"),
        CheckConstraint("status IN ('active', 'cancelled')", name="chk_activity_status"),
        CheckConstraint("capacity > 0", name="chk_activity_capacity"),
    )

    room = relationship("Room", backref="activities")
