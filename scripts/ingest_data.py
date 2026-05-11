import pandas as pd
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import settings
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
from backend.services.auth_service import hash_password

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# Setup synchronous DB connection for bulk inserts
engine = create_engine(settings.DATABASE_URL_SYNC)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def ingest_students(session):
    print("Ingesting students...")
    student_df = pd.read_excel(os.path.join(DATA_DIR, "Student.xlsx"))
    rec_df = pd.read_excel(os.path.join(DATA_DIR, "Student_Recommendation.xlsx"))
    
    # Merge datasets on roll_no
    merged = pd.merge(student_df, rec_df[['roll_no', 'career_objective', 'technical_skills', 'soft_skills', 'personal_skills', 'fav_cafe_item']], on="roll_no", how="left")
    merged['roll_no'] = merged['roll_no'].astype(str).str.upper().str.strip()
    merged = merged.drop_duplicates(subset=['roll_no'])
    
    students = []
    default_password = hash_password("Demo@123")
    
    for _, row in merged.iterrows():
        students.append(Student(
            student_name=str(row.get('student_name', '')),
            roll_no=str(row.get('roll_no', '')),
            cgpa=float(row.get('CGPA', 0.0)) if pd.notnull(row.get('CGPA')) else 0.0,
            branch=str(row.get('branch', '')),
            course=str(row.get('course', '')),
            specialization=str(row.get('specialization_x', row.get('specialization', ''))),
            section=str(row.get('section', '')),
            sub_group=str(row.get('sub_group', '')),
            batch=str(row.get('batch', '')),
            email=f"{str(row.get('roll_no', '')).lower()}@ncuindia.edu",
            gender=str(row.get('gender_x', row.get('gender', ''))),
            career_objective=str(row.get('career_objective', '')),
            technical_skills=str(row.get('technical_skills', '')),
            soft_skills=str(row.get('soft_skills', '')),
            personal_skills=str(row.get('personal_skills', '')),
            fav_cafe_item=str(row.get('fav_cafe_item', '')),
            hashed_password=default_password
        ))
    
    session.bulk_save_objects(students)
    session.commit()
    print(f"Inserted {len(students)} students.")

def ingest_cafe(session):
    print("Ingesting cafe items...")
    df = pd.read_excel(os.path.join(DATA_DIR, "Cafe_Menu.xlsx"))
    items = []
    for _, row in df.iterrows():
        items.append(CafeItem(
            itemid=str(row['itemid']),
            item_name=str(row['item_name']),
            category=str(row['category']),
            price=float(row['price']),
            availability_status=str(row['availability_status'])
        ))
    session.bulk_save_objects(items)
    session.commit()
    print(f"Inserted {len(items)} cafe items.")

def ingest_clubs(session):
    print("Ingesting clubs...")
    df = pd.read_excel(os.path.join(DATA_DIR, "Club_Dataset.xlsx"))
    clubs = []
    for _, row in df.iterrows():
        clubs.append(Club(
            clubid=str(row['clubid']),
            club_name=str(row['club_name']),
            description=str(row.get('description', ''))
        ))
    session.bulk_save_objects(clubs)
    session.commit()
    print(f"Inserted {len(clubs)} clubs.")

def ingest_events(session):
    print("Ingesting events and hackathons...")
    events_df = pd.read_excel(os.path.join(DATA_DIR, "Events.xlsx"))
    events = []
    for _, row in events_df.iterrows():
        events.append(Event(
            eventid=str(row['eventid']),
            event_name=str(row['event_name']),
            date=str(row['date']),
            department=str(row['department'])
        ))
    session.bulk_save_objects(events)
    
    hack_df = pd.read_excel(os.path.join(DATA_DIR, "Hackathon_Dataset.xlsx"))
    hackathons = []
    for _, row in hack_df.iterrows():
        hackathons.append(Hackathon(
            hackathon_id=str(row['hackathon_id']),
            hackathon_name=str(row['hackathon_name']),
            organizer=str(row['organizer']),
            registration_deadline=str(row['registration_deadline']),
            link=str(row.get('link', '')),
            eligibility=str(row.get('eligibility', '')),
            recommended_for=str(row.get('recommended_for', ''))
        ))
    session.bulk_save_objects(hackathons)
    session.commit()
    print(f"Inserted {len(events)} events and {len(hackathons)} hackathons.")

