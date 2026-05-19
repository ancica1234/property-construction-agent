from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from db.session import Base


class PaymentMilestone(Base):
    __tablename__ = "payment_milestones"

    id           = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    contractor   = Column(String, nullable=False)  # D & L Builders inc.
    deliverable  = Column(Text, nullable=False)
    amount       = Column(Float, nullable=False)
    unit         = Column(String, nullable=True)   # ally, adu, main, general
    order        = Column(Integer, nullable=False)  # 1-41
    status       = Column(String, default="pending")  # pending, in_progress, complete, paid
    completed_at = Column(DateTime(timezone=True), nullable=True)
    paid_at      = Column(DateTime(timezone=True), nullable=True)
    notes        = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

