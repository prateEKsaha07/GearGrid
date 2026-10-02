import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";
import { useBookingRole } from "../../hooks/useBookingRole";

type Booking = {
  id: string;
  listing_id: string | null;
  bid_id: string;
  owner_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  deposit_status: string;
  status: string;
  cancelled_reason: string | null;
  pickup_started_at: string | null;
  pickup_completed_at: string | null;
  return_started_at: string | null;
  return_completed_at: string | null;
};

type Agreement = {
  id: string;
  booking_id: string;
  stage: string;
  condition_photo_url: string | null;
  owner_signed: boolean;
  renter_signed: boolean;
  otp_verified: boolean;
  otp_verified_at: string | null;
  pin_verified_at: string | null;
  pin_attempts: number;
  abandoned_at: string | null;
  pickup_pin?: string | null;
  return_pin?: string | null;
};

type TrackResponse = {
  booking: Booking;
  role: "owner" | "renter";
  pickup_agreement: Agreement | null;
  return_agreement: Agreement | null;
};

type Listing = {
  id: string;
  title: string;
};

const TIMELINE = [
  "confirmed",
  "pickup_in_progress",
  "active",
  "return_in_progress",
  "completed",
] as const;

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-700",
  pickup_in_progress: "bg-blue-500/10 text-blue-700",
  active: "bg-blue-500/10 text-blue-700",
  return_in_progress: "bg-amber-500/10 text-amber-700",
  completed: "bg-neutral-500/10 text-neutral-600",
  cancelled: "bg-red-500/10 text-red-700",
};

const POLL_MS = 5000;

