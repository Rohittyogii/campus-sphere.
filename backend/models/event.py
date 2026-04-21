"""
Campus Sphere — Event & Hackathon Models
==========================================
Based on: Events.xlsx (179 rows) — eventid, event_name, date, department
Based on: Hackathon_Dataset.xlsx (14 rows) — hackathon_id, hackathon_name,
           organizer, registration_deadline, link, eligibility, recommended_for
"""

from sqlalchemy import Column, Integer, String, Text, Date
from backend.database.base import Base


class Event(Base):
    """Represents a campus event — maps to Events.xlsx"""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    eventid = Column(String(50), unique=True)
    event_name = Column(String(500), nullable=False)
    date = Column(String(100))  # Stored as string since Excel dates vary
    department = Column(String(200))

    def __repr__(self):
        return f"<Event {self.event_name}>"


class Hackathon(Base):
    """Represents a hackathon — maps to Hackathon_Dataset.xlsx"""
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, index=True)
    hackathon_id = Column(String(50), unique=True)
    hackathon_name = Column(String(500), nullable=False)
    organizer = Column(String(300))
    registration_deadline = Column(String(100))
    link = Column(String(500))
    eligibility = Column(Text)
    recommended_for = Column(Text)

    def __repr__(self):
        return f"<Hackathon {self.hackathon_name}>"
