import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

type ExtensionRequest = {
  id: string;
  booking_id: string;
  requested_days: number;
  extra_fee: number;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

type Listing = {
  id: string;
  owner_id: string;
  title: string;
};

type PendingDecision = {
  requestId: string;
  decision: "approved" | "declined";
  requestedDays: number;
  extraFee: number;
  bookingId: string;
  currentEndDate: string | null;
  newEndDate: string | null;
};

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function extractErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (json && typeof json.detail === "string") return json.detail;
  } catch {
    // fall through
  }
  return text || `Request failed with ${res.status}`;
}

export default function ExtensionApproval() {
  const { id: listingId } = useParams<{ id: string }>();
  const { userId, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);
  const [notOwner, setNotOwner] = useState(false);

  const [requests, setRequests] = useState<ExtensionRequest[]>([]);
  const [bookingEndDates, setBookingEndDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !listingId) return;

    let cancelled = false;
    const load = async () => {
      setListingLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/listings/${listingId}`
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = (await res.json()) as Listing;
        if (cancelled) return;
        setListing(data);
        if (data.owner_id !== userId) {
          setNotOwner(true);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Something went wrong";
          setError(message);
        }
      } finally {
        if (!cancelled) setListingLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, listingId]);

  const fetchPending = async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);

    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, listing_id, end_date")
      .eq("listing_id", listingId);

    if (bookingsError) {
      setError(bookingsError.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const bookings = bookingsData ?? [];
    const bookingIds = bookings.map((b) => b.id);
    const endDates: Record<string, string> = {};
    bookings.forEach((b) => {
      if (b.end_date) endDates[b.id] = b.end_date;
    });
    setBookingEndDates(endDates);

    if (bookingIds.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const { data: requestsData, error: requestsError } = await supabase
      .from("extension_requests")
      .select("*")
      .eq("status", "pending")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (requestsError) {
      setError(requestsError.message);
      setRequests([]);
    } else {
      setRequests((requestsData ?? []) as ExtensionRequest[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!userId || !listingId || notOwner) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, listingId, notOwner]);

  const openModal = (r: ExtensionRequest, decision: "approved" | "declined") => {
    const currentEnd = bookingEndDates[r.booking_id] ?? null;
    const newEnd =
      currentEnd && decision === "approved"
        ? addDays(currentEnd, r.requested_days)
        : null;

    setModalError(null);
    setPendingDecision({
      requestId: r.id,
      decision,
      requestedDays: r.requested_days,
      extraFee: r.extra_fee,
      bookingId: r.booking_id,
      currentEndDate: currentEnd,
      newEndDate: newEnd,
    });
  };

  const closeModal = () => {
    if (actionInFlight) return;
    setPendingDecision(null);
    setModalError(null);
  };

  const confirmDecision = async () => {
    if (!pendingDecision) return;
    const { requestId, decision } = pendingDecision;
    setActionInFlight(requestId);
    setModalError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/extensions/${requestId}/resolve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        }
      );
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res));
      }

      setPendingDecision(null);
      setModalError(null);
      await fetchPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setModalError(message);
    } finally {
      setActionInFlight(null);
    }
  };

  if (authLoading || listingLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;
  if (notOwner) return <Navigate to="/error" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          Extension Requests
        </h1>
        {listing?.title && (
          <p className="mb-6 text-sm text-muted-foreground">{listing.title}</p>
        )}

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

        {!loading && !error && requests.length === 0 && (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            No pending extension requests.
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((r) => {
              const currentEnd = bookingEndDates[r.booking_id];
              const projectedEnd = currentEnd
                ? addDays(currentEnd, r.requested_days)
                : null;

              return (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        +{r.requested_days} day{r.requested_days === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Extra fee: ₹{r.extra_fee}
                      </p>
                      {currentEnd && projectedEnd && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Return date: {currentEnd} → {projectedEnd}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Requested {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(r, "approved")}
                        disabled={actionInFlight === r.id}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(r, "declined")}
                        disabled={actionInFlight === r.id}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pendingDecision && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {pendingDecision.decision === "approved" ? (
              <>
                <h2 className="text-lg font-semibold">Approve extension?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Extend this booking by{" "}
                  <span className="font-medium text-foreground">
                    {pendingDecision.requestedDays} day
                    {pendingDecision.requestedDays === 1 ? "" : "s"}
                  </span>
                  .
                </p>
                <div className="mt-4 space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Extra fee</span>
                    <span>₹{pendingDecision.extraFee}</span>
                  </div>
                  {pendingDecision.currentEndDate && pendingDecision.newEndDate && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">New return date</span>
                      <span>{pendingDecision.newEndDate}</span>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Extra fee is paid directly between the parties. The booking
                  calendar will shift by these days.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Decline extension?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  The booking will keep its current return date. The renter will
                  be notified.
                </p>
              </>
            )}

            {modalError && (
              <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900">
                {modalError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionInFlight !== null}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDecision}
                disabled={actionInFlight !== null}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
                  pendingDecision.decision === "approved"
                    ? "bg-primary"
                    : "bg-red-600"
                }`}
              >
                {actionInFlight
                  ? "..."
                  : pendingDecision.decision === "approved"
                  ? "Approve"
                  : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}