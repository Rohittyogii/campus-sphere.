from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AnnouncementBase(BaseModel):
    title: str
    description: str
    type: str = "info"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
