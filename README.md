# Property Construction Agent

A full-stack construction project management platform for San Diego real estate investors — built with Next.js, FastAPI, and PostgreSQL.

## Overview

Manage a multi-unit property portfolio through construction: track budgets, monitor contractor progress, import expenses, and get real-time ROI and scope creep analysis.

---

## Features

### Portfolio & Property Management
- Multi-property portfolio dashboard with budget charts
- Property status tracking: planning → permits → construction → finishes → completed
- Budget overview with spent/remaining and progress bar per property
- Units config and editable projected rent per unit

### Budget & Expense Tracking
- Add budget entries manually via form
- Inline edit and delete of individual expense entries
- Automatic spent_so_far recalculation on add/edit/delete
- Charts: donut (budget used vs remaining) + horizontal bar (by component)

### Excel/CSV Bulk Import
- Drag & drop or browse `.xlsx`, `.xls`, `.csv` files
- Auto-detects header row (skips title/blank rows at top)
- Columns: `Date | Contractor | Property | Category | Amount | Source`
- Smart property matching: `big house / main / 4577` → Main House
- Preview table with per-row validation before importing
- Date formatting with `dateNF` option for Excel date serials

### Portfolio Intelligence
- **ROI Agent**: Real cashflow using actual rents and operating expenses
  - Mortgage ($1,796/mo), loan ($909/mo), property tax ($768/mo), utilities ($150/mo), property management (5%)
  - Per-property ROI, cap rate, payback period
  - Portfolio-wide monthly cashflow summary
- **Scope Creep Agent**: Budget usage by component
  - Risk levels: On Track / Watch / High / Over Budget
  - Category breakdown with progress bars
  - Flags unexpected or over-allocated components

### Contractor Management
- Add and manage contractors
- Assign contractors to properties by phase
- Contractors log progress: phase, component, percent complete, blockers
- Dedicated contractor portal

### AI Agent (GPT-4o)
- Per-property chat interface in the AI Agent tab
- Context-aware: budget, status, timeline, units config
- Tools: budget tracking, ROI projection, risk checker, checklists, milestone simulation
- Graceful fallback when OpenAI key is not configured

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| State | TanStack Query v5 |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL + SQLAlchemy |
| Auth | JWT (investor + contractor roles) |
| AI | LangChain + LangGraph + GPT-4o |
| Excel Parse | SheetJS (xlsx) |
| PDF Parse | pdfjs-dist |

---

## Project Structure

```
property-construction-agent/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── routers/            # auth, properties, budget, contractors, progress, agent
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/
│   │   │   └── agent/          # roi.py, scope_creep.py, graph.py, tools.py
│   │   └── main.py
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── dashboard/      # Portfolio overview with charts
│       │   ├── portfolio/      # Property list + detail pages
│       │   │   └── upload/     # Bulk expense import
│       │   ├── agents/         # Portfolio Intelligence (ROI + scope creep)
│       │   └── contractor/     # Contractor portal
│       ├── components/         # Navbar, UI
│       └── lib/                # API client, auth, types
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL

### Backend

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
python seed.py
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Investor | investor@example.com | password123 |
| Contractor | contractor@example.com | password123 |

---

## Expense Import Format

| Date | Contractor | Property | Category | Amount | Source |
|------|-----------|----------|----------|--------|--------|
| 4/6/26 | D&L Builders | adu | labor | 5000 | savings |
| 4/11/26 | Oscar | big house | plumbing | 3361.50 | Chase cc |
| 5/5/26 | Rhona | big house | legal | 3500 | Wells Fargo |

**Property keywords:**
- `big house`, `main`, `4577` → Main House — 4577 32nd St
- `alley`, `small`, `4575` → Small House — 4575 32nd St
- `adu`, `garage`, `4773` → ADU Conversion — 4773 32nd St

---

## Operating Expenses

| Expense | Monthly |
|---------|---------|
| Mortgage | $1,796 |
| Loan | $909 |
| Property Tax | $768 ($4,609 × 2 / 12) |
| Utilities | $150 |
| Property Mgmt | 5% of gross rent |
| **Total** | **~$4,113** |

Monthly gross rent: $9,800 ($3,900 + $3,700 + $2,200)
Monthly net cashflow: ~$5,687

---

## License

Private — All rights reserved.
