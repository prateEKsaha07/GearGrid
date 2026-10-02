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
};

export default function BrowseRequests() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [pincode, setPincode] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const fetchRequests = async (searchPincode?: string, searchCategory?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${import.meta.env.VITE_API_URL}/requests`);
      
      if (searchPincode && searchPincode.trim() !== "") {
        url.searchParams.append("pincode", searchPincode.trim());
      }
      if (searchCategory && searchCategory.trim() !== "") {
        url.searchParams.append("category", searchCategory.trim());
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data: RentalRequest[] = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests(pincode, category);
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Browse Open Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find rental requests from farmers and renters in your area and place bids.
          </p>
        </div>

        {/* Filter Form */}
        <form
          onSubmit={handleFilterSubmit}
          className="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by Category (e.g. Tractor, Harvester)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 shrink-0"
          >
            Apply Filters
          </button>
        </form>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="ml-3">Loading open requests...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center text-sm text-red-900">
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center">
            <p className="text-base font-medium">No open requests found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => {
              const isOwnRequest = request.renter_id === userId;

              return (
                <div
                  key={request.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {request.category}
                      </span>
                      {isOwnRequest && (
                        <span className="rounded-full bg-neutral-500/10 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                          Your request
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-foreground">
                      {truncateDescription(request.task_description, 100)}
                    </p>

                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium">Dates:</span> {request.needed_from} → {request.needed_to}
                      </p>
                      <p>
                        <span className="font-medium">Pincode:</span> {request.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    {!isOwnRequest && (
                      <button
                        type="button"
                        onClick={() => navigate(`/requests/${request.id}`)}
                        className="w-full rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                      >
                        View & Bid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}