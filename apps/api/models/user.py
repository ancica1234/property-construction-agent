from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from db.session import Base


class UserRole(str, enum.Enum):
    investor = "investor"
    contractor = "contractor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String, unique=True, index=True, nullable=False)
    full_name    = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role         = Column(Enum(UserRole), default=UserRole.investor, nullable=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    portfolios   = relationship("Portfolio", back_populates="owner", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="contractor")
