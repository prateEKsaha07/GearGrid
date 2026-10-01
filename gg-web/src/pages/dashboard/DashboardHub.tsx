import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

const TABS = [
  "My Listings",
  "My Requests",
  "Browse Nearby",
  "Bookings",
  "Pending",
  "History",
] as const;

type Tab = (typeof TABS)[number];

type Listing = {
  id: string;
  owner_id: string;
  title: string;
  price_per_day: number;
  pincode: string;
  status: string;
};

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

type Booking = {
  id: string;
  listing_id: string | null;
  bid_id: string;
  owner_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  status: string;
  cancelled_reason: string | null;
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
  pickup_in_progress: "bg-blue-500/10 text-blue-700",
  active: "bg-blue-500/10 text-blue-700",
  return_in_progress: "bg-amber-500/10 text-amber-700",
  completed: "bg-neutral-500/10 text-neutral-600",
  cancelled: "bg-red-500/10 text-red-700",
};

const BID_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  accepted: "bg-green-500/10 text-green-700",
  rejected: "bg-red-500/10 text-red-700",
  auto_rejected_overlap: "bg-neutral-500/10 text-neutral-600",
};

function bookingActionFor(role: "owner" | "renter", status: string) {
  if (status === "confirmed" && role === "renter") {
    return { label: "Start Pickup", to: "pickup" as const };
  }
  if (status === "pickup_in_progress" && role === "renter") {
    return { label: "Continue Pickup", to: "pickup" as const };
  }
  if (status === "pickup_in_progress" && role === "owner") {
    return { label: "Track", to: "track" as const };
  }
  if (status === "active" && role === "owner") {
    return { label: "Start Return", to: "return" as const };
  }
  if (status === "active" && role === "renter") {
    return { label: "Request Extension", to: "extension" as const };
  }
  if (status === "return_in_progress" && role === "owner") {
    return { label: "Continue Return", to: "return" as const };
  }
  if (status === "return_in_progress" && role === "renter") {
    return { label: "Track", to: "track" as const };
  }
  if (status === "completed") {
    return { label: "View Invoice", to: "invoice" as const };
  }
  return null;
}

