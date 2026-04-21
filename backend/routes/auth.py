"""
Campus Sphere — Auth Routes
=============================
POST /auth/login      — Login with roll_no + password
POST /auth/register   — Register new student
GET  /auth/me         — Get current user info
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordRequestForm

from backend.database.session import get_db
from backend.models.student import Student
from backend.schemas.student import StudentCreate, StudentResponse
from backend.schemas.auth import Token
from backend.services.auth_service import hash_password, verify_password, create_access_token
from backend.dependencies import get_current_active_student

router = APIRouter()

@router.post("/register", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def register(student_in: StudentCreate, db: AsyncSession = Depends(get_db)):
    """Register a new student account."""
    # Check if student exists
    result_by_roll = await db.execute(select(Student).where(Student.roll_no == student_in.roll_no))
    if result_by_roll.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Roll number already registered")
        
    result_by_email = await db.execute(select(Student).where(Student.email == student_in.email))
    if result_by_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new student
    hashed_pwd = hash_password(student_in.password)
    new_student = Student(
        roll_no=student_in.roll_no,
        student_name=student_in.student_name,
        email=student_in.email,
        branch=student_in.branch,
        course=student_in.course,
        specialization=student_in.specialization,
        hashed_password=hashed_pwd
    )
    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)
    
    return new_student

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Authenticate student and return JWT token using standard OAuth2 form."""
    # Using username field from OAuth2PasswordRequestForm as either roll_no or email
    from sqlalchemy import or_
    result = await db.execute(
        select(Student).where(
            or_(
                Student.roll_no == form_data.username.upper().strip(),
                Student.email == form_data.username.lower().strip()
            )
        )
    )
    student = result.scalar_one_or_none()
    
    if not student or not verify_password(form_data.password, student.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect roll number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": student.roll_no})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=StudentResponse)
async def get_current_user(current_student: Student = Depends(get_current_active_student)):
    """Return current authenticated user's profile."""
    return current_student
