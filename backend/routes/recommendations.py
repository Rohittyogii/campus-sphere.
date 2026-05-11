"""
Campus Sphere — Recommendations Routes
=========================================
Exposes individual recommendation endpoints for each module.
Each endpoint is JWT-protected and returns personalized results.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.session import get_db
from backend.models.student import Student
from backend.dependencies import get_current_active_student
from backend.services.recommender import (
    recommend_clubs,
    recommend_events,
    recommend_cafe,
    recommend_open_electives,
    recommend_specialization,
    recommend_books,
)

router = APIRouter()


@router.get("/clubs")
async def get_club_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Top-5 clubs matched to student skills & career goals via TF-IDF."""
    return await recommend_clubs(db, current_user)


@router.get("/events")
async def get_event_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Ranked events and hackathons using hybrid scoring."""
    return await recommend_events(db, current_user)


@router.get("/cafe")
async def get_cafe_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Personalized cafe picks + meal combos."""
    return await recommend_cafe(db, current_user)


@router.get("/oe")
async def get_oe_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Open Electives matched to student profile via TF-IDF, vacancy-first."""
    return await recommend_open_electives(db, current_user)


@router.get("/specialization")
async def get_specialization_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Best-fit specialization based on keyword scoring matrix."""
    return await recommend_specialization(db, current_user)


@router.get("/library")
async def get_library_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Recommended books combining content similarity + popularity + availability."""
    return await recommend_books(db, current_user)


@router.get("/all")
async def get_all_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Master endpoint: returns all 6 recommendation categories at once."""
    clubs = await recommend_clubs(db, current_user, top_k=3)
    events = await recommend_events(db, current_user, top_k=3)
    cafe = await recommend_cafe(db, current_user)
    oe = await recommend_open_electives(db, current_user, top_k=3)
    specialization = await recommend_specialization(db, current_user)
    books = await recommend_books(db, current_user, top_k=3)

    return {
        "student": {
            "name": current_user.student_name,
            "roll_no": current_user.roll_no,
            "career_objective": current_user.career_objective,
        },
        "clubs": clubs,
        "events": events,
        "cafe": cafe,
        "open_electives": oe,
        "specialization": specialization,
        "books": books,
    }
