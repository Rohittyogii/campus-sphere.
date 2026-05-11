"""
Campus Sphere — Feedback Routes
==================================
POST /feedback/         — Submit module feedback
GET  /feedback/         — List all feedback (admin) or own feedback (student)
GET  /feedback/summary  — Aggregated per-module ratings
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.models.student import Student
from backend.dependencies import get_current_active_student

router = APIRouter()

# In-memory feedback store
_feedback_store: list[dict] = []
_feedback_id = 1

VALID_MODULES = {
    "cafe", "clubs", "events", "library", "iro",
    "lost_found", "recommendations", "ai_companion", "overview", "general"
}


class FeedbackCreate(BaseModel):
    module: str           # e.g. "cafe", "clubs", "ai_companion"
    rating: int           # 1–5
    comment: Optional[str] = None


@router.post("/")
async def submit_feedback(
    payload: FeedbackCreate,
    current_user: Student = Depends(get_current_active_student)
):
    """Submit a rating + comment for a module."""
    global _feedback_id
    if payload.module not in VALID_MODULES:
        payload.module = "general"
    if not (1 <= payload.rating <= 5):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    entry = {
        "id": _feedback_id,
        "roll_no": current_user.roll_no,
        "student_name": current_user.student_name,
        "module": payload.module,
        "rating": payload.rating,
        "comment": payload.comment,
        "submitted_at": datetime.now().isoformat(),
    }
    _feedback_store.append(entry)
    _feedback_id += 1
    return {"message": "Thank you for your feedback!", "id": entry["id"]}


@router.get("/")
async def list_feedback(
    module: Optional[str] = None,
    current_user: Student = Depends(get_current_active_student)
):
    """Admin sees all feedback; students see only their own."""
    if current_user.role == "admin":
        data = _feedback_store
    else:
        data = [f for f in _feedback_store if f["roll_no"] == current_user.roll_no]

    if module:
        data = [f for f in data if f["module"] == module]
    return data


@router.get("/summary")
async def feedback_summary(
    current_user: Student = Depends(get_current_active_student)
):
    """Aggregated avg rating per module (admin only)."""
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin only")

    summary: dict[str, dict] = {}
    for f in _feedback_store:
        mod = f["module"]
        if mod not in summary:
            summary[mod] = {"total": 0, "count": 0}
        summary[mod]["total"] += f["rating"]
        summary[mod]["count"] += 1

    return [
        {
            "module": mod,
            "avg_rating": round(v["total"] / v["count"], 2),
            "response_count": v["count"]
        }
        for mod, v in summary.items()
    ]
