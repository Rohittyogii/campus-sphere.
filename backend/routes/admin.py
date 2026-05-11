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
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import pandas as pd
import io

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
from backend.services.auth_service import hash_password
from typing import Optional

router = APIRouter()

class StudentCreate(BaseModel):
    student_name: str
    roll_no: str
    email: str
    password: str
    branch: Optional[str] = None
    course: Optional[str] = None
    specialization: Optional[str] = None
    role: str = "student"

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

    lost_found_approved = (await db.execute(
        select(func.count(LostFoundItem.id)).where(LostFoundItem.admin_approved == "approved")
    )).scalar() or 0

    lost_found_pending = (await db.execute(
        select(func.count(LostFoundItem.id)).where(LostFoundItem.admin_approved == "pending")
    )).scalar() or 0

    lost_found_rejected = (await db.execute(
        select(func.count(LostFoundItem.id)).where(LostFoundItem.admin_approved == "rejected")
    )).scalar() or 0

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
        "lost_found_pending": lost_found_pending,
        "lost_found_approved": lost_found_approved,
        "lost_found_rejected": lost_found_rejected,
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

@router.post("/students")
async def register_student(
    student: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Register a new student manually."""
    _require_admin(current_user)

    # Check for duplicates
    existing = await db.execute(select(Student).where(
        (Student.roll_no == student.roll_no) | (Student.email == student.email)
    ))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Roll No or Email already exists")

    new_student = Student(
        student_name=student.student_name,
        roll_no=student.roll_no,
        email=student.email,
        branch=student.branch,
        course=student.course,
        specialization=student.specialization,
        role=student.role,
        hashed_password=hash_password(student.password)
    )
    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)
    return {"status": "success", "student_id": new_student.id}

@router.get("/students/template")
async def get_student_template(current_user: Student = Depends(get_current_active_student)):
    """Admin: Download Excel template for bulk student registration."""
    _require_admin(current_user)
    
    df = pd.DataFrame(columns=[
        "student_name", "roll_no", "email", "password", 
        "branch", "course", "specialization", "role"
    ])
    # Add an example row
    df.loc[0] = ["John Doe", "22CSU001", "john.doe@ncuindia.edu", "password123", "SOET", "B.Tech", "AIML", "student"]
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=student_template.xlsx"}
    )

@router.post("/students/bulk")
async def bulk_import_students(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Admin: Bulk import students from Excel."""
    _require_admin(current_user)
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")
    
    try:
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
        
        # Validate columns
        required = ["student_name", "roll_no", "email", "password", "role"]
        for col in required:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Missing required column: {col}")
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Check for duplicates
                existing = await db.execute(select(Student).where(
                    (Student.roll_no == str(row['roll_no'])) | (Student.email == str(row['email']))
                ))
                if existing.scalar_one_or_none():
                    errors.append(f"Row {index+2}: Student with roll_no {row['roll_no']} or email {row['email']} already exists")
                    continue
                
                new_student = Student(
                    student_name=str(row['student_name']),
                    roll_no=str(row['roll_no']),
                    email=str(row['email']),
                    branch=str(row.get('branch', '')),
                    course=str(row.get('course', '')),
                    specialization=str(row.get('specialization', '')),
                    role=str(row.get('role', 'student')),
                    hashed_password=hash_password(str(row['password']))
                )
                db.add(new_student)
                imported_count += 1
            except Exception as e:
                errors.append(f"Row {index+2}: {str(e)}")
        
        await db.commit()
        return {
            "status": "success",
            "imported": imported_count,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
