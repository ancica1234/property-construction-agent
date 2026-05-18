from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from db.session import get_db
from models.property import Property
from models.portfolio import Portfolio
from core.security import get_current_user
from services.agent.roi import calculate_roi
from services.agent.scope_creep import analyze_scope_creep

router = APIRouter()


class AgentQuery(BaseModel):
    message: str
    property_id: Optional[int] = None


@router.post("/chat")
def chat_with_agent(
    payload: AgentQuery,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        from services.agent.graph import build_agent_state, run_agent
        prop = None
        if payload.property_id:
            prop = db.query(Property).join(Portfolio).filter(
                Property.id == payload.property_id,
                Portfolio.owner_id == current_user.id
            ).first()
            if not prop:
                raise HTTPException(status_code=404, detail="Property not found")
        state = build_agent_state(message=payload.message, property=prop)
        response = run_agent(state)
        return {"response": response}
    except Exception as e:
        return {"response": f"Agent unavailable: {str(e)}. Please check your OpenAI API key."}


@router.get("/roi/{property_id}")
def get_roi_analysis(
    property_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    prop = db.query(Property).join(Portfolio).filter(
        Property.id == property_id,
        Portfolio.owner_id == current_user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return calculate_roi(prop, db)


@router.get("/roi")
def get_portfolio_roi(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    properties = db.query(Property).join(Portfolio).filter(
        Portfolio.owner_id == current_user.id
    ).all()
    results = [calculate_roi(p, db) for p in properties]
    total_budget = sum(r["financials"]["total_budget"] for r in results)
    total_invested = sum(r["financials"]["total_invested"] for r in results)
    from services.agent.roi import get_monthly_expenses
    total_monthly_rent = sum(r["rental_income"]["monthly_gross"] for r in results)
    annual_gross = total_monthly_rent * 12
    monthly_expenses = get_monthly_expenses(total_monthly_rent)
    total_monthly_expenses = monthly_expenses["total"]
    annual_expenses = total_monthly_expenses * 12
    annual_net = annual_gross - annual_expenses
    portfolio_roi = (annual_net / total_budget * 100) if total_budget > 0 else 0
    payback = (total_budget / annual_net * 12) if annual_net > 0 else None
    return {
        "properties": results,
        "portfolio_summary": {
            "total_budget": total_budget,
            "total_invested": total_invested,
            "total_monthly_rent": total_monthly_rent,
            "annual_gross": annual_gross,
            "annual_expenses": round(annual_expenses, 2),
            "annual_net": round(annual_net, 2),
            "monthly_cashflow": round(annual_net / 12, 2),
            "monthly_expenses_breakdown": monthly_expenses,
            "portfolio_roi_pct": round(portfolio_roi, 1),
            "payback_months": round(payback, 0) if payback else None,
            "payback_years": round(payback / 12, 1) if payback else None,
        }
    }


@router.get("/scope-creep/{property_id}")
def get_scope_creep(
    property_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    prop = db.query(Property).join(Portfolio).filter(
        Property.id == property_id,
        Portfolio.owner_id == current_user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return analyze_scope_creep(prop, db)


@router.get("/scope-creep")
def get_portfolio_scope_creep(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    properties = db.query(Property).join(Portfolio).filter(
        Portfolio.owner_id == current_user.id
    ).all()
    results = [analyze_scope_creep(p, db) for p in properties]
    high_risk = [r for r in results if r["overall_risk"] in ["high", "over_budget"]]
    return {
        "properties": results,
        "portfolio_summary": {
            "total_properties": len(results),
            "high_risk_count": len(high_risk),
            "total_flags": sum(r["flags"]["total_flags"] for r in results),
        }
    }