function formatCountdown(msRemaining: number) {
  if (msRemaining <= 0) return "Rental period ended";

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function TrackBooking() {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const {
    booking: roleBooking,
    role: callerRole,
    loading: roleLoading,
    error: roleError,
  } = useBookingRole(bookingId);

  const [data, setData] = useState<TrackResponse | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const fetchTrack = async () => {
    if (!bookingId || !userId) return;
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/track?caller_id=${userId}`
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed with ${res.status}`);
    }
    const json = (await res.json()) as TrackResponse;
    setData(json);

    if (json.booking.listing_id && !listing) {
      try {
        const lres = await fetch(
          `${import.meta.env.VITE_API_URL}/listings/${json.booking.listing_id}`
        );
        if (lres.ok) {
          const ldata = (await lres.json()) as Listing;
          setListing(ldata);
        }
      } catch {
        // listing fetch failure is non-fatal
      }
    }

    return json;
  };

  useEffect(() => {
    if (!userId || !bookingId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await fetchTrack();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, bookingId]);

  useEffect(() => {
    if (!data) return;
    const status = data.booking.status;
    const shouldPoll =
      status === "pickup_in_progress" || status === "return_in_progress";
    if (!shouldPoll) return;

    const interval = setInterval(() => {
      fetchTrack().catch(() => {
        // ignore polling errors; next tick may succeed
      });
    }, POLL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.booking.status]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartPickup = async () => {
    if (!bookingId || !userId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/start-pickup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caller_id: userId }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      navigate(`/bookings/${bookingId}/pickup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleStartReturn = async () => {
    if (!bookingId || !userId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/start-return`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caller_id: userId }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      navigate(`/bookings/${bookingId}/return`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingId || !userId || !data) return;
    const stage = data.booking.status;
    const endpoint =
      stage === "pickup_in_progress" ? "cancel-pickup" : "cancel-return";

    setBusy(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caller_id: userId }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      await fetchTrack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || roleLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;
  if (roleError) return <div>{roleError}</div>;
  if (!roleBooking || !callerRole) return <Navigate to="/error" replace />;

  const currentStepIndex = data
    ? TIMELINE.indexOf(data.booking.status as (typeof TIMELINE)[number])
    : -1;

  const renderCountdown = () => {
    if (!data || data.booking.status !== "active") return null;
    const endMs = new Date(`${data.booking.end_date}T23:59:59`).getTime();
    const msRemaining = endMs - now;

    return (
      <section className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Time Remaining</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">
          {formatCountdown(msRemaining)}
        </p>
      </section>
    );
  };

  const renderAction = () => {
    if (!data) return null;
    const { booking, role } = data;

    if (booking.status === "cancelled") {
      return (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          Booking cancelled{booking.cancelled_reason ? `: ${booking.cancelled_reason}` : "."}
        </div>
      );
    }

    if (booking.status === "completed") {
      return (
        <button
          type="button"
          onClick={() => navigate(`/bookings/${bookingId}/invoice`)}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          View Invoice
        </button>
      );
    }

    if (booking.status === "confirmed" && role === "renter") {
      return (
        <button
          type="button"
          onClick={handleStartPickup}
          disabled={busy}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Starting..." : "Start Pickup"}
        </button>
      );
    }

    if (booking.status === "confirmed" && role === "owner") {
      return (
        <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Waiting for the renter to start pickup.
        </div>
      );
    }

    if (booking.status === "active" && role === "owner") {
      return (
        <button
          type="button"
          onClick={handleStartReturn}
          disabled={busy}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Starting..." : "Start Return"}
        </button>
      );
    }

    if (booking.status === "active" && role === "renter") {
      if (!booking.listing_id) {
        return (
          <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            Rental is active. Extensions are only available for bookings tied to a
            specific listing.
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={() => navigate(`/bookings/${bookingId}/extension`)}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
        >
          Request Extension
        </button>
      );
    }

    if (booking.status === "pickup_in_progress") {
      return (
        <button
          type="button"
          onClick={() => navigate(`/bookings/${bookingId}/pickup`)}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Go to Pickup Flow
        </button>
      );
    }

    if (booking.status === "return_in_progress") {
      return (
        <button
          type="button"
          onClick={() => navigate(`/bookings/${bookingId}/return`)}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Go to Return Flow
        </button>
      );
    }

    return null;
  };

  const canCancel =
    data &&
    (data.booking.status === "pickup_in_progress" ||
      data.booking.status === "return_in_progress");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Booking Tracker</h1>

        {loading && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            <section className="rounded-lg border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">
                    {listing?.title ?? "Booking"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.booking.start_date} → {data.booking.end_date}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_STYLES[data.booking.status] ??
                      "bg-neutral-500/10 text-neutral-600"
                    }`}
                  >
                    {data.booking.status}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {data.role === "owner" ? "You are the owner" : "You are the renter"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border p-6">
              <h3 className="mb-4 text-sm font-medium">Progress</h3>
              <div className="flex items-center justify-between gap-2">
                {TIMELINE.map((step, i) => {
                  const isCurrent = i === currentStepIndex;
                  const isPast = i < currentStepIndex;
                  return (
                    <div key={step} className="flex flex-1 items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                            isPast || isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-muted-foreground"
                          }`}
                        >
                          {isPast ? "✓" : i + 1}
                        </div>
                        <span className="hidden text-[10px] text-muted-foreground sm:inline">
                          {step.replace(/_/g, " ")}
                        </span>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div
                          className={`h-px flex-1 ${
                            isPast ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {data.booking.status === "cancelled" && (
                <p className="mt-4 text-xs text-red-700">
                  Cancelled
                  {data.booking.cancelled_reason
                    ? ` — ${data.booking.cancelled_reason.replace(/_/g, " ")}`
                    : ""}
                </p>
              )}
            </section>

            {renderCountdown()}

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Your Action</h3>
              {renderAction()}

              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={busy}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Cancelling..." : "Cancel This Flow"}
                </button>
              )}
            </section>

            {(data.pickup_agreement || data.return_agreement) && (
              <section className="space-y-3 rounded-lg border border-border p-6">
                <h3 className="text-sm font-medium">Agreement Status</h3>

                {data.pickup_agreement && (
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="mb-2 font-medium">Pickup</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Owner signed:{" "}
                        <span className={data.pickup_agreement.owner_signed ? "text-green-600" : ""}>
                          {data.pickup_agreement.owner_signed ? "✓" : "pending"}
                        </span>
                      </p>
                      <p>
                        Renter signed:{" "}
                        <span className={data.pickup_agreement.renter_signed ? "text-green-600" : ""}>
                          {data.pickup_agreement.renter_signed ? "✓" : "pending"}
                        </span>
                      </p>
                      <p>
                        PIN verified:{" "}
                        <span className={data.pickup_agreement.otp_verified ? "text-green-600" : ""}>
                          {data.pickup_agreement.otp_verified ? "✓" : "pending"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {data.return_agreement && (
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p className="mb-2 font-medium">Return</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Owner signed:{" "}
                        <span className={data.return_agreement.owner_signed ? "text-green-600" : ""}>
                          {data.return_agreement.owner_signed ? "✓" : "pending"}
                        </span>
                      </p>
                      <p>
                        Renter signed:{" "}
                        <span className={data.return_agreement.renter_signed ? "text-green-600" : ""}>
                          {data.return_agreement.renter_signed ? "✓" : "pending"}
                        </span>
                      </p>
                      <p>
                        PIN verified:{" "}
                        <span className={data.return_agreement.otp_verified ? "text-green-600" : ""}>
                          {data.return_agreement.otp_verified ? "✓" : "pending"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}