def ingest_courses(session):
    print("Ingesting courses and OEs...")
    course_df = pd.read_excel(os.path.join(DATA_DIR, "Course.xlsx"))
    courses = []
    for _, row in course_df.iterrows():
        courses.append(Course(
            course_code=str(row['course_code']),
            course_name=str(row['course_name']),
            credits=int(row['credits']) if pd.notnull(row['credits']) else 0,
            l_t_p=str(row.get('L_T_P', ''))
        ))
    session.bulk_save_objects(courses)
    
    oe_df = pd.read_excel(os.path.join(DATA_DIR, "Open_Elective_Courses.xlsx"))
    oes = []
    for _, row in oe_df.iterrows():
        oes.append(OpenElective(
            sr_no=int(row['sr_no']) if pd.notnull(row['sr_no']) else None,
            offered_by=str(row.get('offered_by', '')),
            code=str(row.get('code', '')),
            course=str(row['course']),
            l_t_p=str(row.get('L_T_P', '')),
            vacancy=str(row['vacancy']) if pd.notnull(row['vacancy']) else None,
            descriptions=str(row.get('descriptions', '')),
            course_type=str(row.get('course_type', ''))
        ))
    session.bulk_save_objects(oes)
    session.commit()
    print(f"Inserted {len(courses)} courses and {len(oes)} OEs.")

def ingest_library(session):
    print("Ingesting library...")
    master_df = pd.read_csv(os.path.join(DATA_DIR, "master_books_with_categories.csv"))
    master_books = []
    for _, row in master_df.iterrows():
        master_books.append(MasterBook(
            book_id=int(row['book_id']),
            unique_key=str(row.get('_unique_key', '')),
            title=str(row['title']).strip()[:499],
            author=str(row.get('author', ''))[:499],
            editionstatement=str(row.get('editionstatement', ''))[:199],
            publishercode=str(row.get('publishercode', ''))[:199],
            copyrightdate=str(row.get('copyrightdate', ''))[:49],
            itemcallnumber=str(row.get('itemcallnumber', ''))[:99],
            quantity=int(row['quantity']) if pd.notnull(row['quantity']) else 0,
            category_keyword=str(row.get('category_keyword', ''))[:199],
            cluster_label=str(row.get('cluster_label', ''))[:199]
        ))
    session.bulk_save_objects(master_books)
    session.commit()

    barcodes_df = pd.read_csv(os.path.join(DATA_DIR, "barcodes.csv"))
    barcodes = []
    for _, row in barcodes_df.iterrows():
        barcodes.append(Barcode(
            barcode=str(row['barcode']),
            book_id=int(row['book_id']) if pd.notnull(row['book_id']) else None,
            availability_status=str(row.get('availability_status', ''))
        ))
    session.bulk_save_objects(barcodes)
    session.commit()

    issued_df = pd.read_excel(os.path.join(DATA_DIR, "Issued_Books_Library.xlsx"))
    issued_books = []
    for _, row in issued_df.iterrows():
        issued_books.append(IssuedBook(
            issue_date=str(row.get('issue_date', '')),
            due_date=str(row.get('due_date', '')),
            barcode=str(row.get('barcode', '')),
            title=str(row.get('title', ''))[:499],
            author=str(row.get('author', ''))[:499],
            roll_no=str(row.get('roll_no', '')),
            first_name=str(row.get('first_name', '')),
            last_name=str(row.get('last_name', ''))
        ))
    session.bulk_save_objects(issued_books)
    session.commit()
    print(f"Inserted {len(master_books)} master books, {len(barcodes)} barcodes, and {len(issued_books)} issued books.")

