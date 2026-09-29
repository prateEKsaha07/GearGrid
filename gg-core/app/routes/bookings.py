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


class BookingCreate(BaseModel):
    bid_id: str
    deposit_amount: float


@router.post("")
def create_booking(payload: BookingCreate):
    try:
        bid_result = supabase.table("bids").select("*").eq("id", payload.bid_id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not bid_result.data:
        raise HTTPException(status_code=404, detail="Bid not found")

    bid = bid_result.data[0]
    listing_id = bid["listing_id"]

    if listing_id is None:
        raise HTTPException(status_code=400, detail="Bid has no listing_id")

    try:
        listing_result = supabase.table("equipment_listings").select("*").eq("id", listing_id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not listing_result.data:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing = listing_result.data[0]

    booking_data = {
        "listing_id": listing_id,
        "bid_id": payload.bid_id,
        "owner_id": listing["owner_id"],
        "renter_id": bid["bidder_id"],
        "start_date": bid["proposed_start"],
        "end_date": bid["proposed_end"],
        "deposit_amount": payload.deposit_amount,
        "deposit_status": "pending",
        "status": "confirmed",
    }

    try:
        insert_result = supabase.table("bookings").insert(booking_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    try:
        supabase.table("equipment_listings").update({"status": "booked"}).eq(
            "id", listing_id
        ).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return insert_result.data[0]