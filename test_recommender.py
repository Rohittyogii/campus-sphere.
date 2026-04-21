import asyncio
from sqlalchemy.future import select
from backend.database.session import AsyncSessionLocal
from backend.models.student import Student
from backend.services.recommender_service import recommender_service
import json

async def test_recommender():
    async with AsyncSessionLocal() as session:
        # Pick the first student as current user
        result = await session.execute(select(Student).limit(1))
        student = result.scalars().first()

        if not student:
            print("No student found in DB")
            return

        print(f"Testing recommendations for User: {student.student_name} ({student.roll_no})")
        print(f"Objective/Skills: {student.career_objective} / {student.technical_skills}")

        recs = await recommender_service.get_all_recommendations(session, student)

        print("\n--- RECOMMENDED PEERS ---")
        for p in recs.get('peers', []):
            print(f"> {p['name']} ({p['roll_no']}) - Match: {p['similarity']}%")
            
        print("\n--- RECOMMENDED HACKATHONS ---")
        for h in recs.get('hackathons', []):
            print(f"> {h['name']} - Match: {h['similarity']}%")

        print("\n--- RECOMMENDED OPEN ELECTIVES ---")
        for oe in recs.get('open_electives', []):
            print(f"> {oe['course']} - Match: {oe['similarity']}%")

if __name__ == "__main__":
    asyncio.run(test_recommender())
