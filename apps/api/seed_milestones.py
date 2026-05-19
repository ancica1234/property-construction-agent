from db.session import SessionLocal, init_db
from models.milestone import PaymentMilestone

MILESTONES = [
    (1,  "Down-payment",                                                    1000.00,   "general"),
    (2,  "Upon Measure and order materials for Ally unit work",              10000.00,  "ally"),
    (3,  "Upon Demolition in process for Ally unit",                         5000.00,   "ally"),
    (4,  "Upon Demolition complete and haul away for Ally unit",             6000.00,   "ally"),
    (5,  "Upon bathroom remodeling in process for Ally unit",                5000.00,   "ally"),
    (6,  "Upon bathroom remodeling 50% complete for Ally unit",              5000.00,   "ally"),
    (7,  "Upon Bathroom remodeling is complete for Ally unit",               5000.00,   "ally"),
    (8,  "Upon electrical in process for Ally unit",                         3000.00,   "ally"),
    (9,  "Upon electrical is complete for Ally unit",                        3000.00,   "ally"),
    (10, "Upon framing in process for Ally unit",                            3000.00,   "ally"),
    (11, "Upon framing is complete for Ally unit",                           3500.00,   "ally"),
    (12, "Upon drywall and paint in process for Ally unit",                  3000.00,   "ally"),
    (13, "Upon drywall and paint is complete for Ally unit",                 5000.00,   "ally"),
    (14, "Upon plumbing is process for Ally unit",                           5000.00,   "ally"),
    (15, "Upon plumbing is complete for Ally unit",                          5000.00,   "ally"),
    (16, "Upon kitchen is in process for Ally unit",                         5000.00,   "ally"),
    (17, "Upon kitchen is 50% complete for Ally unit",                       5000.00,   "ally"),
    (18, "Upon kitchen is complete for Ally unit",                           5000.00,   "ally"),
    (19, "Upon installation of appliances and other fixtures for Ally unit", 2500.00,   "ally"),
    (20, "Upon Measure and order materials for ADU unit work",               12000.00,  "adu"),
    (21, "Upon Demolition in process ADU unit work",                         7500.00,   "adu"),
    (22, "Upon Demolition complete and haul away ADU unit work",             7000.00,   "adu"),
    (23, "Upon framing in process for ADU unit",                             7000.00,   "adu"),
    (24, "Upon framing is complete for ADU unit",                            7500.00,   "adu"),
    (25, "Upon roof in process for ADU unit",                                5000.00,   "adu"),
    (26, "Upon roof is complete for ADU unit",                               5000.00,   "adu"),
    (27, "Upon electrical in process for ADU unit",                          2500.00,   "adu"),
    (28, "Upon electrical is complete for ADU unit",                         2500.00,   "adu"),
    (29, "Upon plumbing is process for ADU unit",                            5000.00,   "adu"),
    (30, "Upon plumbing is complete for ADU unit",                           5000.00,   "adu"),
    (31, "Upon drywall and paint in process for ADU unit",                   2500.00,   "adu"),
    (32, "Upon drywall and paint is complete for ADU unit",                  2500.00,   "adu"),
    (33, "Upon bathroom remodeling in process for ADU unit",                 4500.00,   "adu"),
    (34, "Upon bathroom remodeling 50% complete for ADU unit",               5000.00,   "adu"),
    (35, "Upon Bathroom remodeling is complete for ADU unit",                5000.00,   "adu"),
    (36, "Upon kitchen is in process for ADU unit",                          5000.00,   "adu"),
    (37, "Upon kitchen is 50% complete for ADU unit",                        5000.00,   "adu"),
    (38, "Upon kitchen is complete for ADU unit",                            5000.00,   "adu"),
    (39, "Upon installation of appliances and other fixtures for ADU unit",  2500.00,   "adu"),
    (40, "Upon laundry hookup is complete in main house",                    3200.00,   "main"),
    (41, "Upon work is complete and the area is clean",                      2640.00,   "general"),
]

def seed_milestones():
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(PaymentMilestone).count()
        if existing > 0:
            print(f"Milestones already seeded ({existing} found), skipping.")
            return
        for order, deliverable, amount, unit in MILESTONES:
            m = PaymentMilestone(
                portfolio_id=1,
                contractor="D & L Builders inc.",
                deliverable=deliverable,
                amount=amount,
                unit=unit,
                order=order,
                status="pending",
            )
            db.add(m)
        db.commit()
        print(f"Seeded {len(MILESTONES)} milestones. Total: $193,840")
    finally:
        db.close()

if __name__ == "__main__":
    seed_milestones()
