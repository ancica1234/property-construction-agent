from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from models.property import PropertyStatus


class PropertyCreate(BaseModel):
    name: str
    address: str
    city: str = "San Diego"
    state: str = "CA"
    zip_code: str = "92116"
    description: Optional[str] = None
    total_budget: float = 0.0
    start_date: Optional[datetime] = None
    target_end_date: Optional[datetime] = None
    units_config: Dict[str, Any] = {}
    projected_rents: Dict[str, float] = {}


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PropertyStatus] = None
    total_budget: Optional[float] = None
    spent_so_far: Optional[float] = None
    start_date: Optional[datetime] = None
    target_end_date: Optional[datetime] = None
    units_config: Optional[Dict[str, Any]] = None
    projected_rents: Optional[Dict[str, float]] = None


class PropertyOut(BaseModel):
    id: int
    portfolio_id: int
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    description: Optional[str]
    status: PropertyStatus
    total_budget: float
    spent_so_far: float
    start_date: Optional[datetime]
    target_end_date: Optional[datetime]
    units_config: Dict[str, Any]
    projected_rents: Dict[str, float]
    created_at: datetime

    class Config:
        from_attributes = True
