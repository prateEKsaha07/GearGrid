import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

type Listing = {
  id: string;
  owner_id: string;
  title: string;
  price_per_day: number;
  pincode: string;
  status: string;
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
  const { userId, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingBids, setLoadingBids] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoadingListings(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/listings`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = (await res.json()) as Listing[];
        const mine = data.filter((l) => l.owner_id === userId);
        setListings(mine);
        if (mine.length > 0) setSelectedId(mine[0].id);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setListings([]);
      } finally {
        setLoadingListings(false);
      }
    };

    load();
  }, [userId]);

  const fetchBids = async (listingId: string) => {
    setLoadingBids(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bids?listing_id=${listingId}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data = (await res.json()) as Bid[];
      setBids(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  useEffect(() => {
    if (selectedId) fetchBids(selectedId);
    else setBids([]);
  }, [selectedId]);

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
        state: { message, redirectTo: "/listings/" + (selectedId ?? "") + "/manage" },
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

      if (selectedId) await fetchBids(selectedId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: "/listings/" + (selectedId ?? "") + "/manage" },
      });
    } finally {
      setActionInFlight(null);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Listing Dashboard</h1>

        {loadingListings && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {!loadingListings && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loadingListings && !error && listings.length === 0 && (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            You haven't created any listings yet.
          </div>
        )}

        {!loadingListings && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-2">
              {listings.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedId(l.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedId === l.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">{l.title}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        LISTING_STATUS_STYLES[l.status] ??
                        "bg-neutral-500/10 text-neutral-600"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ₹{l.price_per_day}/day · {l.pincode}
                  </p>
                </button>
              ))}
            </aside>

            <section>
              {loadingBids && (
                <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
                  Loading bids...
                </div>
              )}

              {!loadingBids && bids.length === 0 && (
                <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
                  No bids yet for this listing.
                </div>
              )}

              {!loadingBids && bids.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Price</th>
                        <th className="px-4 py-3 text-left font-medium">Start</th>
                        <th className="px-4 py-3 text-left font-medium">End</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((b) => (
                        <tr key={b.id} className="border-t border-border">
                          <td className="px-4 py-3">₹{b.proposed_price}</td>
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