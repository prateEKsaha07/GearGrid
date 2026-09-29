import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime
from typing import Optional

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
router = APIRouter()

from fastapi import UploadFile, File
from app.integrations.cloudinary import upload_image

class ListingCreate(BaseModel):
    owner_id: str
    category_id: str
    title: str
    description: str
    price_per_day: float
    pincode: str
    brand: str | None = None
    model_name: str | None = None
    condition_grade: str | None = None
    registration_number: str | None = None
    fuel_type: str | None = None
    power_source: str | None = None
    capacity_spec: str | None = None
    manufacture_year: int | None = None
    horsepower: float | None = None


@router.post("")
def create_listing(payload: ListingCreate):
    data = payload.model_dump(exclude_none=True)
    try:
        result = supabase.table("equipment_listings").insert(data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return result.data[0]

@router.get("")
def list_listings(pincode: str | None = None):
    query = supabase.table("equipment_listings").select("*").eq("status", "available")
    if pincode is not None:
        query = query.eq("pincode", pincode)

    try:
        result = query.execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result.data

@router.get("/{id}")
def get_listing(id: str):
    try:
        result = supabase.table("equipment_listings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Listing not found")

    return result.data[0]

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_per_day: Optional[float] = None
    pincode: Optional[str] = None
    status: Optional[str] = None
    brand: Optional[str] = None
    model_name: Optional[str] = None
    condition_grade: Optional[str] = None
    registration_number: Optional[str] = None
    fuel_type: Optional[str] = None
    power_source: Optional[str] = None
    capacity_spec: Optional[str] = None
    manufacture_year: Optional[int] = None
    horsepower: Optional[float] = None

@router.patch("/{id}")
def update_listing(id: str, payload: ListingUpdate):
    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.utcnow().isoformat()

    try:
        result = supabase.table("equipment_listings").update(updates).eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Listing not found")

    return result.data[0]

@router.post("/{id}/photos")
async def upload_listing_photo(id: str, file: UploadFile = File(...)):
    try:
        fetched = supabase.table("equipment_listings").select("photos").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not fetched.data:
        raise HTTPException(status_code=404, detail="Listing not found")

    current_photos = fetched.data[0].get("photos") or []

    file_bytes = await file.read()

    try:
        url = upload_image(file_bytes, folder="listings")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    new_photos = current_photos + [url]

    try:
        result = (
            supabase.table("equipment_listings")
            .update({"photos": new_photos})
            .eq("id", id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Listing not found")

    return result.data[0]




