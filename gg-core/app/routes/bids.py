import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from typing import Literal
from app.services.calendar_logic import has_overlap

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
router = APIRouter()

class BidCreate(BaseModel):
    bidder_id: str
    proposed_price: float
    proposed_start: str
    proposed_end: str
    listing_id: str | None = None
    request_id: str | None = None

@router.post("")
def create_bid(payload: BidCreate):
    if payload.listing_id is None and payload.request_id is None:
        raise HTTPException(status_code=400, detail="Must provide listing_id or request_id")

    try:
        result = supabase.table("bids").insert(payload.model_dump(exclude_none=True)).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return result.data[0]

@router.get("")
def list_bids(
    listing_id: str | None = None,
    request_id: str | None = None,
    bidder_id: str | None = None,
):
    query = supabase.table("bids").select("*")
    if listing_id is not None:
        query = query.eq("listing_id", listing_id)
    if request_id is not None:
        query = query.eq("request_id", request_id)
    if bidder_id is not None:
        query = query.eq("bidder_id", bidder_id)

    try:
        result = query.execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result.data

class BidUpdate(BaseModel):
    status: Literal["pending", "accepted", "rejected", "auto_rejected_overlap"]

@router.patch("/{id}")
def update_bid(id: str, payload: BidUpdate):
    if payload.status != "accepted":
        try:
            result = (
                supabase.table("bids")
                .update({"status": payload.status})
                .eq("id", id)
                .execute()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not result.data:
            raise HTTPException(status_code=404, detail="Bid not found")

        return result.data[0]

    try:
        fetched = supabase.table("bids").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not fetched.data:
        raise HTTPException(status_code=404, detail="Bid not found")

    bid = fetched.data[0]
    listing_id = bid["listing_id"]
    proposed_start = bid["proposed_start"]
    proposed_end = bid["proposed_end"]

    if listing_id is None:
        raise HTTPException(status_code=400, detail="Cannot accept a bid without listing_id")

    if has_overlap(listing_id, proposed_start, proposed_end):
        raise HTTPException(status_code=409, detail="Slot conflict — dates unavailable")

    try:
        result = (
            supabase.table("bids")
            .update({"status": "accepted"})
            .eq("id", id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Bid not found")

    try:
        supabase.table("bids").update({"status": "auto_rejected_overlap"}).eq(
            "listing_id", listing_id
        ).eq("status", "pending").lte("proposed_start", proposed_end).gte(
            "proposed_end", proposed_start
        ).neq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result.data[0]







