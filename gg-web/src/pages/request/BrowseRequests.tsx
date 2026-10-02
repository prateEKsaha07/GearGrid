import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

function daysBetween(from: string, to: string) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.max(1, Math.round((b - a) / 86400000));
}

export default function BrowseRequests() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState("");
  const [applied, setApplied] = useState({ pincode: "", category: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/requests`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = (await res.json()) as RentalRequest[];
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (applied.pincode && r.pincode !== applied.pincode) return false;
      if (applied.category) {
        const needle = applied.category.toLowerCase();
        const haystack = `${r.category} ${r.task_description}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [requests, applied]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ pincode: pincode.trim(), category: category.trim() });
  };

  const clearFilters = () => {
    setPincode("");
    setCategory("");
    setApplied({ pincode: "", category: "" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Open Requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse what renters nearby are looking for. Bid to fulfil a request.
            </p>
          </div>
          <Link
            to="/browse"
            className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            View equipment
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Pincode
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 560001"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Category / keyword
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. tractor, plough"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="mt-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-auto rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Clear
          </button>
        </form>

        {loading && (
          <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
            No open requests match your filters.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <Link
                key={r.id}
                to={`/requests/${r.id}`}
                className="flex flex-col rounded-xl border border-border bg-card p-4 transition hover:bg-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold leading-tight">{r.category}</h3>
                  <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700">
                    {r.status}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                  {r.task_description}
                </p>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>
                    {r.needed_from} → {r.needed_to}{" "}
                    <span className="opacity-70">
                      ({daysBetween(r.needed_from, r.needed_to)}d)
                    </span>
                  </p>
                  <p>📍 {r.pincode}</p>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <span className="text-xs font-medium text-primary">
                    View request & bid →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}