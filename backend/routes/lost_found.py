"""
Campus Sphere — Lost & Found Routes
======================================
GET  /lost-found/           — List approved feed items
POST /lost-found/report     — Student posts a lost/found item
PUT  /lost-found/{id}/claim — Student marks an item as claimed
GET  /lost-found/my-posts   — Student's own posts
PUT  /lost-found/{id}/approve — Admin approves/rejects a post
GET  /lost-found/pending    — Admin: list pending items
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional

from backend.database.session import get_db
from backend.models.lost_found import LostFoundItem
from backend.models.student import Student
from backend.dependencies import get_current_active_student
from backend.services.notification_service import create_notification

router = APIRouter()


class LostFoundCreate(BaseModel):
    item_type: str          # "lost" or "found"
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location_found: Optional[str] = None
    contact_info: Optional[str] = None
    image_url: Optional[str] = None


class ApprovalUpdate(BaseModel):
    decision: str           # "approved" or "rejected"


def _serialize(item: LostFoundItem) -> dict:
    return {
        "id": item.id,
        "item_type": item.item_type,
        "title": item.title,
        "description": item.description,
        "category": item.category,
        "location_found": item.location_found,
        "contact_info": item.contact_info,
        "image_url": item.image_url,
        "status": item.status,
        "admin_approved": item.admin_approved,
        "created_at": str(item.created_at) if item.created_at else None,
        "posted_by_name": item.poster.student_name if hasattr(item, 'poster') and item.poster else "Campus Student",
        "posted_by_roll": item.poster.roll_no if hasattr(item, 'poster') and item.poster else None,
    }



@router.get("/")
async def list_approved_feed(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Public feed: only admin-approved items."""
    from sqlalchemy.orm import joinedload
    result = await db.execute(
        select(LostFoundItem)
        .options(joinedload(LostFoundItem.poster))
        .where(LostFoundItem.admin_approved == "approved")
        .order_by(LostFoundItem.created_at.desc())
    )
    return [_serialize(i) for i in result.scalars().all()]


@router.get("/my-posts")
async def my_posts(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get the current student's own posts."""
    from sqlalchemy.orm import joinedload
    result = await db.execute(
        select(LostFoundItem)
        .options(joinedload(LostFoundItem.poster))
        .where(LostFoundItem.posted_by == current_user.id)
    )
    return [_serialize(i) for i in result.scalars().all()]


@router.post("/report")
async def report_item(
    payload: LostFoundCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Student reports a lost or found item. Goes into pending queue."""
    if payload.item_type not in ("lost", "found"):
        raise HTTPException(status_code=400, detail="item_type must be 'lost' or 'found'")

    item = LostFoundItem(
        posted_by=current_user.id,
        item_type=payload.item_type,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location_found=payload.location_found,
        contact_info=payload.contact_info,
        image_url=payload.image_url,
        status="open",
        admin_approved="pending",
    )

    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"message": "Report submitted. Awaiting admin approval.", "id": item.id}


@router.put("/{item_id}/claim")
async def claim_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Mark an item as claimed. Owner can always claim; others only if approved."""
    item = await db.get(LostFoundItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user is owner OR if item is approved
    is_owner = item.posted_by == current_user.id
    if not is_owner and item.admin_approved != "approved":
        raise HTTPException(status_code=403, detail="Not authorized to claim this item")
        
    item.status = "claimed"
    
    # Notify the poster that their item has been claimed
    if item.posted_by != current_user.id:
        await create_notification(
            db,
            student_id=item.posted_by,
            title="Item Reclaimed! 🎉",
            message=f"Good news! Your '{item.title}' has been marked as claimed by {current_user.student_name}.",
            notif_type="Lost & Found"
        )
        
    await db.commit()
    return {"message": "Item marked as claimed."}



# ─── Admin-only endpoints ──────────────────────────────────────────────────────

@router.get("/pending")
async def list_pending(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin only: list items awaiting approval."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(
        select(LostFoundItem).where(LostFoundItem.admin_approved == "pending")
    )
    return [_serialize(i) for i in result.scalars().all()]


@router.put("/{item_id}/approve")
async def approve_item(
    item_id: int,
    payload: ApprovalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: approve or reject a pending item."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if payload.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="decision must be 'approved' or 'rejected'")
    item = await db.get(LostFoundItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.admin_approved = payload.decision
    await db.commit()
    return {"message": f"Item {item_id} {payload.decision}."}
