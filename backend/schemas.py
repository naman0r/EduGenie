from pydantic import BaseModel, Field
from typing import Optional, Union
from uuid import UUID
from datetime import datetime


# all of my pydantic models live here :-------
class UserAuth(BaseModel):
    google_id: str
    email: Optional[str]
    full_name: Optional[str]
    avatar_url: Optional[str]

class UserProfileUpdate(BaseModel):
    academic_year: Optional[int]
    academic_level: Optional[str]
    institution: Optional[str]
    full_name: Optional[str]

class ClassCreate(BaseModel):
    name: str
    code: Optional[str]
    instructor: Optional[str]

class ClassInfo(ClassCreate):
    id: UUID
    user_id: str
    created_at: datetime
    class Config:
        orm_mode = True

# …and so on for ResourceCreate, ResourceInfo, CalendarEventCreate
