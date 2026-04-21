"""
Campus Sphere — IRO Routes
============================
GET  /iro/                  — IRO content (grouped sections)
GET  /iro/partners          — Grouped global partners list
POST /iro/apply             — Student submits program application
GET  /iro/my-applications   — Student's own submitted applications
GET  /iro/applications      — Admin: all applications
PUT  /iro/applications/{id} — Admin: update application status
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional

from backend.database.session import get_db
from backend.models.iro import IROContent
from backend.models.student import Student
from backend.dependencies import get_current_active_student

router = APIRouter()

# In-memory application store (persists during server lifetime)
# Format: [{id, student_roll, student_name, program, university, semester, statement, status, created_at}]
_applications: list[dict] = []
_next_id = 1


class IROApplication(BaseModel):
    program_type: str           # "semester_exchange", "summer_immersion", "internship", "research"
    target_university: str
    preferred_semester: Optional[str] = None
    personal_statement: Optional[str] = None
    cgpa_at_time_of_apply: Optional[float] = None


class ApplicationStatusUpdate(BaseModel):
    status: str                 # "under_review", "approved", "rejected", "waitlisted"


@router.get("/")
async def get_iro_content(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get all IRO content rows."""
    result = await db.execute(select(IROContent))
    return result.scalars().all()


@router.get("/partners")
async def get_partners(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Return aggregated unique partner universities with their opportunities."""
    result = await db.execute(select(IROContent))
    rows = result.scalars().all()

    grouped: dict[str, list[str]] = {}
    for row in rows:
        if not row.global_partners or str(row.global_partners).strip().lower() in ('nan', ''):
            continue
        parts = str(row.global_partners).split(' | ', 1)
        uni = parts[0].strip()
        detail = parts[1].strip() if len(parts) > 1 else ''
        grouped.setdefault(uni, [])
        if detail:
            grouped[uni].append(detail)

    return [
        {"university": uni, "opportunities": details}
        for uni, details in grouped.items()
    ]


@router.post("/apply")
async def submit_application(
    payload: IROApplication,
    current_user: Student = Depends(get_current_active_student)
):
    """Student submits an IRO program application."""
    global _next_id
    from datetime import datetime

    application = {
        "id": _next_id,
        "student_roll": current_user.roll_no,
        "student_name": current_user.student_name,
        "branch": current_user.branch,
        "program_type": payload.program_type,
        "target_university": payload.target_university,
        "preferred_semester": payload.preferred_semester,
        "personal_statement": payload.personal_statement,
        "cgpa": payload.cgpa_at_time_of_apply or current_user.cgpa,
        "status": "under_review",
        "submitted_at": datetime.now().isoformat(),
    }
    _applications.append(application)
    _next_id += 1
    return {"message": "Application submitted successfully.", "application_id": application["id"]}


@router.get("/my-applications")
async def my_applications(
    current_user: Student = Depends(get_current_active_student)
):
    """Get the logged-in student's applications."""
    mine = [a for a in _applications if a["student_roll"] == current_user.roll_no]
    return mine


@router.get("/applications")
async def all_applications(
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Get all IRO applications."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return _applications


@router.put("/applications/{app_id}")
async def update_application_status(
    app_id: int,
    payload: ApplicationStatusUpdate,
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Update application status."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    valid = {"under_review", "approved", "rejected", "waitlisted"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    for app in _applications:
        if app["id"] == app_id:
            app["status"] = payload.status
            return {"message": f"Application {app_id} updated to '{payload.status}'."}

    raise HTTPException(status_code=404, detail="Application not found")
