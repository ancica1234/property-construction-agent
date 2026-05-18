from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProgressLogCreate(BaseModel):
    phase: str
    component: Optional[str] = None
    summary: str
    blockers: Optional[str] = None
    photos: List[str] = []
    percent_complete: int = 0


class ProgressLogOut(BaseModel):
    id: int
    property_id: int
    contractor_id: int
    phase: str
    component: Optional[str]
    summary: str
    blockers: Optional[str]
    photos: List[str]
    percent_complete: int
    logged_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
