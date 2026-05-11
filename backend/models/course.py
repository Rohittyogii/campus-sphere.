"""
Campus Sphere — Course & Open Elective Models
================================================
Based on: Course.xlsx (68 rows) — course_code, course_name, credits, L_T_P
Based on: Open_Elective_Courses.xlsx (70 rows) — sr_no, offered_by, code,
           course, L_T_P, vacancy, descriptions, course_type
"""

from sqlalchemy import Column, Integer, String, Text
from backend.database.base import Base


class Course(Base):
    """Represents an academic course — maps to Course.xlsx"""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(30), unique=True, nullable=False)
    course_name = Column(String(300), nullable=False)
    credits = Column(Integer)
    l_t_p = Column(String(20))  # Lecture-Tutorial-Practical format

    def __repr__(self):
        return f"<Course {self.course_code} — {self.course_name}>"


class OpenElective(Base):
    """Represents an open elective course — maps to Open_Elective_Courses.xlsx"""
    __tablename__ = "open_electives"

    id = Column(Integer, primary_key=True, index=True)
    sr_no = Column(Integer)
    offered_by = Column(String(200))
    code = Column(String(30))
    course = Column(String(300), nullable=False)
    l_t_p = Column(String(20))
    vacancy = Column(String(100))
    descriptions = Column(Text)
    course_type = Column(String(100))

    def __repr__(self):
        return f"<OpenElective {self.code} — {self.course}>"
