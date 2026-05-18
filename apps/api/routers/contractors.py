from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from models.contractor import ContractorAssignment
from models.property import Property
from models.portfolio import Portfolio
from models.user import User, UserRole
from schemas.contractor import AssignmentCreate, AssignmentUpdate, AssignmentOut
from core.security import get_current_user

router = APIRouter()


def get_property_for_user(property_id: int, current_user, db: Session):
    prop = db.query(Property).join(Portfolio).filter(
        Property.id == property_id,
        Portfolio.owner_id == current_user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.get("/", response_model=List[dict])
def list_contractors(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    contractors = db.query(User).filter(User.role == UserRole.contractor, User.is_active == True).all()
    return [{"id": c.id, "full_name": c.full_name, "email": c.email} for c in contractors]


@router.post("/properties/{property_id}/assign", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def assign_contractor(property_id: int, payload: AssignmentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_property_for_user(property_id, current_user, db)
    contractor = db.query(User).filter(User.id == payload.contractor_id, User.role == UserRole.contractor).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    assignment = ContractorAssignment(**payload.model_dump(), property_id=property_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/properties/{property_id}/assignments", response_model=List[AssignmentOut])
def list_assignments(property_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_property_for_user(property_id, current_user, db)
    return db.query(ContractorAssignment).filter(ContractorAssignment.property_id == property_id).all()


@router.patch("/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(assignment_id: int, payload: AssignmentUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    assignment = db.query(ContractorAssignment).filter(ContractorAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, key, val)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get('/my-assignments', response_model=List[dict])
def my_assignments(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    assignments = db.query(ContractorAssignment).filter(
        ContractorAssignment.contractor_id == current_user.id,
        ContractorAssignment.status == "active"
    ).all()
    result = []
    for a in assignments:
        prop = db.query(Property).filter(Property.id == a.property_id).first()
        result.append({
            "id": a.id,
            "property_id": a.property_id,
            "property_name": prop.name if prop else None,
            "property_address": prop.address if prop else None,
            "phase": a.phase,
            "scope_of_work": a.scope_of_work,
            "status": a.status,
            "assigned_at": a.assigned_at,
        })
    return result
