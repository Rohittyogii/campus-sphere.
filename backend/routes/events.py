"""
Campus Sphere — Events & Hackathons Routes
============================================
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database.session import get_db
from backend.models.event import Event, Hackathon
from backend.dependencies import get_current_active_student
from backend.models.student import Student

router = APIRouter()

@router.get("/")
async def get_events(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get all campus events and hackathons."""
    events_result = await db.execute(select(Event))
    hackathons_result = await db.execute(select(Hackathon))
    
    return {
        "events": events_result.scalars().all(),
        "hackathons": hackathons_result.scalars().all()
    }
