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
    request_id = bid["request_id"]

    if listing_id is None and request_id is None:
        raise HTTPException(status_code=400, detail="Bid has neither listing_id nor request_id")

    if listing_id is not None:
        try:
            listing_result = (
                supabase.table("equipment_listings")
                .select("*")
                .eq("id", listing_id)
                .execute()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not listing_result.data:
            raise HTTPException(status_code=404, detail="Listing not found")

        listing = listing_result.data[0]
        owner_id = listing["owner_id"]
        renter_id = bid["bidder_id"]
        start_date = bid["proposed_start"]
        end_date = bid["proposed_end"]
    else:
        try:
            request_result = (
                supabase.table("rental_requests")
                .select("*")
                .eq("id", request_id)
                .execute()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not request_result.data:
            raise HTTPException(status_code=404, detail="Request not found")

        rental_request = request_result.data[0]
        owner_id = bid["bidder_id"]
        renter_id = rental_request["renter_id"]
        start_date = bid["proposed_start"]
        end_date = bid["proposed_end"]

    booking_data = {
        "listing_id": listing_id,
        "bid_id": payload.bid_id,
        "owner_id": owner_id,
        "renter_id": renter_id,
        "start_date": start_date,
        "end_date": end_date,
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

    if listing_id is not None:
        try:
            supabase.table("equipment_listings").update({"status": "booked"}).eq(
                "id", listing_id
            ).select().execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    return insert_result.data[0]


@router.get("")
def list_bookings(
    owner_id: str | None = None,
    renter_id: str | None = None,
    status: str | None = None,
):
    query = supabase.table("bookings").select("*")
    if owner_id is not None:
        query = query.eq("owner_id", owner_id)
    if renter_id is not None:
        query = query.eq("renter_id", renter_id)
    if status is not None:
        query = query.eq("status", status)

    try:
        result = query.execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result.data


@router.get("/{id}")
def get_booking(id: str):
    try:
        result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    return result.data[0]