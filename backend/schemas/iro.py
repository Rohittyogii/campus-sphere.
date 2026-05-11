from pydantic import BaseModel
from typing import Optional

class IROApplicationCreate(BaseModel):
    program: str
    university: str
    term: str
    cgpa: str
    purpose: str

class IROApplicationResponse(BaseModel):
    id: int
    student_id: int
    program: str
    university: str
    term: str
    cgpa: str
    purpose: str
    status: str
    created_at: str

    class Config:
        from_attributes = True
