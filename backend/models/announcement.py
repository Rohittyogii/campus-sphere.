from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from backend.database.base import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String(50), default="info") # info, warning, success
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Announcement {self.title}>"
