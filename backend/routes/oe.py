"""
Campus Sphere — Open Electives Routes
=======================================
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database.session import get_db
from backend.models.course import OpenElective
from backend.dependencies import get_current_active_student
from backend.models.student import Student

router = APIRouter()

@router.get("/")
async def get_open_electives(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get all open electives available."""
    result = await db.execute(select(OpenElective))
    return result.scalars().all()
