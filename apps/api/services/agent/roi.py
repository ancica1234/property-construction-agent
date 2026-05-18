from models.property import Property
from sqlalchemy.orm import Session

# Portfolio-level fixed monthly expenses (32nd Street Triplex - shared across all units)
PORTFOLIO_EXPENSES = {
    'mortgage': 1796.0,
    'loan': 909.0,
    'property_tax': round((4609.0 * 2) / 12, 2),
    'utilities': 150.0,
}

PROPERTY_MGMT_PCT = 0.05


def get_monthly_expenses(monthly_rent: float) -> dict:
    mgmt = round(monthly_rent * PROPERTY_MGMT_PCT, 2)
    fixed = sum(PORTFOLIO_EXPENSES.values())
    return {
        **PORTFOLIO_EXPENSES,
        'property_management': mgmt,
        'total': round(fixed + mgmt, 2),
    }


def calculate_roi(property: Property, db: Session, portfolio_expenses: float = None) -> dict:
    total_invested = property.spent_so_far or 0
    total_budget = property.total_budget or 0
    projected_rents = property.projected_rents or {}

    monthly_rent = sum(float(v) for v in projected_rents.values()) if projected_rents else 0
    annual_gross = monthly_rent * 12

    # Per-property ROI uses only property management as expense (mortgage is portfolio-level)
    mgmt = round(monthly_rent * PROPERTY_MGMT_PCT, 2)
    monthly_exp = mgmt
    annual_expenses = monthly_exp * 12
    annual_net = annual_gross - annual_expenses
    monthly_cashflow = annual_net / 12

    roi_on_budget = (annual_net / total_budget * 100) if total_budget > 0 else 0
    roi_on_spent = (annual_net / total_invested * 100) if total_invested > 0 else 0
    cap_rate = (annual_gross * 0.65 / total_budget * 100) if total_budget > 0 else 0
    payback_months = (total_budget / annual_net * 12) if annual_net > 0 else None
    budget_used_pct = (total_invested / total_budget * 100) if total_budget > 0 else 0
    remaining = total_budget - total_invested

    units = property.units_config or {}
    unit_rents = []
    for unit, cfg in units.items():
        rent = float(projected_rents.get(unit, 0))
        unit_rents.append({"unit": unit, "projected_rent": rent, "annual": rent * 12})

    health = "on_track" if budget_used_pct < 80 else ("warning" if budget_used_pct < 100 else "over_budget")

    return {
        "property_id": property.id,
        "property_name": property.name,
        "address": property.address,
        "status": property.status,
        "financials": {
            "total_budget": total_budget,
            "total_invested": total_invested,
            "remaining_budget": remaining,
            "budget_used_pct": round(budget_used_pct, 1),
        },
        "rental_income": {
            "monthly_gross": monthly_rent,
            "annual_gross": annual_gross,
            "annual_net": round(annual_net, 2),
            "monthly_cashflow": round(monthly_cashflow, 2),
            "unit_breakdown": unit_rents,
        },
        "returns": {
            "roi_on_budget_pct": round(roi_on_budget, 1),
            "roi_on_invested_pct": round(roi_on_spent, 1),
            "cap_rate_pct": round(cap_rate, 1),
            "payback_months": round(payback_months, 0) if payback_months else None,
            "payback_years": round(payback_months / 12, 1) if payback_months else None,
        },
        "health": {
            "status": health,
            "note": f"${total_invested:,.0f} spent of ${total_budget:,.0f} budget ({budget_used_pct:.1f}%)",
        }
    }
