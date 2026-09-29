import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

router = APIRouter()

VALID_PAYMENT_TYPES = (
    "deposit_paid",
    "rental_paid",
    "extension_paid",
    "deposit_returned",
)

class PaymentCreate(BaseModel):
    booking_id: str
    payment_type: str
    payer_id: str
    receiver_id: str
    amount: float
    method: str | None = None

@router.post("")
def create_payment(payload: PaymentCreate):
    if payload.payment_type not in VALID_PAYMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"payment_type must be one of {', '.join(VALID_PAYMENT_TYPES)}",
        )

    payment_data = {
        "booking_id": payload.booking_id,
        "payment_type": payload.payment_type,
        "payer_id": payload.payer_id,
        "receiver_id": payload.receiver_id,
        "amount": payload.amount,
        "method": payload.method,
        "payer_confirmed": False,
        "receiver_confirmed": False,
        "status": "pending",
    }

    try:
        result = supabase.table("payment_confirmations").insert(payment_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return result.data[0]

class PaymentConfirm(BaseModel):
    confirmer: str

@router.patch("/{id}/confirm")
def confirm_payment(id: str, payload: PaymentConfirm):
    if payload.confirmer not in ("payer", "receiver"):
        raise HTTPException(status_code=400, detail="confirmer must be 'payer' or 'receiver'")

    now = datetime.utcnow().isoformat()

    if payload.confirmer == "payer":
        update_fields = {"payer_confirmed": True, "payer_confirmed_at": now}
    else:
        update_fields = {"receiver_confirmed": True, "receiver_confirmed_at": now}

    try:
        result = (
            supabase.table("payment_confirmations")
            .update(update_fields)
            .eq("id", id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    row = result.data[0]

    if row.get("payer_confirmed") and row.get("receiver_confirmed"):
        try:
            final_result = (
                supabase.table("payment_confirmations")
                .update({"status": "confirmed"})
                .eq("id", id)
                .execute()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        if final_result.data:
            row = final_result.data[0]

    return row












