import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function RequestDashboard() {
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingBids, setLoadingBids] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoadingRequests(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/requests`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = (await res.json()) as RentalRequest[];
        const mine = data.filter((r) => r.renter_id === userId);
        setRequests(mine);
        if (mine.length > 0) setSelectedId(mine[0].id);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    load();
  }, [userId]);

  useEffect(() => {
    if (!selectedId) {
      setBids([]);
      return;
    }

    const load = async () => {
      setLoadingBids(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/bids?request_id=${selectedId}`
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

    load();
  }, [selectedId]);

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">My Requests</h1>
          <button
            type="button"
            onClick={() => navigate("/requests/new")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Post New Request
          </button>
        </div>

        {loadingRequests && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {!loadingRequests && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loadingRequests && !error && requests.length === 0 && (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            You haven't posted any requests yet.
          </div>
        )}

        {!loadingRequests && !error && requests.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-2">
              {requests.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedId === r.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">
                      {r.category}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        REQUEST_STATUS_STYLES[r.status] ??
                        "bg-neutral-500/10 text-neutral-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {r.task_description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.needed_from} → {r.needed_to}
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
                  No bids yet for this request.
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
                            <button
                              type="button"
                              onClick={() => navigate(`/requests/${selectedId}`)}
                              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                            >
                              View
                            </button>
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