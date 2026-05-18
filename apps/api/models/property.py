from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from db.session import Base


class PropertyStatus(str, enum.Enum):
    planning          = "planning"
    permits_pending   = "permits_pending"
    permits_acquired  = "permits_acquired"
    in_construction   = "in_construction"
    finishes          = "finishes"
    completed         = "completed"


class Property(Base):
    __tablename__ = "properties"

    id              = Column(Integer, primary_key=True, index=True)
    portfolio_id    = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    name            = Column(String, nullable=False)
    address         = Column(String, nullable=False)
    city            = Column(String, default="San Diego")
    state           = Column(String, default="CA")
    zip_code        = Column(String, default="92116")
    description     = Column(Text, nullable=True)

    # Construction status
    status          = Column(Enum(PropertyStatus), default=PropertyStatus.planning)

    # Financial
    total_budget    = Column(Float, default=0.0)
    spent_so_far    = Column(Float, default=0.0)

    # Timeline
    start_date      = Column(DateTime(timezone=True), nullable=True)
    target_end_date = Column(DateTime(timezone=True), nullable=True)

    # Flexible JSON fields for units, rents, configs
    units_config    = Column(JSON, default=dict)   # {"adu": {"sqft": 450, "config": "1BR/1BA", "budget": 127000}}
    projected_rents = Column(JSON, default=dict)   # {"adu": 2100, "main": 3600}

    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    portfolio       = relationship("Portfolio", back_populates="properties")
    budget_entries  = relationship("BudgetEntry", back_populates="property", cascade="all, delete-orphan")
    progress_logs   = relationship("ProgressLog", back_populates="property", cascade="all, delete-orphan")
    assignments     = relationship("ContractorAssignment", back_populates="property", cascade="all, delete-orphan")
