import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from typing import Optional

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
router = APIRouter()


class RequestCreate(BaseModel):
    renter_id: str
    category: str
    task_description: str
    needed_from: str
    needed_to: str
    pincode: str
    voice_input_used: bool = False


@router.post("")
def create_request(payload: RequestCreate):
    try:
        result = supabase.table("rental_requests").insert(payload.model_dump()).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return result.data[0]


@router.get("")
def list_requests(
    pincode: str | None = None,
    category: str | None = None,
    renter_id: str | None = None,
    status: str | None = None,
):
    query = supabase.table("rental_requests").select("*")

    if renter_id is not None:
        query = query.eq("renter_id", renter_id)
        if status is not None:
            query = query.eq("status", status)
    elif status is not None:
        query = query.eq("status", status)
    else:
        query = query.eq("status", "open")

    if pincode is not None:
        query = query.eq("pincode", pincode)

    if category is not None:
        query = query.ilike("category", f"%{category}%")

    try:
        result = query.execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result.data


@router.get("/{id}")
def get_request(id: str):
    try:
        result = supabase.table("rental_requests").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found")

    return result.data[0]


class RequestUpdate(BaseModel):
    category: Optional[str] = None
    task_description: Optional[str] = None
    needed_from: Optional[str] = None
    needed_to: Optional[str] = None
    pincode: Optional[str] = None
    status: Optional[str] = None


@router.patch("/{id}")
def update_request(id: str, payload: RequestUpdate):
    updates = payload.model_dump(exclude_none=True)

    try:
        result = (
            supabase.table("rental_requests")
            .update(updates)
            .eq("id", id)
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found")

    return result.data[0]