export default function DashboardHub() {
  const [activeTab, setActiveTab] = useState<Tab>("My Listings");
  const profileComplete = false;
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [myListingsRaw, setMyListingsRaw] = useState<Listing[]>([]);
  const [publicListings, setPublicListings] = useState<Listing[]>([]);
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
        const [mineRes, publicRes, requestsRes, bookingsRes, bidsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/listings?owner_id=${userId}`),
          fetch(`${import.meta.env.VITE_API_URL}/listings`),
          fetch(`${import.meta.env.VITE_API_URL}/requests`),
          fetch(`${import.meta.env.VITE_API_URL}/bookings`),
          fetch(`${import.meta.env.VITE_API_URL}/bids`),
        ]);

        const mineData = mineRes.ok ? ((await mineRes.json()) as Listing[]) : [];
        const publicData = publicRes.ok ? ((await publicRes.json()) as Listing[]) : [];
        const requestsData = requestsRes.ok ? ((await requestsRes.json()) as RentalRequest[]) : [];
        const bookingsData = bookingsRes.ok ? ((await bookingsRes.json()) as Booking[]) : [];
        const bidsData = bidsRes.ok ? ((await bidsRes.json()) as Bid[]) : [];

        setMyListingsRaw(mineData);
        setPublicListings(publicData);
        setRequests(requestsData);
        setBookings(bookingsData);
        setBids(bidsData);

        const anyFailed =
          !mineRes.ok || !publicRes.ok || !requestsRes.ok || !bookingsRes.ok || !bidsRes.ok;
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

  const allListingsForLookup = [
    ...myListingsRaw,
    ...publicListings.filter((p) => !myListingsRaw.some((m) => m.id === p.id)),
  ];

  const myListings = myListingsRaw;
  const myRequests = requests.filter((r) => r.renter_id === userId);
  const nearbyListings = publicListings.filter(
    (l) => l.status === "available" && l.pincode
  );
  const myBookings = bookings.filter(
    (b) => b.owner_id === userId || b.renter_id === userId
  );
  const activeBookings = myBookings.filter(
    (b) =>
      b.status === "pickup_in_progress" ||
      b.status === "active" ||
      b.status === "return_in_progress"
  );
  const historyBookings = myBookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );

  const myPendingBids = bids.filter((b) => {
    if (b.status !== "pending") return false;
    if (!b.listing_id) return false;
    const listing = allListingsForLookup.find((l) => l.id === b.listing_id);
    return listing && listing.owner_id === userId;
  });

  const pendingBookings = myBookings.filter((b) => {
    const role = b.owner_id === userId ? "owner" : "renter";
    if (b.status === "confirmed" && role === "renter") return true;
    if (b.status === "active" && role === "owner") return true;
    if (b.status === "pickup_in_progress" && role === "renter") return true;
    if (b.status === "pickup_in_progress" && role === "owner") return false;
    if (b.status === "return_in_progress" && role === "owner") return true;
    if (b.status === "return_in_progress" && role === "renter") return false;
    return false;
  });

  const listingTitleFor = (booking: Booking) => {
    if (!booking.listing_id) return "Booking";
    const listing = allListingsForLookup.find((l) => l.id === booking.listing_id);
    return listing?.title ?? `Booking ${booking.id.slice(0, 8)}`;
  };

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

  const renderBookingRow = (b: Booking) => {
    const role: "owner" | "renter" = b.owner_id === userId ? "owner" : "renter";
    const action = bookingActionFor(role, b.status);
    return (
      <li key={b.id}>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{listingTitleFor(b)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {b.start_date} → {b.end_date} · You are the {role}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {renderStatusBadge(b.status, BOOKING_STATUS_STYLES)}
            {action && (
              <Link
                to={`/bookings/${b.id}/${action.to}`}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
              >
                {action.label}
              </Link>
            )}
          </div>
        </div>
      </li>
    );
  };

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

      case "Bookings":
        if (activeBookings.length === 0 && historyBookings.length === 0) {
          return renderEmpty("No bookings yet.");
        }
        return (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Active
              </h3>
              {activeBookings.length === 0 ? (
                renderEmpty("No active bookings.")
              ) : (
                <ul className="space-y-2">{activeBookings.map(renderBookingRow)}</ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Completed / Cancelled
              </h3>
              {historyBookings.length === 0 ? (
                renderEmpty("No history yet.")
              ) : (
                <ul className="space-y-2">{historyBookings.map(renderBookingRow)}</ul>
              )}
            </section>
          </div>
        );

      case "Pending":
        if (myPendingBids.length === 0 && pendingBookings.length === 0) {
          return renderEmpty("Nothing pending.");
        }
        return (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Bids on your listings
              </h3>
              {myPendingBids.length === 0 ? (
                renderEmpty("No pending bids.")
              ) : (
                <ul className="space-y-2">
                  {myPendingBids.map((b) => {
                    const listing = allListingsForLookup.find((l) => l.id === b.listing_id);
                    return (
                      <li key={b.id}>
                        <Link
                          to={`/listings/${b.listing_id}/manage`}
                          className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition hover:bg-muted"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {listing?.title ?? "Listing"} · ₹{b.proposed_price}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {b.proposed_start} → {b.proposed_end}
                            </p>
                          </div>
                          {renderStatusBadge(b.status, BID_STATUS_STYLES)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Bookings awaiting your action
              </h3>
              {pendingBookings.length === 0 ? (
                renderEmpty("No bookings need your action.")
              ) : (
                <ul className="space-y-2">{pendingBookings.map(renderBookingRow)}</ul>
              )}
            </section>
          </div>
        );

      case "History":
        if (historyBookings.length === 0) return renderEmpty("No history yet.");
        return <ul className="space-y-2">{historyBookings.map(renderBookingRow)}</ul>;
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

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