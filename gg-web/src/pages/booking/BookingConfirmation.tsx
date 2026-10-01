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
  pickup_in_progress: "bg-blue-500/10 text-blue-700",
  active: "bg-blue-500/10 text-blue-700",
  return_in_progress: "bg-amber-500/10 text-amber-700",
  completed: "bg-neutral-500/10 text-neutral-600",
  cancelled: "bg-red-500/10 text-red-700",
};

const DEPOSIT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  paid: "bg-green-500/10 text-green-700",
  returned: "bg-blue-500/10 text-blue-700",
  retained: "bg-red-500/10 text-red-700",
};

export default function BookingConfirmation() {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const {
    booking,
    role: callerRole,
    loading: roleLoading,
    error: roleError,
  } = useBookingRole(bookingId);

  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking?.listing_id) return;

    let cancelled = false;
    const load = async () => {
      setListingLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/listings/${booking.listing_id}`
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
  }, [booking?.listing_id]);

  if (authLoading || roleLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;
  if (roleError) return <div>{roleError}</div>;
  if (!booking || !callerRole) return <Navigate to="/error" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Booking Confirmation
          </h1>
          <button
            type="button"
            onClick={() => navigate(`/bookings/${bookingId}/track`)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Tracker
          </button>
        </div>

        {listingError && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Could not load listing title: {listingError}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium">
              {listing?.title ?? (listingLoading ? "Loading…" : "Listing")}
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
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Your Role</dt>
                <dd className="text-right">
                  {callerRole === "owner" ? "Owner" : "Renter"}
                </dd>
              </div>
            </dl>
          </section>

          {booking.status === "confirmed" && callerRole === "renter" && (
            <button
              type="button"
              onClick={() => navigate(`/bookings/${booking.id}/pickup`)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Start Pickup
            </button>
          )}

          {booking.status === "confirmed" && callerRole === "owner" && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Waiting for the renter to start pickup. You'll be notified when it's
              your turn to sign.
            </div>
          )}

          {booking.status === "pickup_in_progress" && (
            <button
              type="button"
              onClick={() => navigate(`/bookings/${booking.id}/pickup`)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Continue Pickup
            </button>
          )}

          {booking.status === "active" && (
            <button
              type="button"
              onClick={() => navigate(`/bookings/${booking.id}/active`)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Go to Active Rental
            </button>
          )}

          {booking.status === "return_in_progress" && (
            <button
              type="button"
              onClick={() => navigate(`/bookings/${booking.id}/return`)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Continue Return
            </button>
          )}

          {booking.status === "completed" && (
            <button
              type="button"
              onClick={() => navigate(`/bookings/${booking.id}/invoice`)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              View Invoice
            </button>
          )}

          {booking.status === "cancelled" && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              Booking cancelled
              {booking.cancelled_reason ? `: ${booking.cancelled_reason}` : "."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}