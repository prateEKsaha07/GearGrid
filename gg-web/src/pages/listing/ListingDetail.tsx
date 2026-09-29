import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

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

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showBidForm, setShowBidForm] = useState(false);
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedStart, setProposedStart] = useState("");
  const [proposedEnd, setProposedEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/listings/${id}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = (await res.json()) as Listing;
        setListing(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const body = {
      listing_id: id,
      bidder_id: userId,
      proposed_price: Number(proposedPrice),
      proposed_start: proposedStart,
      proposed_end: proposedEnd,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      navigate("/success", {
        state: {
          message: "Bid placed successfully",
          redirectTo: "/dashboard",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: `/listings/${id}` },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const optionalRows: { label: string; value: string | number }[] = [];
  if (listing) {
    if (listing.brand) optionalRows.push({ label: "Brand", value: listing.brand });
    if (listing.model_name) optionalRows.push({ label: "Model", value: listing.model_name });
    if (listing.condition_grade)
      optionalRows.push({ label: "Condition", value: listing.condition_grade });
    if (listing.registration_number)
      optionalRows.push({ label: "Registration", value: listing.registration_number });
    if (listing.fuel_type) optionalRows.push({ label: "Fuel Type", value: listing.fuel_type });
    if (listing.power_source)
      optionalRows.push({ label: "Power Source", value: listing.power_source });
    if (listing.capacity_spec)
      optionalRows.push({ label: "Capacity", value: listing.capacity_spec });
    if (listing.manufacture_year)
      optionalRows.push({ label: "Manufactured", value: listing.manufacture_year });
    if (listing.horsepower)
      optionalRows.push({ label: "Horsepower", value: `${listing.horsepower} HP` });
  }

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-4xl px-6 py-8">
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

        {!loading && !error && listing && (
          <div className="space-y-6">
            <div>
              {listing.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {listing.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${listing.title} photo ${i + 1}`}
                      className="aspect-square w-full rounded-lg border border-border object-cover"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex aspect-[3/1] w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  No photos
                </div>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{listing.pincode}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_STYLES[listing.status] ?? "bg-neutral-500/10 text-neutral-600"
                }`}
              >
                {listing.status}
              </span>
            </div>

            <p className="text-2xl font-semibold">
              ₹{listing.price_per_day}
              <span className="text-base font-normal text-muted-foreground">/day</span>
            </p>

            <p className="whitespace-pre-wrap text-sm">{listing.description}</p>

            {optionalRows.length > 0 && (
              <div className="rounded-lg border border-border p-4">
                <h2 className="mb-3 text-sm font-medium">Specifications</h2>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {optionalRows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {!showBidForm && (
              <button
                type="button"
                onClick={() => setShowBidForm(true)}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:w-auto sm:px-8"
              >
                Place Bid
              </button>
            )}

            {showBidForm && (
              <form
                onSubmit={handleBidSubmit}
                className="space-y-4 rounded-lg border border-border p-4"
              >
                <h2 className="text-sm font-medium">Place a Bid</h2>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Proposed Price (₹/day)
                  </label>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    min={0}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      value={proposedStart}
                      onChange={(e) => setProposedStart(e.target.value)}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <input
                      type="date"
                      value={proposedEnd}
                      onChange={(e) => setProposedEnd(e.target.value)}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? "Submitting..." : "Submit Bid"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBidForm(false)}
                    className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}