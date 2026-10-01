import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";
import { useBookingRole } from "../../hooks/useBookingRole";

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

  const { booking: roleBooking, role: callerRole, loading: roleLoading, error: roleError } =
    useBookingRole(bookingId);

  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Fetch the listing title once the booking resolves.
  useEffect(() => {
    if (!roleBooking?.listing_id) return;

    let cancelled = false;
    const load = async () => {
      setListingLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/listings/${roleBooking.listing_id}`
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = (await res.json()) as Listing;
        if (!cancelled) {
          setListing(data);
          setListingError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Something went wrong";
          setListingError(message);
        }
      } finally {
        if (!cancelled) setListingLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [roleBooking?.listing_id]);

  // Ticker for the countdown.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading || roleLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;
  if (!roleBooking || !callerRole) return <Navigate to="/error" replace />;

  const endMs = new Date(`${roleBooking.end_date}T23:59:59`).getTime();
  const msRemaining = endMs - now;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Active Rental</h1>
          <button
            type="button"
            onClick={() => navigate(`/bookings/${bookingId}/track`)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Tracker
          </button>
        </div>

        {roleError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {roleError}
          </div>
        )}

        {listingError && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Could not load listing title: {listingError}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-lg border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-medium">
                {listing?.title ?? (listingLoading ? "Loading…" : "Listing")}
              </h2>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  BOOKING_STATUS_STYLES[roleBooking.status] ??
                  "bg-neutral-500/10 text-neutral-600"
                }`}
              >
                {roleBooking.status}
              </span>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Start Date</dt>
                <dd className="text-right">{roleBooking.start_date}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">End Date</dt>
                <dd className="text-right">{roleBooking.end_date}</dd>
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
            {callerRole === "renter" && (
              <button
                type="button"
                onClick={() => navigate(`/bookings/${bookingId}/extension`)}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
              >
                Request Extension
              </button>
            )}
            {callerRole === "owner" && (
              <button
                type="button"
                onClick={() => navigate(`/bookings/${bookingId}/return`)}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Start Return
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}