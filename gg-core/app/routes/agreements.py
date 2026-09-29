import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime
from fastapi import UploadFile, File
from app.integrations.cloudinary import upload_image

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
router = APIRouter()


class AgreementCreate(BaseModel):
    booking_id: str
    stage: str
    notes: str | None = None

@router.post("")
def create_agreement(payload: AgreementCreate):
    if payload.stage not in ("pickup", "return"):
        raise HTTPException(status_code=400, detail="stage must be 'pickup' or 'return'")

    agreement_data = {
        "booking_id": payload.booking_id,
        "stage": payload.stage,
        "notes": payload.notes,
        "owner_signed": False,
        "renter_signed": False,
        "otp_verified": False,
    }

    try:
        result = supabase.table("agreements").insert(agreement_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return result.data[0]

class AgreementSign(BaseModel):
    signer: str

@router.patch("/{id}/sign")
def sign_agreement(id: str, payload: AgreementSign):
    if payload.signer not in ("owner", "renter"):
        raise HTTPException(status_code=400, detail="signer must be 'owner' or 'renter'")

    field = "owner_signed" if payload.signer == "owner" else "renter_signed"

    try:
        result = (
            supabase.table("agreements")
            .update({field: True})
            .eq("id", id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Agreement not found")

    return result.data[0]

class AgreementVerifyOTP(BaseModel):
    otp_code: str

@router.patch("/{id}/verify-otp")
def verify_agreement_otp(id: str, payload: AgreementVerifyOTP):
    if not (payload.otp_code.isdigit() and len(payload.otp_code) == 4):
        raise HTTPException(status_code=400, detail="otp_code must be exactly 4 digits")

    now = datetime.utcnow().isoformat()

    try:
        result = (
            supabase.table("agreements")
            .update({"otp_verified": True, "otp_verified_at": now})
            .eq("id", id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Agreement not found")

    agreement = result.data[0]
    booking_id = agreement["booking_id"]
    stage = agreement["stage"]

    new_status = "active" if stage == "pickup" else "return_pending"

    try:
        supabase.table("bookings").update({"status": new_status}).eq(
            "id", booking_id
        ).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return agreement

@router.post("/{id}/photo")
async def upload_agreement_photo(id: str, file: UploadFile = File(...)):
    file_bytes = await file.read()

    try:
        url = upload_image(file_bytes, folder="agreements")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = (
            supabase.table("agreements")
            .update({"condition_photo_url": url})
            .eq("id", id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Agreement not found")

    return result.data[0]







