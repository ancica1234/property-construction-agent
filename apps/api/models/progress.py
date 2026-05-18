from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.session import Base


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id              = Column(Integer, primary_key=True, index=True)
    property_id     = Column(Integer, ForeignKey("properties.id"), nullable=False)
    contractor_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    phase           = Column(String, nullable=False)    # "electrical", "framing", "finishes"
    component       = Column(String, nullable=True)     # "adu", "main", "small_house"
    summary         = Column(Text, nullable=False)      # What was done today
    blockers        = Column(Text, nullable=True)       # Any blockers or issues
    photos          = Column(JSON, default=list)        # List of photo URLs
    percent_complete = Column(Integer, default=0)       # 0-100 for this phase
    logged_at       = Column(DateTime(timezone=True), server_default=func.now())
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    property        = relationship("Property", back_populates="progress_logs")
    contractor      = relationship("User", back_populates="progress_logs")
