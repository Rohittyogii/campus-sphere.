"""
Campus Sphere — Profile Routes
===================================
GET  /profile/              — Full student profile (rich)
PUT  /profile/skills        — Update technical/soft skills
GET  /profile/bookmarks     — Module-wise bookmarks from session (placeholder)
PUT  /profile/career        — Update career objective
GET  /profile/activity      — Activity summary (issued books + attendance count)
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional

from backend.database.session import get_db
from backend.models.student import Student
from backend.models.book import IssuedBook
from backend.models.timetable import Timetable
from backend.dependencies import get_current_active_student

router = APIRouter()


class SkillsUpdate(BaseModel):
    technical_skills: Optional[str] = None
    soft_skills: Optional[str] = None
    personal_skills: Optional[str] = None


class CareerUpdate(BaseModel):
    career_objective: str


@router.get("/")
async def get_full_profile(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Return the complete student profile."""
    return {
        "student_name": current_user.student_name,
        "roll_no": current_user.roll_no,
        "email": current_user.email,
        "branch": current_user.branch,
        "course": current_user.course,
        "specialization": current_user.specialization,
        "section": current_user.section,
        "batch": current_user.batch,
        "cgpa": current_user.cgpa,
        "gender": current_user.gender,
        "career_objective": current_user.career_objective,
        "technical_skills": current_user.technical_skills,
        "soft_skills": current_user.soft_skills,
        "personal_skills": current_user.personal_skills,
        "fav_cafe_item": current_user.fav_cafe_item,
        "role": current_user.role,
    }


@router.put("/skills")
async def update_skills(
    payload: SkillsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Update a student's skills. Only provided fields are updated."""
    if payload.technical_skills is not None:
        current_user.technical_skills = payload.technical_skills
    if payload.soft_skills is not None:
        current_user.soft_skills = payload.soft_skills
    if payload.personal_skills is not None:
        current_user.personal_skills = payload.personal_skills
    await db.commit()
    return {"message": "Skills updated successfully."}


@router.put("/career")
async def update_career(
    payload: CareerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Update the student's career objective."""
    current_user.career_objective = payload.career_objective
    await db.commit()
    return {"message": "Career objective updated."}


@router.get("/activity")
async def get_activity(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Return activity summary: issued book count, attendance count."""
    books_result = await db.execute(
        select(func.count(IssuedBook.id)).where(
            func.upper(IssuedBook.roll_no) == current_user.roll_no.upper()
        )
    )
    books_count = books_result.scalar() or 0

    timetable_result = await db.execute(
        select(func.count(Timetable.id)).where(
            func.upper(Timetable.section) == (current_user.section or '').upper()
        )
    )
    classes_count = timetable_result.scalar() or 0

    return {
        "roll_no": current_user.roll_no,
        "books_issued": books_count,
        "classes_in_section": classes_count,
        "cgpa": current_user.cgpa,
    }


@router.get("/bookmarks")
async def get_bookmarks(
    current_user: Student = Depends(get_current_active_student)
):
    """
    Bookmarks are client-managed (stored in localStorage on frontend).
    This endpoint returns an empty structure that the frontend merges with local state.
    """
    return {
        "clubs": [],
        "events": [],
        "books": [],
        "electives": [],
        "note": "Bookmarks are persisted client-side via localStorage."
    }
