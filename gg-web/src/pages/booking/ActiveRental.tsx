import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

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

function formatCountdown(msRemaining: number) {
  if (msRemaining <= 0) return "Rental period ended";

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function ActiveRental() {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!bookingId) return;

    const load = async () => {
      setLoading(true);
      try {
        const bookingRes = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/${bookingId}`
        );
        if (!bookingRes.ok) {
          const text = await bookingRes.text();
          throw new Error(text || `Request failed with ${bookingRes.status}`);
        }
        const bookingData = (await bookingRes.json()) as Booking;
        setBooking(bookingData);

        const listingRes = await fetch(
          `${import.meta.env.VITE_API_URL}/listings/${bookingData.listing_id}`
        );
        if (!listingRes.ok) {
          const text = await listingRes.text();
          throw new Error(text || `Request failed with ${listingRes.status}`);
        }
        const listingData = (await listingRes.json()) as Listing;
        setListing(listingData);

        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setBooking(null);
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const endMs = booking ? new Date(`${booking.end_date}T23:59:59`).getTime() : 0;
  const msRemaining = endMs - now;

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Active Rental</h1>

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
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-medium">
                  {listing?.title ?? "Listing"}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    BOOKING_STATUS_STYLES[booking.status] ??
                    "bg-neutral-500/10 text-neutral-600"
                  }`}
                >
                  {booking.status}
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
              </dl>
            </section>

            <section className="rounded-lg border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">Time Remaining</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {formatCountdown(msRemaining)}
              </p>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(`/bookings/${bookingId}/extension`)}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
              >
                Request Extension
              </button>
              <button
                type="button"
                onClick={() => navigate(`/bookings/${bookingId}/return`)}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Start Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}