"""
Campus Sphere — Common Dependencies
===================================
Authentication and session dependencies for FastAPI routes.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database.session import get_db
from backend.models.student import Student
from backend.services.auth_service import decode_access_token
from backend.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_student(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    roll_no: str = payload.get("sub")
    if roll_no is None:
        raise credentials_exception
    token_data = TokenData(roll_no=roll_no)

    result = await db.execute(select(Student).where(Student.roll_no == token_data.roll_no))
    student = result.scalar_one_or_none()
    
    if student is None:
        raise credentials_exception
    return student

async def get_current_active_student(current_student: Student = Depends(get_current_student)):
    if not current_student.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_student
