import os
from datetime import date, timedelta

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime
from app.services.calendar_logic import has_overlap

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
router = APIRouter()

class ExtensionCreate(BaseModel):
    booking_id: str
    requested_days: int

@router.post("")
def create_extension(payload: ExtensionCreate):
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
    end_date = date.fromisoformat(booking["end_date"])

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

    extra_fee = payload.requested_days * price_per_day

    proposed_start = end_date + timedelta(days=1)
    proposed_end = end_date + timedelta(days=payload.requested_days)

    overlap = has_overlap(
        listing_id,
        proposed_start.isoformat(),
        proposed_end.isoformat(),
        exclude_booking_id=payload.booking_id,
    )

    status = "auto_blocked_conflict" if overlap else "pending"

    extension_data = {
        "booking_id": payload.booking_id,
        "requested_days": payload.requested_days,
        "extra_fee": extra_fee,
        "status": status,
    }

    try:
        insert_result = (
            supabase.table("extension_requests").insert(extension_data).execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return insert_result.data[0]

class ExtensionResolve(BaseModel):
    decision: str

@router.patch("/{id}/resolve")
def resolve_extension(id: str, payload: ExtensionResolve):
    if payload.decision not in ("approved", "declined"):
        raise HTTPException(status_code=400, detail="decision must be 'approved' or 'declined'")

    try:
        fetched = (
            supabase.table("extension_requests").select("*").eq("id", id).execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not fetched.data:
        raise HTTPException(status_code=404, detail="Extension request not found")

    extension = fetched.data[0]

    if extension["status"] == "auto_blocked_conflict":
        raise HTTPException(
            status_code=400, detail="Cannot resolve a blocked extension request"
        )

    now = datetime.utcnow().isoformat()

    if payload.decision == "approved":
        booking_id = extension["booking_id"]
        requested_days = int(extension["requested_days"])

        try:
            booking_result = (
                supabase.table("bookings").select("end_date").eq("id", booking_id).execute()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not booking_result.data:
            raise HTTPException(status_code=404, detail="Booking not found")

        current_end = date.fromisoformat(booking_result.data[0]["end_date"])
        new_end = current_end + timedelta(days=requested_days)

        try:
            supabase.table("bookings").update(
                {"end_date": new_end.isoformat()}
            ).eq("id", booking_id).execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        new_status = "approved"
    else:
        new_status = "declined"

    try:
        result = (
            supabase.table("extension_requests")
            .update({"status": new_status, "resolved_at": now})
            .eq("id", id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Extension request not found")

    return result.data[0]














