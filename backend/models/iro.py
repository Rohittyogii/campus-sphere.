"""
Campus Sphere — IRO (International Relations) Model
=====================================================
Based on: ncu_international_relations_sections_columns.csv (103 rows)
Columns: About IRO, Main Objectives, Global Partners, Global Learning Pathways,
          FAQs, Student Testimonials, Our Vision..., Campus Connection, Contact
"""

from sqlalchemy import Column, Integer, Text
from backend.database.base import Base


class IROContent(Base):
    """IRO portal structured content — maps to ncu_international_relations_sections_columns.csv"""
    __tablename__ = "iro_content"

    id = Column(Integer, primary_key=True, index=True)
    about_iro = Column(Text)
    main_objectives = Column(Text)
    global_partners = Column(Text)
    global_learning_pathways = Column(Text)
    faqs = Column(Text)
    student_testimonials = Column(Text)
    vision = Column(Text)
    campus_connection = Column(Text)
    contact = Column(Text)

    def __repr__(self):
        return f"<IROContent row {self.id}>"
