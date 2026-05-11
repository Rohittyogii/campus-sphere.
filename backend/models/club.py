"""
Campus Sphere — Club Model
============================
Based on: Club_Dataset.xlsx (49 rows)
Columns: clubid, club_name, description
"""

from sqlalchemy import Column, Integer, String, Text
from backend.database.base import Base


class Club(Base):
    """Represents a campus club — maps to Club_Dataset.xlsx"""
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    clubid = Column(String(50), unique=True)
    club_name = Column(String(300), nullable=False)
    description = Column(Text)

    def __repr__(self):
        return f"<Club {self.club_name}>"
