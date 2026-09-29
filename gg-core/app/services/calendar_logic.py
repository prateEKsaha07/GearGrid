import os

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def has_overlap(
    listing_id: str,
    proposed_start: str,
    proposed_end: str,
    exclude_booking_id: str = None,
) -> bool:
    query = (
        supabase.table("bookings")
        .select("id")
        .eq("listing_id", listing_id)
        .in_("status", ["confirmed", "active"])
        .lte("start_date", proposed_end)
        .gte("end_date", proposed_start)
    )

    if exclude_booking_id is not None:
        query = query.neq("id", exclude_booking_id)

    result = query.execute()
    return len(result.data) > 0