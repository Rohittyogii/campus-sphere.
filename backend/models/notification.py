"""
Campus Sphere — Notification Model
==================================
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from backend.database.base import Base


class Notification(Base):
    """Represents a system or community notification for a student."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notif_type = Column(String(50), default="General")  # e.g. "Community", "Academic", "Event"
    is_read = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Notification {self.id} for Student {self.student_id}>"
