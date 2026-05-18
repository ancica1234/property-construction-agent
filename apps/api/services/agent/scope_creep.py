from models.property import Property
from models.budget import BudgetEntry
from sqlalchemy.orm import Session
from collections import defaultdict


def analyze_scope_creep(property: Property, db: Session) -> dict:
    total_budget = property.total_budget or 0
    total_invested = property.spent_so_far or 0
    units_config = property.units_config or {}

    entries = db.query(BudgetEntry).filter(BudgetEntry.property_id == property.id).all()

    # Spending by component
    by_component = defaultdict(float)
    by_category = defaultdict(float)
    component_categories = defaultdict(lambda: defaultdict(float))

    for e in entries:
        by_component[e.component] += e.amount
        by_category[e.category] += e.amount
        component_categories[e.component][e.category] += e.amount

    # Expected components from units_config
    expected_components = set(units_config.keys()) if units_config else set()
    actual_components = set(by_component.keys())
    unexpected_components = actual_components - expected_components - {"all", "main", "small_house", "adu"}

    # Budget allocation per component (equal split as baseline)
    n_components = len(expected_components) or 1
    budget_per_component = total_budget / n_components

    flags = []
    component_analysis = []

    for comp, spent in by_component.items():
        pct_of_total = (spent / total_budget * 100) if total_budget > 0 else 0
        pct_of_allocation = (spent / budget_per_component * 100) if budget_per_component > 0 else 0
        cats = dict(component_categories[comp])

        risk = "on_track"
        risk_reasons = []

        if pct_of_allocation > 120:
            risk = "high"
            risk_reasons.append(f"{pct_of_allocation:.0f}% of allocated budget used")
        elif pct_of_allocation > 80:
            risk = "medium"
            risk_reasons.append(f"{pct_of_allocation:.0f}% of allocated budget used")

        if comp not in expected_components and comp not in ["all", "main", "small_house", "adu"]:
            risk = "high"
            risk_reasons.append("Unexpected component not in original scope")

        component_analysis.append({
            "component": comp,
            "spent": round(spent, 2),
            "pct_of_total_budget": round(pct_of_total, 1),
            "categories": cats,
            "risk": risk,
            "risk_reasons": risk_reasons,
        })

    # Overall scope creep score
    overall_pct = (total_invested / total_budget * 100) if total_budget > 0 else 0
    if overall_pct > 100:
        overall_risk = "over_budget"
        summary = f"OVER BUDGET: ${total_invested:,.0f} spent of ${total_budget:,.0f} ({overall_pct:.1f}%)"
    elif overall_pct > 80:
        overall_risk = "high"
        summary = f"WARNING: {overall_pct:.1f}% of budget used (${total_budget - total_invested:,.0f} remaining)"
    elif overall_pct > 50:
        overall_risk = "medium"
        summary = f"WATCH: {overall_pct:.1f}% of budget used (${total_budget - total_invested:,.0f} remaining)"
    else:
        overall_risk = "low"
        summary = f"ON TRACK: {overall_pct:.1f}% of budget used (${total_budget - total_invested:,.0f} remaining)"

    high_flags = [c for c in component_analysis if c["risk"] == "high"]
    medium_flags = [c for c in component_analysis if c["risk"] == "medium"]

    return {
        "property_id": property.id,
        "property_name": property.name,
        "overall_risk": overall_risk,
        "summary": summary,
        "financials": {
            "total_budget": total_budget,
            "total_spent": round(total_invested, 2),
            "remaining": round(total_budget - total_invested, 2),
            "pct_used": round(overall_pct, 1),
        },
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "component_analysis": sorted(component_analysis, key=lambda x: x["spent"], reverse=True),
        "flags": {
            "high_risk_components": high_flags,
            "medium_risk_components": medium_flags,
            "unexpected_components": list(unexpected_components),
            "total_flags": len(high_flags) + len(medium_flags),
        }
    }
