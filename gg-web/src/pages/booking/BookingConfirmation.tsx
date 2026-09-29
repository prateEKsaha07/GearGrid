import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { supabase } from "../../lib/supabase";

type Booking = {
  id: string;
  listing_id: string;
  bid_id: string;
  owner_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  deposit_status: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Listing = {
  id: string;
  title: string;
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-700",
  active: "bg-blue-500/10 text-blue-700",
  return_pending: "bg-amber-500/10 text-amber-700",
  completed: "bg-neutral-500/10 text-neutral-600",
  non_returned: "bg-red-500/10 text-red-700",
  cancelled: "bg-red-500/10 text-red-700",
};

const DEPOSIT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  paid: "bg-green-500/10 text-green-700",
  returned: "bg-blue-500/10 text-blue-700",
  retained: "bg-red-500/10 text-red-700",
};

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (bookingError) {
        setError(bookingError.message);
        setLoading(false);
        return;
      }

      if (!bookingData) {
        setError("Booking not found");
        setLoading(false);
        return;
      }

      setBooking(bookingData as Booking);

      const { data: listingData, error: listingError } = await supabase
        .from("equipment_listings")
        .select("id, title")
        .eq("id", bookingData.listing_id)
        .maybeSingle();

      if (listingError) {
        setError(listingError.message);
        setLoading(false);
        return;
      }

      setListing((listingData ?? null) as Listing | null);
      setLoading(false);
    };

    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Booking Confirmation
        </h1>

        {loading && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loading && !error && booking && (
          <div className="space-y-6">
            <section className="rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium">
                {listing?.title ?? "Listing"}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    BOOKING_STATUS_STYLES[booking.status] ??
                    "bg-neutral-500/10 text-neutral-600"
                  }`}
                >
                  {booking.status}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    DEPOSIT_STATUS_STYLES[booking.deposit_status] ??
                    "bg-neutral-500/10 text-neutral-600"
                  }`}
                >
                  deposit: {booking.deposit_status}
                </span>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Start Date</dt>
                  <dd className="text-right">{booking.start_date}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">End Date</dt>
                  <dd className="text-right">{booking.end_date}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Deposit Amount</dt>
                  <dd className="text-right">₹{booking.deposit_amount}</dd>
                </div>
              </dl>
            </section>

            <button
              type="button"
              onClick={() => navigate(`/bookings/${booking.id}/pickup`)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Start Pickup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}