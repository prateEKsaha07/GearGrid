import os
import random
from datetime import date, datetime, timedelta

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


def _parse_timeout_hours() -> float:
    raw = os.getenv("BOOKING_FLOW_TIMEOUT_HOURS", "24")
    try:
        value = float(raw)
        if value <= 0:
            raise ValueError("must be positive")
        return value
    except (TypeError, ValueError):
        return 24.0


BOOKING_FLOW_TIMEOUT_HOURS = _parse_timeout_hours()


def mask_pin(row: dict | None, role: str, stage: str) -> dict | None:
    if row is None:
        return None
    row = dict(row)
    if stage == "pickup" and role != "owner":
        row["pickup_pin"] = None
    if stage == "return" and role != "renter":
        row["return_pin"] = None
    return row


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


@router.get("/{id}/track")
def track_booking(id: str, caller_id: str):
    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if caller_id not in (booking["owner_id"], booking["renter_id"]):
        raise HTTPException(status_code=403, detail="Not a party to this booking")

    role = "owner" if caller_id == booking["owner_id"] else "renter"

    cutoff = datetime.utcnow() - timedelta(hours=BOOKING_FLOW_TIMEOUT_HOURS)
    now = datetime.utcnow().isoformat()

    expired = False

    if booking["status"] == "pickup_in_progress" and booking.get("pickup_started_at"):
        started = datetime.fromisoformat(
            booking["pickup_started_at"].replace("Z", "+00:00").replace("+00:00", "")
        )
        if started < cutoff:
            try:
                supabase.table("bookings").update(
                    {"status": "cancelled", "cancelled_reason": "pickup_timeout"}
                ).eq("id", id).select().execute()

                supabase.table("agreements").update({"abandoned_at": now}).eq(
                    "booking_id", id
                ).eq("stage", "pickup").select().execute()

                booking["status"] = "cancelled"
                booking["cancelled_reason"] = "pickup_timeout"
                expired = True
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

    if (
        not expired
        and booking["status"] == "return_in_progress"
        and booking.get("return_started_at")
    ):
        started = datetime.fromisoformat(
            booking["return_started_at"].replace("Z", "+00:00").replace("+00:00", "")
        )
        if started < cutoff:
            try:
                supabase.table("bookings").update(
                    {"status": "active", "cancelled_reason": None}
                ).eq("id", id).select().execute()

                supabase.table("agreements").update({"abandoned_at": now}).eq(
                    "booking_id", id
                ).eq("stage", "return").select().execute()

                booking["status"] = "active"
                booking["cancelled_reason"] = None
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

    try:
        pickup_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "pickup")
            .execute()
        )
        return_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "return")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    pickup_agreement = pickup_result.data[0] if pickup_result.data else None
    return_agreement = return_result.data[0] if return_result.data else None

    pickup_agreement = mask_pin(pickup_agreement, role, "pickup")
    return_agreement = mask_pin(return_agreement, role, "return")

    return {
        "booking": booking,
        "role": role,
        "pickup_agreement": pickup_agreement,
        "return_agreement": return_agreement,
    }


@router.get("/{id}")
def get_booking(id: str, caller_id: str):
    try:
        result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = result.data[0]

    if caller_id not in (booking["owner_id"], booking["renter_id"]):
        raise HTTPException(status_code=403, detail="Not a party to this booking")

    return booking


class StartPickupPayload(BaseModel):
    caller_id: str


