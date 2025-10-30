# backend/routers/settlement.py
from fastapi import APIRouter, HTTPException, Header
import os

router = APIRouter(prefix="/api/settlement", tags=["settlement"])

@router.get("/ping")
def settlement_ping():
    return {"ok": True, "service": "settlement"}

@router.post("/run")
def run_settlement(x_job_key: str | None = Header(None)):
    if x_job_key != os.getenv("SETTLEMENT_JOB_KEY"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    # 最小回傳
    return {"settled_drivers": 0, "total_amount": 0}
