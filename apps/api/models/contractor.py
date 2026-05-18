from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from db.session import Base


class AssignmentStatus(str, enum.Enum):
    active    = "active"
    completed = "completed"
    removed   = "removed"


class ContractorAssignment(Base):
    __tablename__ = "contractor_assignments"

    id              = Column(Integer, primary_key=True, index=True)
    property_id     = Column(Integer, ForeignKey("properties.id"), nullable=False)
    contractor_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    phase           = Column(String, nullable=False)   # "electrical", "framing", "finishes"
    scope_of_work   = Column(Text, nullable=True)
    status          = Column(Enum(AssignmentStatus), default=AssignmentStatus.active)
    assigned_at     = Column(DateTime(timezone=True), server_default=func.now())
    completed_at    = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    property        = relationship("Property", back_populates="assignments")
    contractor      = relationship("User")
