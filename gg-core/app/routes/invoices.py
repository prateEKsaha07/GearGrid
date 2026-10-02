import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

router = APIRouter()


class InvoiceCreate(BaseModel):
    booking_id: str
    deposit_returned: float
    deposit_retained: float
    deposit_retained_reason: str | None = None


@router.post("")
def create_invoice(payload: InvoiceCreate):
    try:
        booking_result = (
            supabase.table("bookings").select("*").eq("id", payload.booking_id).execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]
    listing_id = booking["listing_id"]

    try:
        listing_result = (
            supabase.table("equipment_listings")
            .select("price_per_day")
            .eq("id", listing_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not listing_result.data:
        raise HTTPException(status_code=404, detail="Listing not found")

    price_per_day = float(listing_result.data[0]["price_per_day"])

    try:
        ext_result = (
            supabase.table("extension_requests")
            .select("requested_days, extra_fee")
            .eq("booking_id", payload.booking_id)
            .eq("status", "approved")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    extension_days = sum(int(row["requested_days"]) for row in ext_result.data)
    extension_amount = sum(float(row["extra_fee"]) for row in ext_result.data)

    from datetime import date

    start = date.fromisoformat(booking["start_date"])
    end = date.fromisoformat(booking["end_date"])
    rental_days = (end - start).days + 1

    base_rental_amount = rental_days * price_per_day

    commission_rate = 0.05
    commission_amount = (base_rental_amount + extension_amount) * commission_rate

    tax_rate = 0.18
    tax_amount = commission_amount * tax_rate

    total_rental_charges = (
        base_rental_amount + extension_amount + commission_amount + tax_amount
    )

    net_deposit_position = payload.deposit_returned - payload.deposit_retained

    invoice_data = {
        "booking_id": payload.booking_id,
        "rental_days": rental_days,
        "extension_days": extension_days,
        "price_per_day": price_per_day,
        "base_rental_amount": base_rental_amount,
        "extension_amount": extension_amount,
        "commission_rate": commission_rate,
        "commission_amount": commission_amount,
        "tax_rate": tax_rate,
        "tax_amount": tax_amount,
        "total_rental_charges": total_rental_charges,
        "deposit_paid": float(booking["deposit_amount"]),
        "deposit_returned": payload.deposit_returned,
        "deposit_retained": payload.deposit_retained,
        "deposit_retained_reason": payload.deposit_retained_reason,
        "net_deposit_position": net_deposit_position,
    }

    try:
        insert_result = supabase.table("invoices").insert(invoice_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return insert_result.data[0]