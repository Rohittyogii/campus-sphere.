"""
Campus Sphere — Clubs Routes
==============================
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database.session import get_db
from backend.models.club import Club
from backend.dependencies import get_current_active_student
from backend.models.student import Student

router = APIRouter()

@router.get("/")
async def get_clubs(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get all campus clubs."""
    result = await db.execute(select(Club))
    return result.scalars().all()
