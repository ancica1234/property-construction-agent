from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.contractor import AssignmentStatus


class AssignmentCreate(BaseModel):
    contractor_id: int
    phase: str
    scope_of_work: Optional[str] = None


class AssignmentUpdate(BaseModel):
    phase: Optional[str] = None
    scope_of_work: Optional[str] = None
    status: Optional[AssignmentStatus] = None


class AssignmentOut(BaseModel):
    id: int
    property_id: int
    contractor_id: int
    phase: str
    scope_of_work: Optional[str]
    status: AssignmentStatus
    assigned_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
