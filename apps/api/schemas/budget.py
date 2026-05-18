from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BudgetEntryCreate(BaseModel):
    component: str          # "adu", "main", "small_house"
    category: str           # "labor", "materials", "permits", "other"
    amount: float
    description: Optional[str] = None


class BudgetEntryOut(BaseModel):
    id: int
    property_id: int
    component: str
    category: str
    amount: float
    description: Optional[str]
    logged_by_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetSummaryOut(BaseModel):
    property_id: int
    total_budget: float
    spent_so_far: float
    remaining: float
    percent_used: float
    by_component: dict
