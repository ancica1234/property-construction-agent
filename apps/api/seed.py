"""
Seed script — creates default investor user + 3 real properties
Run: python seed.py
"""

import sys
from db.session import SessionLocal, init_db
from models.user import User, UserRole
from models.portfolio import Portfolio
from models.property import Property, PropertyStatus
from core.security import hash_password

def seed():
    init_db()
    db = SessionLocal()

    try:
        # ── 1. Create investor user if not exists ──────────────────────────
        email = "owner@pca.dev"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name="Property Owner",
                hashed_password=hash_password("password123"),
                role=UserRole.investor,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user: {user.email}")
        else:
            print(f"User already exists: {user.email}")

        # ── 2. Create portfolio if not exists ──────────────────────────────
        portfolio = db.query(Portfolio).filter(Portfolio.owner_id == user.id).first()
        if not portfolio:
            portfolio = Portfolio(
                name="32nd Street Triplex",
                description="San Diego 92116 — 3-unit construction project",
                owner_id=user.id,
            )
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
            print(f"Created portfolio: {portfolio.name}")
        else:
            print(f"Portfolio already exists: {portfolio.name}")

        # ── 3. Seed properties ─────────────────────────────────────────────
        properties = [
            {
                "name": "Main House — 4577 32nd St",
                "address": "4577 32nd Street",
                "city": "San Diego",
                "state": "CA",
                "zip_code": "92116",
                "description": "1,100 sqft main house. Adding room + bath, 200A panel upgrade, repaint, new floors, washer/dryer, dishwasher.",
                "status": PropertyStatus.in_construction,
                "total_budget": 100000.0,
                "spent_so_far": 0.0,
                "units_config": {
                    "main": {
                        "sqft": 1100,
                        "config": "3BR/2BA post-addition",
                        "budget": 100000
                    }
                },
                "projected_rents": {"main": 3600},
            },
            {
                "name": "Small House — 4575 32nd St",
                "address": "4575 32nd Street",
                "city": "San Diego",
                "state": "CA",
                "zip_code": "92116",
                "description": "875 sqft small house. 2BR/2BA — minimal changes, paint, floors, appliances.",
                "status": PropertyStatus.permits_acquired,
                "total_budget": 90000.0,
                "spent_so_far": 0.0,
                "units_config": {
                    "small_house": {
                        "sqft": 875,
                        "config": "2BR/2BA",
                        "budget": 90000
                    }
                },
                "projected_rents": {"small_house": 3000},
            },
            {
                "name": "ADU Conversion — 4773 32nd St",
                "address": "4773 32nd Street",
                "city": "San Diego",
                "state": "CA",
                "zip_code": "92116",
                "description": "450 sqft garage-to-ADU conversion. 1BR/1BA. Permits already acquired. Rough-in electrical and plumbing next.",
                "status": PropertyStatus.permits_acquired,
                "total_budget": 127000.0,
                "spent_so_far": 0.0,
                "units_config": {
                    "adu": {
                        "sqft": 450,
                        "config": "1BR/1BA",
                        "budget": 127000,
                        "type": "garage conversion"
                    }
                },
                "projected_rents": {"adu": 2100},
            },
        ]

        for prop_data in properties:
            existing = db.query(Property).filter(
                Property.address == prop_data["address"],
                Property.portfolio_id == portfolio.id
            ).first()
            if existing:
                print(f"Property already exists: {prop_data['name']}")
                continue
            prop = Property(**prop_data, portfolio_id=portfolio.id)
            db.add(prop)
            db.commit()
            db.refresh(prop)
            print(f"Created property: {prop.name} (id={prop.id})")

        print("\n✅ Seed complete!")
        print(f"   Login: {email} / password123")
        print(f"   Portfolio: {portfolio.name} (id={portfolio.id})")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
