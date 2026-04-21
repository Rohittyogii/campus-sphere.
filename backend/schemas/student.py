from pydantic import BaseModel, EmailStr
from typing import Optional

class StudentBase(BaseModel):
    roll_no: str
    student_name: str
    email: EmailStr
    branch: Optional[str] = None
    course: Optional[str] = None
    specialization: Optional[str] = None
    section: Optional[str] = None
    career_objective: Optional[str] = None
    technical_skills: Optional[str] = None
    soft_skills: Optional[str] = None
    personal_skills: Optional[str] = None

class StudentCreate(StudentBase):
    password: str

class StudentLogin(BaseModel):
    roll_no: str
    password: str

class StudentResponse(StudentBase):
    id: int
    role: str
    is_active: bool

    class Config:
        from_attributes = True
