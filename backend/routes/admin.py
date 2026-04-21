"""
Campus Sphere — Admin Routes
==============================
GET  /admin/health           — API health check
GET  /admin/modules          — Live module registry (route map + status)
GET  /admin/students         — All students summary (admin only)
GET  /admin/stats            — Platform-wide stats
GET  /admin/lost-found/pending — Queue of pending lost & found items to moderate
PUT  /admin/lost-found/{id}  — Approve/reject lost & found item
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from backend.database.session import get_db
from backend.models.student import Student
from backend.models.book import IssuedBook, MasterBook
from backend.models.lost_found import LostFoundItem
from backend.models.cafe import CafeItem
from backend.models.club import Club
from backend.models.event import Event, Hackathon
from backend.models.course import OpenElective
from backend.dependencies import get_current_active_student

from backend.services.module_service import module_service

router = APIRouter()

def _require_admin(current_user: Student):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/health")
async def health_check():
    """Public: API health check."""
    return {
        "status": "healthy",
        "service": "Campus Sphere API",
    }


@router.get("/modules")
async def list_modules(
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Live module registry with runtime toggle state."""
    _require_admin(current_user)
    return module_service.get_registry()


@router.put("/modules/{module_id}")
async def toggle_module(
    module_id: str,
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Toggle a module on/off at runtime."""
    _require_admin(current_user)
    success = module_service.toggle_module(module_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    
    # Get current state
    reg = module_service.get_registry()
    state = next(m["enabled"] for m in reg if m["module_id"] == module_id)
    return {"module_id": module_id, "status": "enabled" if state else "disabled"}



@router.get("/stats")
async def platform_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Platform-wide entity counts."""
    _require_admin(current_user)

    async def count(model):
        r = await db.execute(select(func.count(model.id)))
        return r.scalar() or 0

    return {
        "total_students": await count(Student),
        "total_books": await count(MasterBook),
        "total_issued": await count(IssuedBook),
        "total_cafe_items": await count(CafeItem),
        "total_clubs": await count(Club),
        "total_events": await count(Event),
        "total_hackathons": await count(Hackathon),
        "total_open_electives": await count(OpenElective),
        "total_lost_found_reports": await count(LostFoundItem),
        "pending_lost_found": (await db.execute(
            select(func.count(LostFoundItem.id)).where(LostFoundItem.admin_approved == "pending")
        )).scalar() or 0,
    }


@router.get("/students")
async def list_students(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Paginated student summary list."""
    _require_admin(current_user)
    result = await db.execute(select(Student).offset(skip).limit(limit))
    students = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.student_name,
            "roll_no": s.roll_no,
            "branch": s.branch,
            "specialization": s.specialization,
            "cgpa": s.cgpa,
            "email": s.email,
            "role": s.role,
        }
        for s in students
    ]
