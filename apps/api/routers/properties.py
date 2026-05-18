from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from models.property import Property
from models.portfolio import Portfolio
from schemas.property import PropertyCreate, PropertyUpdate, PropertyOut
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


@router.get("/", response_model=List[PropertyOut])
def list_properties(portfolio_id: int = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(Property).join(Portfolio).filter(Portfolio.owner_id == current_user.id)
    if portfolio_id:
        query = query.filter(Property.portfolio_id == portfolio_id)
    return query.all()


@router.post("/portfolios/{portfolio_id}/properties", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(portfolio_id: int, payload: PropertyCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.owner_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    prop = Property(**payload.model_dump(), portfolio_id=portfolio_id)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_property_for_user(property_id, current_user, db)


@router.patch("/{property_id}", response_model=PropertyOut)
def update_property(property_id: int, payload: PropertyUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prop = get_property_for_user(property_id, current_user, db)
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(prop, key, val)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prop = get_property_for_user(property_id, current_user, db)
    db.delete(prop)
    db.commit()
