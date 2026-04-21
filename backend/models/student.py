"""
Campus Sphere — Student Model
===============================
Based on: Student.xlsx (424 rows)
Columns: student_name, roll_no, CGPA, branch, course, specialization,
          section, sub_group, batch, email, gender
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database.base import Base


class Student(Base):
    """Represents a registered student — maps to Student.xlsx"""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    # --- From Student.xlsx ---
    student_name = Column(String(200), nullable=False)
    roll_no = Column(String(30), unique=True, nullable=False, index=True)
    cgpa = Column(Float)
    branch = Column(String(100))
    course = Column(String(100))
    specialization = Column(String(100))
    section = Column(String(20))
    sub_group = Column(String(20))
    batch = Column(String(20))
    email = Column(String(255), unique=True, nullable=False, index=True)
    gender = Column(String(20))

    # --- From Student_Recommendation.xlsx (extended profile) ---
    career_objective = Column(String(500))
    technical_skills = Column(String(500))
    soft_skills = Column(String(500))
    personal_skills = Column(String(500))
    fav_cafe_item = Column(String(200))

    # --- Auth fields (for login system) ---
    hashed_password = Column(String(255))
    role = Column(String(20), default="student")  # "student" or "admin"
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    issued_books = relationship("IssuedBook", back_populates="student", primaryjoin="Student.roll_no == IssuedBook.roll_no", foreign_keys="[IssuedBook.roll_no]")
    attendance_records = relationship("AttendanceRecord", back_populates="student", primaryjoin="Student.roll_no == AttendanceRecord.roll_no", foreign_keys="[AttendanceRecord.roll_no]")

    def __repr__(self):
        return f"<Student {self.roll_no} — {self.student_name}>"
