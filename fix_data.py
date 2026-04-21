import asyncio
import pandas as pd
import os
from sqlalchemy.future import select
from sqlalchemy import update
from backend.database.session import AsyncSessionLocal
from backend.models.student import Student
from backend.models.timetable import Timetable
from backend.models.timetable import AttendanceRecord

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

async def main():
    rec_df = pd.read_excel(os.path.join(DATA_DIR, "Student_Recommendation.xlsx"))
    # Clean the source data
    rec_df['roll_no'] = rec_df['roll_no'].astype(str).str.upper().str.strip()

    async with AsyncSessionLocal() as session:
        # 1. Fix Student Objectives & Skills
        db_students = (await session.execute(select(Student))).scalars().all()
        for s in db_students:
            match = rec_df[rec_df['roll_no'] == s.roll_no]
            if not match.empty:
                row = match.iloc[0]
                s.career_objective = str(row.get('career_objective', '')) if pd.notnull(row.get('career_objective')) else ""
                s.technical_skills = str(row.get('technical_skills', '')) if pd.notnull(row.get('technical_skills')) else ""
                s.soft_skills = str(row.get('soft_skills', '')) if pd.notnull(row.get('soft_skills')) else ""
                
                # If they were "nan", clean them
                if s.career_objective.lower() == "nan": s.career_objective = ""
                if s.technical_skills.lower() == "nan": s.technical_skills = ""

        # 2. Fix Case Sensitivities Across the DB
        # To make sure Timetable.section matches Student.section, strip both
        for s in db_students:
            if s.section:
                s.section = s.section.strip().upper()

        tts = (await session.execute(select(Timetable))).scalars().all()
        for t in tts:
            if t.section:
                t.section = t.section.strip().upper()

        atts = (await session.execute(select(AttendanceRecord))).scalars().all()
        for a in atts:
            if a.roll_no:
                a.roll_no = a.roll_no.strip().upper()
                
        await session.commit()
        print("Data normalized and updated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
