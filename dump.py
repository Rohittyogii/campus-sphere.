import asyncio
import json
from backend.database.session import AsyncSessionLocal
from backend.models.student import Student
from sqlalchemy.future import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Student).where(Student.roll_no == '22CSU057'))
        s = result.scalar_one_or_none()
        if s:
            data = {
                "roll_no": s.roll_no,
                "career_objective": s.career_objective,
                "technical_skills": s.technical_skills
            }
            with open("test.txt", "w", encoding="utf-8") as f:
                json.dump(data, f)

asyncio.run(main())
