import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

type Listing = {
  id: string;
  owner_id: string;
  title: string;
  price_per_day: number;
  pincode: string;
  status: string;
  description?: string;
};

type Bid = {
  id: string;
  listing_id: string | null;
  request_id: string | null;
  bidder_id: string;
  proposed_price: number;
  proposed_start: string;
  proposed_end: string;
  status: string;
  created_at: string;
};

const LISTING_STATUS_STYLES: Record<string, string> = {
  available: "bg-green-500/10 text-green-700",
  booked: "bg-amber-500/10 text-amber-700",
  under_maintenance: "bg-orange-500/10 text-orange-700",
  unlisted: "bg-neutral-500/10 text-neutral-600",
};

const BID_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  accepted: "bg-green-500/10 text-green-700",
  rejected: "bg-red-500/10 text-red-700",
  auto_rejected_overlap: "bg-neutral-500/10 text-neutral-600",
};

export default function ListingDashboard() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const { userId, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  const fetchManageData = async (targetId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/listings/${targetId}/manage`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data = await res.json();
      
      // Handle array or object response from /manage
      const manageData = Array.isArray(data) ? data[0] : data;
      setListing(manageData);
      setBids(manageData.bids || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setListing(null);
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    if (routeId) {
      fetchManageData(routeId);
    } else {
      // Fallback: If no ID in route, fetch user's first listing
      const fetchFirstListing = async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/listings?owner_id=${userId}`
          );
          if (res.ok) {
            const data: Listing[] = await res.json();
            if (data.length > 0) {
              navigate(`/listings/${data[0].id}/manage`, { replace: true });
            } else {
              setLoading(false);
            }
          }
        } catch (err) {
          setError("Failed to load listings");
          setLoading(false);
        }
      };
      fetchFirstListing();
    }
  }, [userId, routeId]);

  const handleAccept = async (bid: Bid) => {
    setActionInFlight(bid.id);
    try {
      const patchRes = await fetch(
        `${import.meta.env.VITE_API_URL}/bids/${bid.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted" }),
        }
      );
      if (!patchRes.ok) {
        const text = await patchRes.text();
        throw new Error(text || `Request failed with ${patchRes.status}`);
      }

      const bookingRes = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bid_id: bid.id,
          deposit_amount: 0,
        }),
      });
      if (!bookingRes.ok) {
        const text = await bookingRes.text();
        throw new Error(text || `Request failed with ${bookingRes.status}`);
      }

      const booking = await bookingRes.json();
      navigate(`/bookings/${booking.id}/confirm`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: `/listings/${routeId}/manage` },
      });
    } finally {
      setActionInFlight(null);
    }
  };

  const handleReject = async (bid: Bid) => {
    setActionInFlight(bid.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bids/${bid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      if (routeId) await fetchManageData(routeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: `/listings/${routeId}/manage` },
      });
    } finally {
      setActionInFlight(null);
    }
  };

  if (authLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!userId) return <div className="p-6 text-sm text-muted-foreground">Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Manage Listing</h1>
            {listing && (
              <p className="mt-1 text-sm text-muted-foreground">
                {listing.title} · ₹{listing.price_per_day}/day · Pincode: {listing.pincode}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Back to Dashboard
          </button>
        </div>

        {loading && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading listing and bids...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loading && !error && !listing && (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            Listing not found.
          </div>
        )}

        {!loading && !error && listing && (
          <div className="space-y-6">
            {/* Listing Header / Status Card */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
              <div>
                <span className="text-xs text-muted-foreground">Listing ID</span>
                <p className="font-mono text-sm font-medium">{listing.id}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status</span>
                <div className="mt-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      LISTING_STATUS_STYLES[listing.status] ??
                      "bg-neutral-500/10 text-neutral-600"
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Incoming Bids Section */}
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Incoming Bids</h2>

              {bids.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No bids received for this listing yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Proposed Price</th>
                        <th className="px-4 py-3 text-left font-medium">Start Date</th>
                        <th className="px-4 py-3 text-left font-medium">End Date</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((b) => (
                        <tr key={b.id} className="border-t border-border">
                          <td className="px-4 py-3 font-semibold">₹{b.proposed_price}</td>
                          <td className="px-4 py-3">{b.proposed_start}</td>
                          <td className="px-4 py-3">{b.proposed_end}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                BID_STATUS_STYLES[b.status] ??
                                "bg-neutral-500/10 text-neutral-600"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {b.status === "pending" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAccept(b)}
                                  disabled={actionInFlight === b.id}
                                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {actionInFlight === b.id ? "..." : "Accept"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(b)}
                                  disabled={actionInFlight === b.id}
                                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}