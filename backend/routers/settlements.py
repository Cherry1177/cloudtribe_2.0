# backend/routers/settlement.py
from fastapi import APIRouter, HTTPException, Header
from collections import defaultdict
from datetime import datetime
import pytz, os
from backend.database import get_db_connection

router = APIRouter(prefix="/api/settlement", tags=["settlement"])
TZ = pytz.timezone("Asia/Taipei")

@router.get("/ping")
def settlement_ping():
    return {"ok": True, "service": "settlement"}

@router.post("/run")
def run_settlement(x_job_key: str | None = Header(None)):
    if x_job_key != os.getenv("SETTLEMENT_JOB_KEY"):
        raise HTTPException(401, "Unauthorized")

    today = datetime.now(TZ).date()
    start = datetime.combine(today, datetime.min.time()).astimezone(TZ)
    end   = datetime.combine(today, datetime.max.time()).astimezone(TZ)

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT o.id, o.driver_id, p.amount
            FROM orders o
            JOIN payments p ON p.order_id = o.id
            WHERE o.delivery_status='DELIVERED'
              AND o.delivered_at >= %s AND o.delivered_at <= %s
              AND p.status='PAID_ESCROW'
        """, (start, end))
        rows = cur.fetchall()

        sums = defaultdict(lambda: 0.0)
        for oid, did, amt in rows:
            sums[did] += float(amt)

        for driver_id, total in sums.items():
            cur.execute("""
              INSERT INTO driver_payouts(driver_id, settle_date, amount, status)
              VALUES (%s, %s, %s, 'SCHEDULED')
              ON CONFLICT (driver_id, settle_date)
              DO UPDATE SET amount=EXCLUDED.amount, status='SCHEDULED'
              RETURNING id
            """, (driver_id, today, total))
            payout_id = cur.fetchone()[0]

            cur.execute("""INSERT INTO ledger_entries(ref_type, ref_id, account, delta, currency)
                           VALUES ('PAYOUT', %s, 'PLATFORM_ESCROW', %s, 'TWD')""",
                        (payout_id, -total))
            cur.execute("""INSERT INTO ledger_entries(ref_type, ref_id, account, delta, currency)
                           VALUES ('PAYOUT', %s, 'DRIVER_WALLET', %s, 'TWD')""",
                        (payout_id, total))

        conn.commit()
        return {"settled_drivers": len(sums), "total_amount": sum(sums.values())}
