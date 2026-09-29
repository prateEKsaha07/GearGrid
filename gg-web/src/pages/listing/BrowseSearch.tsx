import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";

type Listing = {
  id: string;
  owner_id: string;
  category_id: string;
  title: string;
  description: string;
  price_per_day: number;
  pincode: string;
  photos: string[];
  status: string;
  is_success: boolean;
  brand: string | null;
  model_name: string | null;
  condition_grade: string | null;
  registration_number: string | null;
  fuel_type: string | null;
  power_source: string | null;
  capacity_spec: string | null;
  manufacture_year: number | null;
  horsepower: number | null;
  created_at: string;
  updated_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-500/10 text-green-700",
  booked: "bg-amber-500/10 text-amber-700",
  under_maintenance: "bg-orange-500/10 text-orange-700",
  unlisted: "bg-neutral-500/10 text-neutral-600",
};

export default function BrowseSearch() {
  const navigate = useNavigate();

  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (pincode.trim()) params.set("pincode", pincode.trim());

    const query = params.toString();
    const url = `${import.meta.env.VITE_API_URL}/listings${query ? `?${query}` : ""}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data = (await res.json()) as Listing[];
      setListings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const filteredListings = listings.filter((l) => {
    if (category.trim()) {
      const needle = category.trim().toLowerCase();
      const haystack = `${l.title} ${l.brand ?? ""} ${l.model_name ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (maxPrice.trim()) {
      const max = Number(maxPrice);
      if (!Number.isNaN(max) && l.price_per_day > max) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Browse Equipment</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-lg border border-border p-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560001"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Tractor"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Max Price (₹/day)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min={0}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Apply Filters
              </button>
            </form>
          </aside>

          <section>
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

            {!loading && !error && filteredListings.length === 0 && (
              <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
                No equipment found. Try adjusting your filters.
              </div>
            )}

            {!loading && !error && filteredListings.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-tight">{l.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[l.status] ??
                          "bg-neutral-500/10 text-neutral-600"
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {l.pincode}
                    </p>

                    <p className="mt-3 text-lg font-semibold">
                      ₹{l.price_per_day}
                      <span className="text-sm font-normal text-muted-foreground">
                        /day
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate(`/listings/${l.id}`)}
                      className="mt-4 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}