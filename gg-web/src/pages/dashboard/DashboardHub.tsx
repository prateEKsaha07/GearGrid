import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    if (b.status === "return_in_progress" && role === "owner") return true;
    return false;
  });

  const listingTitleFor = (booking: Booking) => {
    if (!booking.listing_id) return "Booking";
    const listing = allListingsForLookup.find((l) => l.id === booking.listing_id);
    return listing?.title ?? `Booking ${booking.id.slice(0, 8)}`;
  };

  const renderStatusBadge = (status: string, styles: Record<string, string>) => (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-neutral-500/10 text-neutral-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );

  const renderBookingCard = (b: Booking) => {
    const role: "owner" | "renter" = b.owner_id === userId ? "owner" : "renter";
    const action = bookingActionFor(role, b.status);
    const otherRoleLabel = role === "owner" ? "You are the renter" : "You are the owner";

    return (
      <li key={b.id}>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">{listingTitleFor(b)}</p>
            {renderStatusBadge(b.status, BOOKING_STATUS_STYLES)}
          </div>

          <p className="text-xs text-muted-foreground">
            {b.start_date} → {b.end_date}
          </p>

          <span className="inline-flex w-fit rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
            You are the {role}
          </span>

          {b.status === "cancelled" && b.cancelled_reason && (
            <p className="text-xs text-muted-foreground">
              Reason: {b.cancelled_reason.replace(/_/g, " ")}
            </p>
          )}

          {action && (
            <Link
              to={`/bookings/${b.id}/${action.to}`}
              className="mt-1 w-fit rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            >
              {action.label}
            </Link>
          )}
        </div>
      </li>
    );
  };

  const statCards = [
    { label: "My Listings", value: myListings.length },
    { label: "My Requests", value: myRequests.length },
    { label: "Active Tools", value: activeBookings.length },
    { label: "Pending Decisions", value: myPendingBids.length + pendingBookings.length },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Greeting */}
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Namaste, User
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your listings, requests and handoffs in one place.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => navigate("/listings/new")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              + Add listing
            </button>
            <button
              type="button"
              onClick={() => navigate("/requests/new")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Post request
            </button>
          </div>
        </div>

        {/* Profile banner */}
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-amber-700">⚠</span>
            <div>
              <p className="text-sm font-medium text-amber-900">
                Complete your profile to transact safely
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Add your address, phone and preferred direct-payment details.
                Browsing stays available.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile/edit")}
            className="shrink-0 rounded-lg border border-amber-300 bg-background px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
          >
            Complete profile
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

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

        {!loading && !error && (
          <div className="space-y-10">
            {/* My Listings */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">My Listings</h2>
                <Link
                  to="/dashboard?tab=listings"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Open Listing Dashboard →
                </Link>
              </div>
              {myListings.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                  No listings yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {myListings.slice(0, 3).map((l) => (
                    <Link
                      key={l.id}
                      to={`/listings/${l.id}/manage`}
                      className="rounded-xl border border-border bg-card p-4 transition hover:bg-muted"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">{l.title}</p>
                        {renderStatusBadge(l.status, LISTING_STATUS_STYLES)}
                      </div>
                      <p className="mt-2 text-sm">₹{l.price_per_day}/day</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {l.pincode}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* My Requests */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">My Requests</h2>
                <Link
                  to="/requests"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Open Request Dashboard →
                </Link>
              </div>
              {myRequests.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                  No requests yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {myRequests.slice(0, 2).map((r) => (
                    <Link
                      key={r.id}
                      to={`/requests/${r.id}`}
                      className="rounded-xl border border-border bg-card p-4 transition hover:bg-muted"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">{r.category}</p>
                        {renderStatusBadge(r.status, REQUEST_STATUS_STYLES)}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {r.task_description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {r.needed_from} → {r.needed_to} · {r.pincode}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Browse Nearby */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Browse Nearby</h2>
                <Link
                  to="/browse"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  See all equipment →
                </Link>
              </div>
              {nearbyListings.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                  No available listings nearby.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {nearbyListings.slice(0, 3).map((l) => (
                    <Link
                      key={l.id}
                      to={`/listings/${l.id}`}
                      className="rounded-xl border border-border bg-card p-4 transition hover:bg-muted"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">{l.title}</p>
                        {renderStatusBadge(l.status, LISTING_STATUS_STYLES)}
                      </div>
                      <p className="mt-2 text-sm">₹{l.price_per_day}/day</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {l.pincode}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Bookings */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Bookings</h2>
                <span className="text-xs text-muted-foreground">
                  pickup_in_progress · active · return_in_progress
                </span>
              </div>

              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active
              </h3>
              {activeBookings.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                  No active bookings.
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {activeBookings.map(renderBookingCard)}
                </ul>
              )}

              <h3 className="mb-2 mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Archived
              </h3>
              {historyBookings.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                  No archived bookings.
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {historyBookings.map(renderBookingCard)}
                </ul>
              )}
            </section>

            {/* Pending */}
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Pending</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold">Pending Decisions</h3>
                  {myPendingBids.length === 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      No pending bids.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {myPendingBids.map((b) => {
                        const listing = allListingsForLookup.find(
                          (l) => l.id === b.listing_id
                        );
                        return (
                          <li key={b.id}>
                            <Link
                              to={`/listings/${b.listing_id}/manage`}
                              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition hover:bg-muted"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">
                                  {listing?.title ?? "Listing"} · ₹{b.proposed_price}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
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
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold">
                    Won / Confirmed Awaiting Handoff
                  </h3>
                  {pendingBookings.length === 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      No bookings awaiting action.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {pendingBookings.map((b) => {
                        const role: "owner" | "renter" =
                          b.owner_id === userId ? "owner" : "renter";
                        const action = bookingActionFor(role, b.status);
                        return (
                          <li
                            key={b.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">
                                {listingTitleFor(b)}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {b.start_date} → {b.end_date} · You are the {role}
                              </p>
                            </div>
                            {action && (
                              <Link
                                to={`/bookings/${b.id}/${action.to}`}
                                className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium transition hover:bg-muted"
                              >
                                {action.label}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* History */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">History</h2>
                <span className="text-xs text-muted-foreground">
                  Completed and cancelled bookings
                </span>
              </div>
              {historyBookings.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                  No history yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {historyBookings.slice(0, 5).map((b) => {
                    const role: "owner" | "renter" =
                      b.owner_id === userId ? "owner" : "renter";
                    return (
                      <li key={b.id}>
                        <Link
                          to={`/bookings/${b.id}/invoice`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:bg-muted"
                        >
                          <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {role}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {listingTitleFor(b)}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {b.start_date} → {b.end_date}
                          </span>
                          {renderStatusBadge(b.status, BOOKING_STATUS_STYLES)}
                          <span className="shrink-0 text-xs text-muted-foreground">
                            Invoice & records →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}