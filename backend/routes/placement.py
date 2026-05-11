from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel

from backend.database.session import get_db
from backend.services.placement_service import placement_service
from backend.dependencies import get_current_active_student
from backend.models.student import Student
from backend.services.rag_service import rag_service

router = APIRouter()

class ChatQuery(BaseModel):
    query: str

@router.get("/dashboard/{roll_no}")
async def get_placement_dashboard(roll_no: str, db: AsyncSession = Depends(get_db)):
    data = await placement_service.get_dashboard_data(db, roll_no)
    if not data:
        raise HTTPException(status_code=404, detail="Student not found")
    return data

@router.get("/recommend-skills/{roll_no}")
async def recommend_skills(roll_no: str, db: AsyncSession = Depends(get_db)):
    student_result = await db.execute(select(Student).where(Student.roll_no == roll_no))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await placement_service.recommend_skills(db, student)

@router.get("/recommend-career/{roll_no}")
async def recommend_career(roll_no: str, db: AsyncSession = Depends(get_db)):
    student_result = await db.execute(select(Student).where(Student.roll_no == roll_no))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await placement_service.recommend_career(db, student)

@router.get("/company-questions/{company}")
async def get_company_questions(company: str, db: AsyncSession = Depends(get_db)):
    return await placement_service.get_company_questions(db, company)

@router.get("/resources/{skill}")
async def get_resources(skill: str, db: AsyncSession = Depends(get_db)):
    return await placement_service.get_preparation_resources(db, skill)

@router.post("/chatbot")
async def placement_chatbot(query_data: ChatQuery, current_user: Student = Depends(get_current_active_student)):
    # Prepare profile for RAG
    profile = {
        "name": current_user.student_name,
        "roll_no": current_user.roll_no,
        "branch": current_user.branch,
        "course": current_user.course,
        "specialization": current_user.specialization,
        "career_objective": current_user.career_objective,
        "technical_skills": current_user.technical_skills,
        "soft_skills": current_user.soft_skills
    }
    
    response = await rag_service.get_answer(query_data.query, profile)
    return {"response": response}
