import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

const TABS = [
  "My Listings",
  "My Requests",
  "Browse Nearby",
  "Active Tools",
  "Pending",
  "History",
] as const;

type Tab = (typeof TABS)[number];

type Listing = {
  id: string;
  title: string;
  price_per_day: number;
  pincode: string;
  status: string;
};

type RentalRequest = {
  id: string;
  category: string;
  task_description: string;
  needed_from: string;
  needed_to: string;
  pincode: string;
  status: string;
};

type Booking = {
  id: string;
  listing_id: string;
  bid_id: string;
  owner_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
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
};

const LISTING_STATUS_STYLES: Record<string, string> = {
  available: "bg-green-500/10 text-green-700",
  booked: "bg-amber-500/10 text-amber-700",
  under_maintenance: "bg-orange-500/10 text-orange-700",
  unlisted: "bg-neutral-500/10 text-neutral-600",
};

const REQUEST_STATUS_STYLES: Record<string, string> = {
  open: "bg-green-500/10 text-green-700",
  matched: "bg-blue-500/10 text-blue-700",
  expired: "bg-neutral-500/10 text-neutral-600",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-700",
  active: "bg-blue-500/10 text-blue-700",
  return_pending: "bg-amber-500/10 text-amber-700",
  completed: "bg-neutral-500/10 text-neutral-600",
  non_returned: "bg-red-500/10 text-red-700",
  cancelled: "bg-red-500/10 text-red-700",
};

const BID_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  accepted: "bg-green-500/10 text-green-700",
  rejected: "bg-red-500/10 text-red-700",
  auto_rejected_overlap: "bg-neutral-500/10 text-neutral-600",
};

export default function DashboardHub() {
  const [activeTab, setActiveTab] = useState<Tab>("My Listings");
  const profileComplete = false;
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [listingsRes, requestsRes, bookingsRes, bidsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/listings`),
          fetch(`${import.meta.env.VITE_API_URL}/requests`),
          fetch(`${import.meta.env.VITE_API_URL}/bookings`),
          fetch(`${import.meta.env.VITE_API_URL}/bids?bidder_id=${userId}`),
        ]);

        const listingsData = listingsRes.ok ? ((await listingsRes.json()) as Listing[]) : [];
        const requestsData = requestsRes.ok ? ((await requestsRes.json()) as RentalRequest[]) : [];
        const bookingsData = bookingsRes.ok ? ((await bookingsRes.json()) as Booking[]) : [];
        const bidsData = bidsRes.ok ? ((await bidsRes.json()) as Bid[]) : [];

        setListings(listingsData);
        setRequests(requestsData);
        setBookings(bookingsData);
        setBids(bidsData);

        const anyFailed = !listingsRes.ok || !requestsRes.ok || !bookingsRes.ok || !bidsRes.ok;
        if (anyFailed) {
          setError("Some data failed to load. Check the uvicorn log.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const myListings = listings.filter((l) => l.status !== "unlisted");

  const myRequests = requests.filter(
    (r) => r.status === "open" || r.status === "matched"
  );

  const nearbyListings = listings.filter(
    (l) => l.status === "available" && l.pincode
  );

  const activeTools = bookings.filter(
    (b) => b.status === "active" || b.status === "return_pending"
  );

  const pendingBids = bids.filter((b) => b.status === "pending");

  const historyBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled" || b.status === "non_returned"
  );

  const renderStatusBadge = (status: string, styles: Record<string, string>) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-neutral-500/10 text-neutral-600"
      }`}
    >
      {status}
    </span>
  );

  const renderEmpty = (message: string) => (
    <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
          Loading...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      );
    }

    switch (activeTab) {
      case "My Listings":
        if (myListings.length === 0) return renderEmpty("No listings yet.");
        return (
          <ul className="space-y-2">
            {myListings.map((l) => (
              <li key={l.id}>
                <Link
                  to={`/listings/${l.id}/manage`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ₹{l.price_per_day}/day · {l.pincode}
                    </p>
                  </div>
                  {renderStatusBadge(l.status, LISTING_STATUS_STYLES)}
                </Link>
              </li>
            ))}
          </ul>
        );

      case "My Requests":
        if (myRequests.length === 0) return renderEmpty("No requests yet.");
        return (
          <ul className="space-y-2">
            {myRequests.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/requests/${r.id}`}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3 transition hover:bg-muted"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.category}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {r.task_description}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.needed_from} → {r.needed_to}
                    </p>
                  </div>
                  {renderStatusBadge(r.status, REQUEST_STATUS_STYLES)}
                </Link>
              </li>
            ))}
          </ul>
        );

      case "Browse Nearby":
        if (nearbyListings.length === 0) return renderEmpty("No available listings nearby.");
        return (
          <ul className="space-y-2">
            {nearbyListings.map((l) => (
              <li key={l.id}>
                <Link
                  to={`/listings/${l.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ₹{l.price_per_day}/day · {l.pincode}
                    </p>
                  </div>
                  {renderStatusBadge(l.status, LISTING_STATUS_STYLES)}
                </Link>
              </li>
            ))}
          </ul>
        );

      case "Active Tools":
        if (activeTools.length === 0) return renderEmpty("No active rentals.");
        return (
          <ul className="space-y-2">
            {activeTools.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/bookings/${b.id}/active`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">Booking {b.id.slice(0, 8)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.start_date} → {b.end_date}
                    </p>
                  </div>
                  {renderStatusBadge(b.status, BOOKING_STATUS_STYLES)}
                </Link>
              </li>
            ))}
          </ul>
        );

      case "Pending":
        if (pendingBids.length === 0) return renderEmpty("No pending bids.");
        return (
          <ul className="space-y-2">
            {pendingBids.map((b) => (
              <li key={b.id}>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">₹{b.proposed_price}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.proposed_start} → {b.proposed_end}
                    </p>
                  </div>
                  {renderStatusBadge(b.status, BID_STATUS_STYLES)}
                </div>
              </li>
            ))}
          </ul>
        );

      case "History":
        if (historyBookings.length === 0) return renderEmpty("No history yet.");
        return (
          <ul className="space-y-2">
            {historyBookings.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/bookings/${b.id}/invoice`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">Booking {b.id.slice(0, 8)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.start_date} → {b.end_date}
                    </p>
                  </div>
                  {renderStatusBadge(b.status, BOOKING_STATUS_STYLES)}
                </Link>
              </li>
            ))}
          </ul>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {!profileComplete && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Complete your profile to start listing or bidding
          </div>
        )}

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/dev")}
            className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            Dev Routes
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border p-6">{renderContent()}</div>
      </div>
    </div>
  );
}