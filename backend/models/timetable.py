"""
Campus Sphere — Timetable & Attendance Models
================================================
Based on: Timetable.xlsx (174 rows)
  — schedule_id, day, section, start_time, end_time, room_no, type, course_code, faculty_id

Based on: Attendance_Records.xlsx (3276 rows)
  — roll_no, course_code, course_name, faculty_id, faculty_name, lecture_date, timing, status
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.base import Base


class Timetable(Base):
    """Represents a timetable entry — maps to Timetable.xlsx"""
    __tablename__ = "timetable"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(String(50), unique=True)
    day = Column(String(20))
    section = Column(String(20))
    start_time = Column(String(20))
    end_time = Column(String(20))
    room_no = Column(String(30))
    type = Column(String(50))  # "Lecture", "Lab", etc.
    course_code = Column(String(30))
    faculty_id = Column(String(30))

    def __repr__(self):
        return f"<Timetable {self.day} {self.start_time} — {self.course_code}>"


class AttendanceRecord(Base):
    """Represents an attendance entry — maps to Attendance_Records.xlsx"""
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    roll_no = Column(String(30))
    course_code = Column(String(30))
    course_name = Column(String(300))
    faculty_id = Column(String(30))
    faculty_name = Column(String(200))
    lecture_date = Column(String(50))
    timing = Column(String(50))
    status = Column(String(20))  # "Present", "Absent"

    student = relationship("Student", back_populates="attendance_records", foreign_keys=[roll_no], primaryjoin="AttendanceRecord.roll_no == Student.roll_no")

    def __repr__(self):
        return f"<Attendance {self.roll_no} — {self.course_code} — {self.status}>"
