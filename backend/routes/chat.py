"""
Campus Sphere — AI Chat Routes
================================
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.dependencies import get_current_active_student
from backend.models.student import Student
from backend.services.rag_service import rag_service

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
async def ask_assistant(
    request: ChatRequest,
    current_user: Student = Depends(get_current_active_student)
):
    """
    Ask the AI Assistant a question. 
    It will use RAG (Retrieval-Augmented Generation) to search campus data.
    The logged-in student's profile is injected into the prompt for personalization.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Build a compact student profile string to inject into the prompt
    student_profile = {
        "name": current_user.student_name,
        "roll_no": current_user.roll_no,
        "branch": current_user.branch,
        "course": current_user.course,
        "specialization": current_user.specialization,
        "section": current_user.section,
        "career_objective": current_user.career_objective,
        "technical_skills": current_user.technical_skills,
        "soft_skills": current_user.soft_skills,
    }
        
    answer = await rag_service.get_answer(request.query, student_profile)
    
    return ChatResponse(response=answer)
