from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.session import Base


class BudgetEntry(Base):
    __tablename__ = "budget_entries"

    id           = Column(Integer, primary_key=True, index=True)
    property_id  = Column(Integer, ForeignKey("properties.id"), nullable=False)
    component    = Column(String, nullable=False)   # "adu", "main", "small_house"
    category     = Column(String, nullable=False)   # "labor", "materials", "permits", "other"
    amount       = Column(Float, nullable=False)
    description  = Column(Text, nullable=True)
    logged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    property     = relationship("Property", back_populates="budget_entries")
    logged_by    = relationship("User")
