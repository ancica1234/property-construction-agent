from datetime import datetime
from langchain_core.tools import tool


@tool
def update_and_track_budget(component: str, amount: float, notes: str = "") -> str:
    """Update spending on a component and return remaining budget with alerts."""
    total = 320000
    remaining = total - amount
    alert = "OVER 40% of total budget on single component!" if amount > total * 0.4 else ""
    return (
        f"Spent ${amount:,.0f} on {component}. "
        f"Remaining: ${remaining:,.0f}. "
        f"{alert} Notes: {notes}"
    )


@tool
def project_roi_and_cashflow(annual_expenses_pct: float = 0.35) -> str:
    """ROI calculator using 2026 San Diego 92116 market rents."""
    monthly_rent = 2100 + 3600 + 3000
    annual_gross = monthly_rent * 12
    annual_net = annual_gross * (1 - annual_expenses_pct)
    roi = (annual_net / 320000) * 100
    payback_months = (320000 / annual_net) * 12
    return (
        f"Gross monthly rent: ${monthly_rent:,.0f}\n"
        f"Annual gross: ${annual_gross:,.0f}\n"
        f"Annual net (after {annual_expenses_pct*100:.0f}% expenses): ${annual_net:,.0f}\n"
        f"ROI: {roi:.1f}%\n"
        f"Payback: ~{payback_months:.0f} months"
    )


@tool
def risk_and_inspection_checker(current_phase: str, last_inspection_date: str = None) -> str:
    """Check San Diego permit rules: 180-day inspection gap, SDG&E coordination."""
    today = datetime(2026, 4, 4)
    risks = []
    if "electrical" in current_phase.lower():
        risks.append("Coordinate SDG&E for 200A panel — cost $1,300-$5,500 + permit ~$165")
    if last_inspection_date:
        last = datetime.fromisoformat(last_inspection_date)
        days_since = (today - last).days
        if days_since > 150:
            risks.append(f"Approaching 180-day inspection limit ({days_since} days since last)")
    risk_summary = ", ".join(risks) if risks else "None major"
    return f"Risks for '{current_phase}': {risk_summary}. Next: Schedule rough electrical/plumbing soon."


@tool
def generate_detailed_checklist(phase: str, component: str = "all") -> str:
    """San Diego-specific construction checklists. Phases: early_construction, finishes"""
    checklists = {
        "early_construction": (
            "1. 200A panel upgrade + electrical permit\n"
            "2. ADU: Utility locates (call 811), rough plumbing/electrical\n"
            "3. Main addition: Framing + Title 24 energy compliance\n"
            "4. Small house: Coordinate overlapping finishes\n"
            "5. Confirm all sub-permits pulled before starting each trade"
        ),
        "finishes": (
            "1. Paint all units\n"
            "2. Install new flooring\n"
            "3. Install washer/dryer, dishwasher, appliances\n"
            "4. Schedule final inspections for Certificate of Occupancy\n"
            "5. Document everything for rental readiness"
        ),
    }
    result = checklists.get(phase)
    if result:
        return f"Checklist for '{phase}' ({component}):\n{result}"
    return "Phase not recognized. Available: early_construction, finishes"


@tool
def simulate_monthly_progress(current_month: str) -> str:
    """Project construction milestones 3-4 months forward. Months: April-August"""
    schedule = {
        "April": "April: Electrical panel & rough-ins. May target: Framing complete. Risk: Inspection scheduling.",
        "May": "May: Framing + Title 24 inspections. June target: Drywall + MEP signed off.",
        "June": "June: Drywall complete. Begin finishes. July target: Paint, flooring, appliances.",
        "July": "July: Final finishes. August target: Final inspections + Certificate of Occupancy.",
        "August": "August: Final inspections. Begin tenant marketing. Ensure CO before listing.",
    }
    return schedule.get(current_month, f"Month '{current_month}' not in project window (April-August 2026).")


ALL_TOOLS = [
    update_and_track_budget,
    project_roi_and_cashflow,
    risk_and_inspection_checker,
    generate_detailed_checklist,
    simulate_monthly_progress,
]
