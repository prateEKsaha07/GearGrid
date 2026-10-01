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

type BookingLookup = {
  id: string;
  listing_id: string;
};

type Listing = {
  id: string;
  owner_id: string;
  title: string;
};

export default function ExtensionApproval() {
  const { id: listingId } = useParams<{ id: string }>();
  const { userId, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);
  const [notOwner, setNotOwner] = useState(false);

  const [requests, setRequests] = useState<ExtensionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

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
      .select("id, listing_id")
      .eq("listing_id", listingId);

    if (bookingsError) {
      setError(bookingsError.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const bookingIds = (bookingsData ?? []).map((b: BookingLookup) => b.id);

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

  const handleResolve = async (
    requestId: string,
    decision: "approved" | "declined"
  ) => {
    setActionInFlight(requestId);
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
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      await fetchPending();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
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
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      +{r.requested_days} day{r.requested_days === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Extra fee: ₹{r.extra_fee}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolve(r.id, "approved")}
                      disabled={actionInFlight === r.id}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {actionInFlight === r.id ? "..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(r.id, "declined")}
                      disabled={actionInFlight === r.id}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}