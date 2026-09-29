import os

from datetime import datetime

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


class RatingCreate(BaseModel):
    booking_id: str
    stage: str
    rater_id: str
    ratee_id: str
    communication_score: int | None = None
    on_time: bool | None = None
    condition_as_described: bool | None = None
    condition_on_return_ok: bool | None = None
    comments: str | None = None


@router.post("")
def create_rating(payload: RatingCreate):
    if payload.stage not in ("pickup", "return"):
        raise HTTPException(status_code=400, detail="stage must be 'pickup' or 'return'")

    rating_data = {
        "booking_id": payload.booking_id,
        "stage": payload.stage,
        "rater_id": payload.rater_id,
        "ratee_id": payload.ratee_id,
        "communication_score": payload.communication_score,
        "on_time": payload.on_time,
        "condition_as_described": payload.condition_as_described,
        "condition_on_return_ok": payload.condition_on_return_ok,
        "comments": payload.comments,
    }

    try:
        insert_result = supabase.table("ratings").insert(rating_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    inserted = insert_result.data[0]

    try:
        booking_result = (
            supabase.table("bookings")
            .select("owner_id, renter_id")
            .eq("id", payload.booking_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]
    ratee_id = payload.ratee_id

    if ratee_id == booking["owner_id"]:
        score_field = "owner_score"
    elif ratee_id == booking["renter_id"]:
        score_field = "renter_score"
    else:
        raise HTTPException(
            status_code=400, detail="ratee_id is not a party to this booking"
        )

    try:
        ratings_result = (
            supabase.table("ratings")
            .select("communication_score")
            .eq("ratee_id", ratee_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    scores = [
        row["communication_score"]
        for row in ratings_result.data
        if row["communication_score"] is not None
    ]
    avg_score = sum(scores) / len(scores) if scores else 0

    try:
        existing = (
            supabase.table("reliability_scores")
            .select("user_id")
            .eq("user_id", ratee_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.utcnow().isoformat()

    if existing.data:
        try:
            supabase.table("reliability_scores").update(
                {score_field: avg_score, "updated_at": now}
            ).eq("user_id", ratee_id).execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        row_data = {
            "user_id": ratee_id,
            score_field: avg_score,
            "updated_at": now,
        }
        try:
            supabase.table("reliability_scores").insert(row_data).execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    return inserted