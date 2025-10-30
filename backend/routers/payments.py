# backend/routers/payments.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from pydantic import BaseModel
from typing import Literal, Optional
import os
from backend.database import get_db_connection

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("/ping")
def payments_ping():
    return {"ok": True, "service": "payments"}

class CreatePaymentIntentIn(BaseModel):
    order_id: int
    method: Literal["BANK_TRANSFER", "COD"]
    amount: float
    currency: str = "TWD"

@router.post("/intent")
def create_payment_intent(payload: CreatePaymentIntentIn):
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, payment_status FROM orders WHERE id=%s", (payload.order_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Order not found")
        if row[1] != "UNPAID":
            raise HTTPException(400, "Order already paid or in escrow")

        status = "AWAITING_VERIFICATION" if payload.method == "BANK_TRANSFER" else "PENDING"
        cur.execute("""
            INSERT INTO payments(order_id, method_code, amount, currency, status)
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT (order_id) DO UPDATE
              SET method_code=EXCLUDED.method_code, amount=EXCLUDED.amount, currency=EXCLUDED.currency, status=EXCLUDED.status
            RETURNING id, status
        """, (payload.order_id, payload.method, payload.amount, payload.currency, status))
        pid, st = cur.fetchone()
        conn.commit()
        return {"payment_id": pid, "status": st}

@router.post("/{payment_id}/proof")
def upload_payment_proof(payment_id: int, image: UploadFile = File(...), note: str = "", uploaded_by: Optional[int] = None):
    # TODO: 換成你們的實際檔案儲存流程；此處暫存檔名
    image_url = f"/uploads/{payment_id}_{image.filename}"
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT status FROM payments WHERE id=%s", (payment_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Payment not found")
        if row[0] not in ("AWAITING_VERIFICATION", "PENDING"):
            raise HTTPException(400, "Payment not awaiting proof")

        cur.execute("""INSERT INTO payment_proofs(payment_id, image_url, note, uploaded_by)
                       VALUES (%s,%s,%s,%s)""",
                    (payment_id, image_url, note, uploaded_by))
        conn.commit()
        return {"ok": True, "image_url": image_url}

class VerifyIn(BaseModel):
    approve: bool
    reason: Optional[str] = None

@router.post("/{payment_id}/verify")
def verify_payment(payment_id: int, body: VerifyIn, x_admin_key: Optional[str] = Header(None)):
    if x_admin_key != os.getenv("ADMIN_API_KEY"):
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT order_id, amount, currency, status FROM payments WHERE id=%s", (payment_id,))
        p = cur.fetchone()
        if not p:
            raise HTTPException(404, "Payment not found")
        order_id, amount, currency, status = p
        if status not in ("AWAITING_VERIFICATION", "PENDING"):
            raise HTTPException(400, "Invalid payment state")

        if body.approve:
            cur.execute("""INSERT INTO ledger_entries(ref_type, ref_id, account, delta, currency)
                           VALUES ('ORDER', %s, 'PLATFORM_ESCROW', %s, %s)""",
                        (order_id, amount, currency))
            cur.execute("UPDATE payments SET status='PAID_ESCROW', updated_at=NOW() WHERE id=%s", (payment_id,))
            cur.execute("UPDATE orders SET payment_status='ESCROWED' WHERE id=%s", (order_id,))
        else:
            cur.execute("UPDATE payments SET status='REJECTED', updated_at=NOW() WHERE id=%s", (payment_id,))
        conn.commit()
        return {"status": "PAID_ESCROW" if body.approve else "REJECTED"}
