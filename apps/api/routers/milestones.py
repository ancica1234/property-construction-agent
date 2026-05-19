from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from db.session import get_db
from models.milestone import PaymentMilestone
from core.security import get_current_user

router = APIRouter()


class MilestoneUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class MilestoneCreate(BaseModel):
    portfolio_id: int = 1
    contractor: str = "D & L Builders inc."
    deliverable: str
    amount: float
    unit: str = "general"
    order: int = 99


@router.post("/")
def create_milestone(
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    m = PaymentMilestone(
        portfolio_id=payload.portfolio_id,
        contractor=payload.contractor,
        deliverable=payload.deliverable,
        amount=payload.amount,
        unit=payload.unit,
        order=payload.order,
        status="pending",
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"id": m.id, "order": m.order, "contractor": m.contractor,
            "deliverable": m.deliverable, "amount": m.amount, "unit": m.unit,
            "status": m.status, "notes": m.notes,
            "completed_at": m.completed_at, "paid_at": m.paid_at}


@router.get("/summary")
def milestone_summary(
    portfolio_id: int = 1,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    items = db.query(PaymentMilestone).filter(
        PaymentMilestone.portfolio_id == portfolio_id
    ).all()
    total = sum(m.amount for m in items)
    paid = sum(m.amount for m in items if m.status == "paid")
    complete = sum(m.amount for m in items if m.status == "complete")
    pending = sum(m.amount for m in items if m.status == "pending")
    in_progress = sum(m.amount for m in items if m.status == "in_progress")
    return {
        "total_contract": total,
        "total_paid": paid,
        "total_complete_unpaid": complete,
        "total_pending": pending,
        "total_in_progress": in_progress,
        "remaining_balance": total - paid,
        "count": {
            "total": len(items),
            "paid": len([m for m in items if m.status=="paid"]),
            "complete": len([m for m in items if m.status=="complete"]),
            "in_progress": len([m for m in items if m.status=="in_progress"]),
            "pending": len([m for m in items if m.status=="pending"])
        }
    }


@router.get("/")
def list_milestones(
    portfolio_id: int = 1,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    items = db.query(PaymentMilestone).filter(
        PaymentMilestone.portfolio_id == portfolio_id
    ).order_by(PaymentMilestone.order).all()
    return [{"id": m.id, "order": m.order, "contractor": m.contractor,
             "deliverable": m.deliverable, "amount": m.amount, "unit": m.unit,
             "status": m.status, "notes": m.notes,
             "completed_at": m.completed_at, "paid_at": m.paid_at} for m in items]


@router.patch("/{milestone_id}")
def update_milestone(
    milestone_id: int,
    payload: MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    m = db.query(PaymentMilestone).filter(PaymentMilestone.id == milestone_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Milestone not found")
    if payload.status:
        m.status = payload.status
        if payload.status == "complete" and not m.completed_at:
            m.completed_at = datetime.utcnow()
        if payload.status == "paid" and not m.paid_at:
            m.paid_at = datetime.utcnow()
    if payload.notes is not None:
        m.notes = payload.notes
    db.commit()
    db.refresh(m)
    return {"id": m.id, "status": m.status, "notes": m.notes,
            "completed_at": m.completed_at, "paid_at": m.paid_at}
