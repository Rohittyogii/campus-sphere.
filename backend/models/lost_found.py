"""
Campus Sphere — Lost & Found Model
====================================
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database.base import Base


class LostFoundItem(Base):
    """Represents a lost or found item posted by a student."""
    __tablename__ = "lost_found_items"

    id = Column(Integer, primary_key=True, index=True)
    posted_by = Column(Integer, ForeignKey("students.id"), nullable=False)
    item_type = Column(String(20), nullable=False)  # "lost" or "found"
    title = Column(String(300), nullable=False)
    description = Column(Text)
    category = Column(String(100))          # "Electronics", "Documents", "Personal"
    location_found = Column(String(200))
    image_url = Column(String(500))
    contact_info = Column(String(200))
    status = Column(String(20), default="open")  # "open", "claimed", "resolved"
    admin_approved = Column(String(20), default="pending")  # "pending", "approved", "rejected"

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<LostFoundItem {self.title} — {self.status}>"