@router.post("/{id}/start-pickup")
def start_pickup(id: str, payload: StartPickupPayload):
    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.caller_id != booking["renter_id"]:
        raise HTTPException(status_code=403, detail="Only the renter can start pickup")

    if booking["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Booking is not in confirmed state")

    now = datetime.utcnow().isoformat()

    try:
        updated_result = (
            supabase.table("bookings")
            .update({"status": "pickup_in_progress", "pickup_started_at": now})
            .eq("id", id)
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_result.data:
        raise HTTPException(status_code=500, detail="Failed to update booking")

    updated_booking = updated_result.data[0]

    try:
        agreement_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "pickup")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if agreement_result.data:
        existing = agreement_result.data[0]
        pin = random.randint(100000, 999999)
        try:
            refreshed = (
                supabase.table("agreements")
                .update(
                    {
                        "pickup_pin": str(pin),
                        "pin_attempts": 0,
                        "abandoned_at": None,
                        "owner_signed": False,
                        "renter_signed": False,
                        "otp_verified": False,
                        "pin_verified_at": None,
                    }
                )
                .eq("id", existing["id"])
                .select()
                .execute()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not refreshed.data:
            raise HTTPException(status_code=500, detail="Failed to refresh agreement")

        return {
            "booking": updated_booking,
            "agreement": mask_pin(refreshed.data[0], "renter", "pickup"),
        }

    pin = random.randint(100000, 999999)

    agreement_data = {
        "booking_id": id,
        "stage": "pickup",
        "pickup_pin": str(pin),
        "owner_signed": False,
        "renter_signed": False,
        "otp_verified": False,
    }

    try:
        insert_result = supabase.table("agreements").insert(agreement_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return {
        "booking": updated_booking,
        "agreement": mask_pin(insert_result.data[0], "renter", "pickup"),
    }


class VerifyPickupPinPayload(BaseModel):
    caller_id: str
    pin: str


@router.post("/{id}/verify-pickup-pin")
def verify_pickup_pin(id: str, payload: VerifyPickupPinPayload):
    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.caller_id != booking["renter_id"]:
        raise HTTPException(status_code=403, detail="Only the renter can verify pickup PIN")

    try:
        agreement_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "pickup")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not agreement_result.data:
        raise HTTPException(status_code=404, detail="Pickup agreement not found")

    agreement = agreement_result.data[0]

    if not (agreement.get("owner_signed") and agreement.get("renter_signed")):
        raise HTTPException(
            status_code=400, detail="Both parties must sign before PIN verification"
        )

    attempts = agreement.get("pin_attempts", 0)

    if attempts >= 5:
        now = datetime.utcnow().isoformat()
        try:
            supabase.table("agreements").update(
                {"abandoned_at": now}
            ).eq("id", agreement["id"]).select().execute()
            supabase.table("bookings").update(
                {"status": "confirmed", "pickup_started_at": None}
            ).eq("id", id).select().execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        raise HTTPException(
            status_code=403, detail="Max PIN attempts exceeded — pickup cancelled"
        )

    if payload.pin != agreement.get("pickup_pin"):
        new_attempts = attempts + 1
        try:
            supabase.table("agreements").update(
                {"pin_attempts": new_attempts}
            ).eq("id", agreement["id"]).select().execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Incorrect PIN",
                "attempts_remaining": 5 - new_attempts,
            },
        )

    now = datetime.utcnow().isoformat()

    try:
        agreement_update = (
            supabase.table("agreements")
            .update({"otp_verified": True, "pin_verified_at": now})
            .eq("id", agreement["id"])
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        booking_update = (
            supabase.table("bookings")
            .update({"status": "active", "pickup_completed_at": now})
            .eq("id", id)
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not agreement_update.data or not booking_update.data:
        raise HTTPException(status_code=500, detail="Update returned no data")

    return {
        "booking": booking_update.data[0],
        "agreement": mask_pin(agreement_update.data[0], "renter", "pickup"),
    }


class SignAgreementPayload(BaseModel):
    caller_id: str
    signer: str


@router.post("/{id}/sign-pickup")
def sign_pickup(id: str, payload: SignAgreementPayload):
    if payload.signer not in ("owner", "renter"):
        raise HTTPException(status_code=400, detail="signer must be 'owner' or 'renter'")

    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.signer == "owner":
        if payload.caller_id != booking["owner_id"]:
            raise HTTPException(status_code=403, detail="Caller is not the owner")
    else:
        if payload.caller_id != booking["renter_id"]:
            raise HTTPException(status_code=403, detail="Caller is not the renter")

    try:
        agreement_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "pickup")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not agreement_result.data:
        raise HTTPException(status_code=404, detail="Agreement not found — start the flow first")

    agreement = agreement_result.data[0]
    field = "owner_signed" if payload.signer == "owner" else "renter_signed"

    try:
        updated_result = (
            supabase.table("agreements")
            .update({field: True})
            .eq("id", agreement["id"])
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_result.data:
        raise HTTPException(status_code=500, detail="Failed to update agreement")

    role = "owner" if payload.caller_id == booking["owner_id"] else "renter"
    return mask_pin(updated_result.data[0], role, "pickup")


@router.post("/{id}/sign-return")
def sign_return(id: str, payload: SignAgreementPayload):
    if payload.signer not in ("owner", "renter"):
        raise HTTPException(status_code=400, detail="signer must be 'owner' or 'renter'")

    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.signer == "owner":
        if payload.caller_id != booking["owner_id"]:
            raise HTTPException(status_code=403, detail="Caller is not the owner")
    else:
        if payload.caller_id != booking["renter_id"]:
            raise HTTPException(status_code=403, detail="Caller is not the renter")

    try:
        agreement_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "return")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not agreement_result.data:
        raise HTTPException(status_code=404, detail="Agreement not found — start the flow first")

    agreement = agreement_result.data[0]
    field = "owner_signed" if payload.signer == "owner" else "renter_signed"

    try:
        updated_result = (
            supabase.table("agreements")
            .update({field: True})
            .eq("id", agreement["id"])
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_result.data:
        raise HTTPException(status_code=500, detail="Failed to update agreement")

    role = "owner" if payload.caller_id == booking["owner_id"] else "renter"
    return mask_pin(updated_result.data[0], role, "return")


class CancelPickupPayload(BaseModel):
    caller_id: str


@router.post("/{id}/cancel-pickup")
def cancel_pickup(id: str, payload: CancelPickupPayload):
    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.caller_id not in (booking["owner_id"], booking["renter_id"]):
        raise HTTPException(status_code=403, detail="Not a party to this booking")

    if booking["status"] != "pickup_in_progress":
        raise HTTPException(status_code=400, detail="No pickup in progress")

    now = datetime.utcnow().isoformat()

    try:
        updated_result = (
            supabase.table("bookings")
            .update({"status": "confirmed", "pickup_started_at": None})
            .eq("id", id)
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_result.data:
        raise HTTPException(status_code=500, detail="Failed to update booking")

    try:
        supabase.table("agreements").update({"abandoned_at": now}).eq(
            "booking_id", id
        ).eq("stage", "pickup").select().execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return updated_result.data[0]


class StartReturnPayload(BaseModel):
    caller_id: str


@router.post("/{id}/start-return")
def start_return(id: str, payload: StartReturnPayload):
    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.caller_id != booking["owner_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can start return")

    if booking["status"] != "active":
        raise HTTPException(status_code=400, detail="Booking is not active")

    now = datetime.utcnow().isoformat()

    try:
        updated_result = (
            supabase.table("bookings")
            .update({"status": "return_in_progress", "return_started_at": now})
            .eq("id", id)
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_result.data:
        raise HTTPException(status_code=500, detail="Failed to update booking")

    updated_booking = updated_result.data[0]

    try:
        agreement_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "return")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if agreement_result.data:
        existing = agreement_result.data[0]
        pin = random.randint(100000, 999999)
        try:
            refreshed = (
                supabase.table("agreements")
                .update(
                    {
                        "return_pin": str(pin),
                        "pin_attempts": 0,
                        "abandoned_at": None,
                        "owner_signed": False,
                        "renter_signed": False,
                        "otp_verified": False,
                        "pin_verified_at": None,
                    }
                )
                .eq("id", existing["id"])
                .select()
                .execute()
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not refreshed.data:
            raise HTTPException(status_code=500, detail="Failed to refresh agreement")

        return {
            "booking": updated_booking,
            "agreement": mask_pin(refreshed.data[0], "owner", "return"),
        }

    pin = random.randint(100000, 999999)

    agreement_data = {
        "booking_id": id,
        "stage": "return",
        "return_pin": str(pin),
        "owner_signed": False,
        "renter_signed": False,
        "otp_verified": False,
    }

    try:
        insert_result = supabase.table("agreements").insert(agreement_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Insert returned no data")

    return {
        "booking": updated_booking,
        "agreement": mask_pin(insert_result.data[0], "owner", "return"),
    }


class VerifyReturnPinPayload(BaseModel):
    caller_id: str
    pin: str


@router.post("/{id}/verify-return-pin")
def verify_return_pin(id: str, payload: VerifyReturnPinPayload):
    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.caller_id != booking["owner_id"]:
        raise HTTPException(status_code=403, detail="Only the owner can verify return PIN")

    try:
        agreement_result = (
            supabase.table("agreements")
            .select("*")
            .eq("booking_id", id)
            .eq("stage", "return")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not agreement_result.data:
        raise HTTPException(status_code=404, detail="Return agreement not found")

    agreement = agreement_result.data[0]

    if not (agreement.get("owner_signed") and agreement.get("renter_signed")):
        raise HTTPException(
            status_code=400, detail="Both parties must sign before PIN verification"
        )

    attempts = agreement.get("pin_attempts", 0)

    if attempts >= 5:
        now = datetime.utcnow().isoformat()
        try:
            supabase.table("agreements").update(
                {"abandoned_at": now}
            ).eq("id", agreement["id"]).select().execute()
            supabase.table("bookings").update(
                {"status": "active", "return_started_at": None}
            ).eq("id", id).select().execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        raise HTTPException(
            status_code=403, detail="Max PIN attempts exceeded — return cancelled"
        )

    if payload.pin != agreement.get("return_pin"):
        new_attempts = attempts + 1
        try:
            supabase.table("agreements").update(
                {"pin_attempts": new_attempts}
            ).eq("id", agreement["id"]).select().execute()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Incorrect PIN",
                "attempts_remaining": 5 - new_attempts,
            },
        )

    now = datetime.utcnow().isoformat()

    try:
        agreement_update = (
            supabase.table("agreements")
            .update({"otp_verified": True, "pin_verified_at": now})
            .eq("id", agreement["id"])
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        booking_update = (
            supabase.table("bookings")
            .update({"status": "completed", "return_completed_at": now})
            .eq("id", id)
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not agreement_update.data or not booking_update.data:
        raise HTTPException(status_code=500, detail="Update returned no data")

    listing_id = booking["listing_id"]

    if listing_id is None:
        return {
            "booking": booking_update.data[0],
            "agreement": mask_pin(agreement_update.data[0], "owner", "return"),
            "invoice": None,
        }

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
            .eq("booking_id", id)
            .eq("status", "approved")
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    extension_days = sum(int(row["requested_days"]) for row in ext_result.data)
    extension_amount = sum(float(row["extra_fee"]) for row in ext_result.data)

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

    invoice_data = {
        "booking_id": id,
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
        "deposit_returned": 0,
        "deposit_retained": 0,
        "deposit_retained_reason": None,
        "net_deposit_position": 0,
    }

    try:
        invoice_result = supabase.table("invoices").insert(invoice_data).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    invoice = invoice_result.data[0] if invoice_result.data else None

    return {
        "booking": booking_update.data[0],
        "agreement": mask_pin(agreement_update.data[0], "owner", "return"),
        "invoice": invoice,
    }


class CancelReturnPayload(BaseModel):
    caller_id: str


@router.post("/{id}/cancel-return")
def cancel_return(id: str, payload: CancelReturnPayload):
    try:
        booking_result = supabase.table("bookings").select("*").eq("id", id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not booking_result.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = booking_result.data[0]

    if payload.caller_id not in (booking["owner_id"], booking["renter_id"]):
        raise HTTPException(status_code=403, detail="Not a party to this booking")

    if booking["status"] != "return_in_progress":
        raise HTTPException(status_code=400, detail="No return in progress")

    now = datetime.utcnow().isoformat()

    try:
        updated_result = (
            supabase.table("bookings")
            .update({"status": "active", "return_started_at": None})
            .eq("id", id)
            .select()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_result.data:
        raise HTTPException(status_code=500, detail="Failed to update booking")

    try:
        supabase.table("agreements").update({"abandoned_at": now}).eq(
            "booking_id", id
        ).eq("stage", "return").select().execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return updated_result.data[0]