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
from backend.models.iro import IROContent, IROApplication as IROAppModel
from backend.models.student import Student
from backend.dependencies import get_current_active_student
from datetime import datetime

router = APIRouter()


class IROApplicationSchema(BaseModel):
    program: str
    university: str
    term: str
    cgpa: str
    purpose: str


class ApplicationStatusUpdate(BaseModel):
    status: str                 # "PENDING", "APPROVED", "REJECTED"


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
    payload: IROApplicationSchema,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Student submits an IRO program application."""
    new_app = IROAppModel(
        student_id=current_user.id,
        program=payload.program,
        university=payload.university,
        term=payload.term,
        cgpa=payload.cgpa,
        purpose=payload.purpose,
        status="PENDING",
        created_at=datetime.now().isoformat()
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)
    return {"message": "Application submitted successfully.", "application_id": new_app.id}


@router.get("/my-applications")
async def my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get the logged-in student's applications."""
    result = await db.execute(
        select(IROAppModel).where(IROAppModel.student_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/applications")
async def all_applications(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Get all IRO applications with student info."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Join with Student to get name and roll_no
    query = select(
        IROAppModel,
        Student.student_name,
        Student.roll_no
    ).join(Student, IROAppModel.student_id == Student.id)
    
    result = await db.execute(query)
    rows = result.all()
    
    output = []
    for app, name, roll in rows:
        # Convert model to dict and add extra fields
        app_dict = {
            "id": app.id,
            "student_id": app.student_id,
            "student_name": name,
            "student_roll": roll,
            "program": app.program,
            "university": app.university,
            "term": app.term,
            "cgpa": app.cgpa,
            "purpose": app.purpose,
            "status": app.status,
            "created_at": app.created_at
        }
        output.append(app_dict)
        
    return output


@router.put("/applications/{app_id}")
async def update_application_status(
    app_id: int,
    payload: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Update application status."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    valid = {"PENDING", "APPROVED", "REJECTED"}
    if payload.status.upper() not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    result = await db.execute(
        select(IROAppModel).where(IROAppModel.id == app_id)
    )
    app = result.scalar_one_or_none()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = payload.status.upper()
    await db.commit()
    return {"message": f"Application {app_id} updated to '{app.status}'."}
