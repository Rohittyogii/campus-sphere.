"""
Campus Sphere — Notification Routes
===================================
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from backend.database.session import get_db
from backend.models.notification import Notification
from backend.models.student import Student
from backend.dependencies import get_current_active_student

router = APIRouter()

def _serialize(notif: Notification) -> dict:
    return {
        "id": notif.id,
        "title": notif.title,
        "message": notif.message,
        "notif_type": notif.notif_type,
        "is_read": notif.is_read,
        "created_at": str(notif.created_at)
    }

@router.get("/")
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Fetch all notifications for the current student."""
    result = await db.execute(
        select(Notification)
        .where(Notification.student_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    return [_serialize(n) for n in result.scalars().all()]

@router.post("/{notif_id}/read")
async def mark_as_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Mark a specific notification as read."""
    notif = await db.get(Notification, notif_id)
    if not notif or notif.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    await db.commit()
    return {"message": "Notification marked as read"}

@router.post("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Mark all notifications as read for the current student."""
    result = await db.execute(
        select(Notification)
        .where(Notification.student_id == current_user.id, Notification.is_read == False)
    )
    notifs = result.scalars().all()
    for n in notifs:
        n.is_read = True
    await db.commit()
    return {"message": f"Marked {len(notifs)} notifications as read"}