def ingest_academics(session):
    print("Ingesting academics (Faculty, Timetable, Attendance)...")
    faculty_df = pd.read_excel(os.path.join(DATA_DIR, "Faculty.xlsx"))
    faculty = []
    for _, row in faculty_df.iterrows():
        faculty.append(Faculty(
            facultyid=str(row['facultyid']),
            faculty_name=str(row['faculty_name']),
            email_id=str(row.get('email_id', '')),
            department=str(row.get('department', ''))
        ))
    session.bulk_save_objects(faculty)
    
    tt_df = pd.read_excel(os.path.join(DATA_DIR, "Timetable.xlsx"))
    tt = []
    for _, row in tt_df.iterrows():
        tt.append(Timetable(
            schedule_id=str(row['schedule_id']) if pd.notnull(row['schedule_id']) else None,
            day=str(row.get('day', '')),
            section=str(row.get('section', '')),
            start_time=str(row.get('start_time', '')),
            end_time=str(row.get('end_time', '')),
            room_no=str(row.get('room_no', '')),
            type=str(row.get('type', '')),
            course_code=str(row.get('course_code', '')),
            faculty_id=str(row.get('faculty_id', ''))
        ))
    session.bulk_save_objects(tt)

    att_df = pd.read_excel(os.path.join(DATA_DIR, "Attendance_Records.xlsx"))
    att = []
    for _, row in att_df.iterrows():
        att.append(AttendanceRecord(
            roll_no=str(row.get('roll_no', '')),
            course_code=str(row.get('course_code', '')),
            course_name=str(row.get('course_name', ''))[:299],
            faculty_id=str(row.get('faculty_id', '')),
            faculty_name=str(row.get('faculty_name', ''))[:199],
            lecture_date=str(row.get('lecture_date', '')),
            timing=str(row.get('timing', '')),
            status=str(row.get('status', ''))
        ))
    session.bulk_save_objects(att)
    session.commit()
    print(f"Inserted {len(faculty)} faculty, {len(tt)} timetable items, and {len(att)} attendance records.")

def ingest_careers(session):
    print("Ingesting career objectives and mappings...")
    career_df = pd.read_excel(os.path.join(DATA_DIR, "Career_Objective.xlsx"))
    careers = []
    for _, row in career_df.iterrows():
        careers.append(CareerObjective(
            career_id=str(row['career_id']) if pd.notnull(row['career_id']) else None,
            career_objective=str(row['career_objective']),
            specialization_focus=str(row.get('specialization_focus', '')),
            description=str(row.get('description', '')),
            key_skills=str(row.get('key_skills', '')),
            preferred_learning_mode=str(row.get('preferred_learning_mode', '')),
            growth_index=float(row['growth_index']) if pd.notnull(row['growth_index']) else 0.0,
            related_roles=str(row.get('related_roles', ''))
        ))
    session.bulk_save_objects(careers)

    keyword_df = pd.read_excel(os.path.join(DATA_DIR, "Keywords_Specialization_Map.xlsx"))
    keywords = []
    for _, row in keyword_df.iterrows():
        keywords.append(KeywordSpecializationMap(
            keyword=str(row.get('keyword', '')),
            game_tech=float(row['game_tech']) if pd.notnull(row['game_tech']) else 0.0,
            full_stack=float(row['full_stack']) if pd.notnull(row['full_stack']) else 0.0,
            cyber_security=float(row['cyber_security']) if pd.notnull(row['cyber_security']) else 0.0,
            data_science=float(row['data_science']) if pd.notnull(row['data_science']) else 0.0,
            ai_ml=float(row['AI_ML']) if pd.notnull(row.get('AI_ML')) else 0.0,
        ))
    session.bulk_save_objects(keywords)
    session.commit()
    print(f"Inserted {len(careers)} career objs and {len(keywords)} mapping rows.")

def ingest_iro(session):
    print("Ingesting IRO content...")
    iro_df = pd.read_csv(os.path.join(DATA_DIR, "ncu_international_relations_sections_columns.csv"))
    iro_contents = []
    for _, row in iro_df.iterrows():
        iro_contents.append(IROContent(
            about_iro=str(row.get('About IRO', '')),
            main_objectives=str(row.get('Main Objectives', '')),
            global_partners=str(row.get('Global Partners', '')),
            global_learning_pathways=str(row.get('Global Learning Pathways', '')),
            faqs=str(row.get('FAQs', '')),
            student_testimonials=str(row.get('Student Testimonials', '')),
            vision=str(row.get('Our Vision for Global Academic Advancement', '')),
            campus_connection=str(row.get('Campus Connection', '')),
            contact=str(row.get('Contact', ''))
        ))
    session.bulk_save_objects(iro_contents)
    session.commit()
    print(f"Inserted {len(iro_contents)} IRO content rows.")

def main():
    print("--- Starting Data Ingestion Pipeline ---")
    session = SessionLocal()
    
    # Optional: Clear tables first? We won't assuming it's an empty DB or we want to append/restart
    # But to prevent duplicate key errors, usually good to clear, but let's assume empty DB.
    try:
        ingest_students(session)
        ingest_cafe(session)
        ingest_clubs(session)
        ingest_events(session)
        ingest_courses(session)
        ingest_library(session)
        ingest_academics(session)
        ingest_careers(session)
        ingest_iro(session)
        print("--- Data Ingestion Completed Successfully ! ---")
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error during ingestion: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
