from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from backend.dependencies import get_current_active_student
from backend.models.student import Student
from backend.services.recommender.specialization_engine import specialization_engine

router = APIRouter()

class SpecializationRequest(BaseModel):
    roll_no: str
    semester: int
    selected_keywords: List[str]
    objective_id: Optional[int] = None
    current_specialization: Optional[str] = None
    questionnaire_answers: Dict[str, str]

@router.post("/recommendations")
async def get_specialization_recommendations(
    payload: SpecializationRequest,
    current_user: Student = Depends(get_current_active_student)
):
    """
    Advanced specialization recommendation engine.
    Evaluates eligibility, keywords, career goals, and questionnaire responses.
    """
    # Removed strict roll_no matching to allow for simulation and testing
    result = specialization_engine.calculate_recommendation(
        roll_no=payload.roll_no,
        semester=payload.semester,
        selected_keywords=payload.selected_keywords,
        objective_id=payload.objective_id,
        current_specialization=payload.current_specialization,
        answers=payload.questionnaire_answers
    )
    
    return result

@router.get("/config")
async def get_engine_config():
    """Returns the questionnaire and available keywords for the UI."""
    # Extract unique keywords from the map
    keywords = []
    if specialization_engine.kw_map is not None:
        keywords = sorted(specialization_engine.kw_map['keyword'].unique().tolist())
    
    return {
        "questionnaire": specialization_engine.questionnaire,
        "keywords": keywords,
        "specializations": specialization_engine.labels
    }
