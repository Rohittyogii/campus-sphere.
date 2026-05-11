from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.database.session import get_db
from backend.models.announcement import Announcement
from backend.schemas.announcement import AnnouncementCreate, AnnouncementResponse
from backend.dependencies import get_current_active_student
from backend.models.student import Student

router = APIRouter()

@router.get("/", response_model=List[AnnouncementResponse])
async def get_announcements(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Fetch all announcements, sorted by latest first."""
    result = await db.execute(select(Announcement).order_by(Announcement.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    announcement: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """
    Create a new announcement. 
    Only admins should be able to do this.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can post announcements"
        )
    
    db_announcement = Announcement(**announcement.dict())
    db.add(db_announcement)
    await db.commit()
    await db.refresh(db_announcement)
    return db_announcement
