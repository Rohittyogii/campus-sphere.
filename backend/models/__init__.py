"""
Campus Sphere — ORM Models Package
====================================
Imports all models so Alembic and the app can discover them.

Models based on actual datasets in data/ folder:
  - Student.xlsx + Student_Recommendation.xlsx → Student
  - Cafe_Menu.xlsx → CafeItem
  - Club_Dataset.xlsx → Club
  - Events.xlsx → Event
  - Hackathon_Dataset.xlsx → Hackathon
  - Course.xlsx → Course
  - Open_Elective_Courses.xlsx → OpenElective
  - master_books_with_categories.csv → MasterBook
  - barcodes.csv → Barcode
  - Issued_Books_Library.xlsx → IssuedBook
  - Faculty.xlsx → Faculty
  - Timetable.xlsx → Timetable
  - Attendance_Records.xlsx → AttendanceRecord
  - Career_Objective.xlsx → CareerObjective
  - Keywords_Specialization_Map.xlsx → KeywordSpecializationMap
  - ncu_international_relations.csv → IROContent
  - (App-only) → LostFoundItem, ModuleConfig, AdminLog
"""

from backend.models.student import Student
from backend.models.cafe import CafeItem
from backend.models.club import Club
from backend.models.event import Event, Hackathon
from backend.models.course import Course, OpenElective
from backend.models.book import MasterBook, Barcode, IssuedBook
from backend.models.faculty import Faculty
from backend.models.timetable import Timetable, AttendanceRecord
from backend.models.career import CareerObjective
from backend.models.keyword_map import KeywordSpecializationMap
from backend.models.iro import IROContent
from backend.models.lost_found import LostFoundItem
from backend.models.admin import ModuleConfig, AdminLog
