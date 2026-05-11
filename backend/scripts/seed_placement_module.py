import pandas as pd
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.config import settings
from backend.models.placement import CompanyQuestion, PreparationResource, StudentSkill, CareerDomain
from backend.models.student import Student
from backend.models.career import CareerObjective

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")

# Setup synchronous DB connection
engine = create_engine(settings.DATABASE_URL_SYNC)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_company_questions(session):
    print("Seeding company questions...")
    file_path = os.path.join(DATA_DIR, "Company_Questions.xlsx")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    df = pd.read_excel(file_path)
    questions = []
    for _, row in df.iterrows():
        # Check if already exists
        existing = session.query(CompanyQuestion).filter_by(question_id=str(row['question_id'])).first()
        if not existing:
            questions.append(CompanyQuestion(
                question_id=str(row['question_id']),
                company_name=str(row['company_name']),
                question_type=str(row['question_type']),
                question=str(row['question']),
                role=str(row.get('role', ''))
            ))
    
    if questions:
        session.bulk_save_objects(questions)
        session.commit()
    print(f"Inserted {len(questions)} company questions.")

def seed_preparation_resources(session):
    print("Seeding preparation resources...")
    file_path = os.path.join(DATA_DIR, "Preparation_Links.xlsx")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    df = pd.read_excel(file_path)
    resources = []
    for _, row in df.iterrows():
        existing = session.query(PreparationResource).filter_by(prep_id=str(row['prep_id'])).first()
        if not existing:
            resources.append(PreparationResource(
                prep_id=str(row['prep_id']),
                skill=str(row['skill']),
                level=str(row['level']),
                platform=str(row['platform']),
                link=str(row['link'])
            ))
            
    if resources:
        session.bulk_save_objects(resources)
        session.commit()
    print(f"Inserted {len(resources)} preparation resources.")

def seed_student_skills(session):
    print("Seeding student skills from profile data...")
    # We can extract skills from Student table (technical_skills column)
    students = session.query(Student).all()
    student_skills = []
    
    for student in students:
        if student.technical_skills:
            skills = [s.strip() for s in student.technical_skills.split(',') if s.strip()]
            for skill in skills:
                # Check if already exists for this student
                existing = session.query(StudentSkill).filter_by(roll_no=student.roll_no, skill_name=skill).first()
                if not existing:
                    student_skills.append(StudentSkill(
                        roll_no=student.roll_no,
                        skill_name=skill,
                        proficiency="Intermediate", # Default
                        category="Technical"
                    ))
        
        if student.soft_skills:
            skills = [s.strip() for s in student.soft_skills.split(',') if s.strip()]
            for skill in skills:
                existing = session.query(StudentSkill).filter_by(roll_no=student.roll_no, skill_name=skill).first()
                if not existing:
                    student_skills.append(StudentSkill(
                        roll_no=student.roll_no,
                        skill_name=skill,
                        proficiency="Intermediate",
                        category="Soft"
                    ))

    if student_skills:
        session.bulk_save_objects(student_skills)
        session.commit()
    print(f"Inserted {len(student_skills)} student skill records.")

def seed_career_domains(session):
    print("Seeding career domains from career objectives...")
    objectives = session.query(CareerObjective).all()
    domains = []
    
    for obj in objectives:
        existing = session.query(CareerDomain).filter_by(domain_name=obj.career_objective).first()
        if not existing:
            domains.append(CareerDomain(
                domain_name=obj.career_objective,
                description=obj.description,
                required_skills=obj.key_skills,
                growth_index=obj.growth_index
            ))
            
    if domains:
        session.bulk_save_objects(domains)
        session.commit()
    print(f"Inserted {len(domains)} career domains.")

def main():
    session = SessionLocal()
    try:
        seed_company_questions(session)
        seed_preparation_resources(session)
        seed_student_skills(session)
        seed_career_domains(session)
        print("Placement module seeding completed!")
    except Exception as e:
        session.rollback()
        print(f"Error seeding placement module: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
