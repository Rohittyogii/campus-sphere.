"""
Campus Sphere — Student / Academics Routes
============================================
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.database.session import get_db
from backend.models.student import Student
from backend.models.timetable import Timetable, AttendanceRecord
from backend.models.faculty import Faculty
from backend.dependencies import get_current_active_student

router = APIRouter()

from sqlalchemy import func

@router.get("/timetable")
async def get_timetable(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get timetable filtered by student section."""
    result = await db.execute(
        select(Timetable).where(func.upper(Timetable.section) == current_user.section.upper())
    )
    return result.scalars().all()

@router.get("/attendance")
async def get_attendance(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get attendance records for current student."""
    result = await db.execute(
        select(AttendanceRecord).where(func.upper(AttendanceRecord.roll_no) == current_user.roll_no.upper())
    )
    return result.scalars().all()

@router.get("/faculty")
async def get_faculty(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get faculty list."""
    result = await db.execute(select(Faculty))
    return result.scalars().all()
