from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from models.progress import ProgressLog
from models.property import Property
from models.portfolio import Portfolio
from models.user import UserRole
from schemas.progress import ProgressLogCreate, ProgressLogOut
from core.security import get_current_user

router = APIRouter()


@router.post("/{property_id}/logs", response_model=ProgressLogOut, status_code=status.HTTP_201_CREATED)
def add_progress_log(
    property_id: int,
    payload: ProgressLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in (UserRole.contractor, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only contractors can log progress")
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    log = ProgressLog(
        **payload.model_dump(),
        property_id=property_id,
        contractor_id=current_user.id
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{property_id}/logs", response_model=List[ProgressLogOut])
def list_progress_logs(
    property_id: int,
    phase: str = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(ProgressLog).filter(ProgressLog.property_id == property_id)
    if phase:
        query = query.filter(ProgressLog.phase == phase)
    return query.order_by(ProgressLog.logged_at.desc()).all()


@router.get("/{property_id}/logs/latest", response_model=List[ProgressLogOut])
def latest_progress(
    property_id: int,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(ProgressLog).filter(
        ProgressLog.property_id == property_id
    ).order_by(ProgressLog.logged_at.desc()).limit(limit).all()
