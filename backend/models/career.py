"""
Campus Sphere — Career Objective Model
========================================
Based on: Career_Objective.xlsx (30 rows)
Columns: career_id, career_objective, specialization_focus, description,
          key_skills, preferred_learning_mode, growth_index, related_roles
"""

from sqlalchemy import Column, Integer, String, Text, Float
from backend.database.base import Base


class CareerObjective(Base):
    """Represents a career objective — maps to Career_Objective.xlsx"""
    __tablename__ = "career_objectives"

    id = Column(Integer, primary_key=True, index=True)
    career_id = Column(String(50), unique=True)
    career_objective = Column(String(500), nullable=False)
    specialization_focus = Column(String(200))
    description = Column(Text)
    key_skills = Column(Text)
    preferred_learning_mode = Column(String(100))
    growth_index = Column(Float)
    related_roles = Column(Text)

    def __repr__(self):
        return f"<CareerObjective {self.career_objective}>"
