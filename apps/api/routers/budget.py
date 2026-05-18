from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from models.budget import BudgetEntry
from models.property import Property
from models.portfolio import Portfolio
from schemas.budget import BudgetEntryCreate, BudgetEntryOut, BudgetSummaryOut
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


@router.get("/{property_id}/entries", response_model=List[BudgetEntryOut])
def list_budget_entries(property_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    get_property_for_user(property_id, current_user, db)
    return db.query(BudgetEntry).filter(BudgetEntry.property_id == property_id).all()


@router.post("/{property_id}/entries", response_model=BudgetEntryOut)
def add_budget_entry(property_id: int, payload: BudgetEntryCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prop = get_property_for_user(property_id, current_user, db)
    entry = BudgetEntry(**payload.model_dump(), property_id=property_id, logged_by_id=current_user.id)
    db.add(entry)
    prop.spent_so_far = (prop.spent_so_far or 0) + payload.amount
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{property_id}/summary", response_model=BudgetSummaryOut)
def budget_summary(property_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prop = get_property_for_user(property_id, current_user, db)
    entries = db.query(BudgetEntry).filter(BudgetEntry.property_id == property_id).all()

    by_component = {}
    for e in entries:
        by_component[e.component] = by_component.get(e.component, 0) + e.amount

    spent = prop.spent_so_far or 0
    total = prop.total_budget or 0
    remaining = total - spent
    percent = (spent / total * 100) if total > 0 else 0

    return {
        "property_id": property_id,
        "total_budget": total,
        "spent_so_far": spent,
        "remaining": remaining,
        "percent_used": round(percent, 1),
        "by_component": by_component,
    }


@router.delete('/{property_id}/entries/{entry_id}')
def delete_budget_entry(property_id: int, entry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prop = get_property_for_user(property_id, current_user, db)
    entry = db.query(BudgetEntry).filter(BudgetEntry.id == entry_id, BudgetEntry.property_id == property_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail='Entry not found')
    prop.spent_so_far = max(0, (prop.spent_so_far or 0) - entry.amount)
    db.delete(entry)
    db.commit()
    return {'deleted': entry_id}


@router.put('/{property_id}/entries/{entry_id}', response_model=BudgetEntryOut)
def update_budget_entry(property_id: int, entry_id: int, payload: BudgetEntryCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prop = get_property_for_user(property_id, current_user, db)
    entry = db.query(BudgetEntry).filter(BudgetEntry.id == entry_id, BudgetEntry.property_id == property_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail='Entry not found')
    # Adjust spent_so_far
    prop.spent_so_far = max(0, (prop.spent_so_far or 0) - entry.amount + payload.amount)
    entry.component = payload.component
    entry.category = payload.category
    entry.amount = payload.amount
    entry.description = payload.description
    db.commit()
    db.refresh(entry)
    return entry
