import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

type RentalRequest = {
  id: string;
  renter_id: string;
  category: string;
  task_description: string;
  needed_from: string;
  needed_to: string;
  pincode: string;
  status: string;
  voice_input_used: boolean;
  created_at: string;
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

const REQUEST_STATUS_STYLES: Record<string, string> = {
  open: "bg-green-500/10 text-green-700",
  matched: "bg-blue-500/10 text-blue-700",
  expired: "bg-neutral-500/10 text-neutral-600",
};

const BID_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  accepted: "bg-green-500/10 text-green-700",
  rejected: "bg-red-500/10 text-red-700",
  auto_rejected_overlap: "bg-neutral-500/10 text-neutral-600",
};

export default function RequestDetail() {
  const { id: requestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [request, setRequest] = useState<RentalRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  const fetchData = async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);

    try {
      const requestRes = await fetch(
        `${import.meta.env.VITE_API_URL}/requests/${requestId}`
      );
      if (!requestRes.ok) {
        const text = await requestRes.text();
        throw new Error(text || `Request failed with ${requestRes.status}`);
      }
      const requestData = (await requestRes.json()) as RentalRequest;
      setRequest(requestData);

      const bidsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/bids?request_id=${requestId}`
      );
      if (!bidsRes.ok) {
        const text = await bidsRes.text();
        throw new Error(text || `Request failed with ${bidsRes.status}`);
      }
      const bidsData = (await bidsRes.json()) as Bid[];
      setBids(bidsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setRequest(null);
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || !requestId) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, requestId]);

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

      navigate("/success", {
        state: { message: "Booking confirmed", redirectTo: "/dashboard" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: `/requests/${requestId}` },
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

      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Request Detail</h1>

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

        {!loading && !error && request && (
          <div className="space-y-6">
            <section className="rounded-lg border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-medium">Request</h2>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    REQUEST_STATUS_STYLES[request.status] ??
                    "bg-neutral-500/10 text-neutral-600"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="text-right">{request.category}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Pincode</dt>
                  <dd className="text-right">{request.pincode}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Needed From</dt>
                  <dd className="text-right">{request.needed_from}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Needed To</dt>
                  <dd className="text-right">{request.needed_to}</dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">Task Description</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {request.task_description}
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium">Bids</h2>

              {bids.length === 0 ? (
                <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
                  No bids yet for this request.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Price</th>
                        <th className="px-4 py-3 text-left font-medium">Start</th>
                        <th className="px-4 py-3 text-left font-medium">End</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Action</th>
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
                              <button
                                type="button"
                                onClick={() => handleAccept(b)}
                                disabled={actionInFlight === b.id}
                                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {actionInFlight === b.id ? "..." : "Accept"}
                              </button>
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