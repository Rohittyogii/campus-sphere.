"""
Campus Sphere — Notification Service
====================================
Helper functions to create notifications across the application.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.notification import Notification

async def create_notification(
    db: AsyncSession,
    student_id: int,
    title: str,
    message: str,
    notif_type: str = "General"
):
    """Utility to inject a new notification for a specific student."""
    notification = Notification(
        student_id=student_id,
        title=title,
        message=message,
        notif_type=notif_type,
        is_read=False
    )
    db.add(notification)
    # We don't commit here, assuming the caller will commit their transaction
    return notification
