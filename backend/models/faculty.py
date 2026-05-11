"""
Campus Sphere — Faculty Model
================================
Based on: Faculty.xlsx (36 rows)
Columns: facultyid, faculty_name, email_id, department
"""

from sqlalchemy import Column, Integer, String
from backend.database.base import Base


class Faculty(Base):
    """Represents a faculty member — maps to Faculty.xlsx"""
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    facultyid = Column(String(30), unique=True, nullable=False)
    faculty_name = Column(String(200), nullable=False)
    email_id = Column(String(255))
    department = Column(String(100))

    def __repr__(self):
        return f"<Faculty {self.facultyid} — {self.faculty_name}>"
