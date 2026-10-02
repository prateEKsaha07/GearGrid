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

type ExtensionRequest = {
  id: string;
  booking_id: string;
  requested_days: number;
  extra_fee: number;
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

export default function DashboardHub() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [s1Listings, setS1Listings] = useState<Listing[]>([]);
  const [s1Loading, setS1Loading] = useState(true);

  const [s2Requests, setS2Requests] = useState<RentalRequest[]>([]);
  const [s2Loading, setS2Loading] = useState(true);

  const [s3Bookings, setS3Bookings] = useState<Booking[]>([]);
  const [s3ListingsMap, setS3ListingsMap] = useState<Record<string, Listing>>({});
  const [s3Loading, setS3Loading] = useState(true);

  const [s4Bids, setS4Bids] = useState<Bid[]>([]);
  const [s4Loading, setS4Loading] = useState(true);

  const [s5Extensions, setS5Extensions] = useState<ExtensionRequest[]>([]);
  const [s5Loading, setS5Loading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const apiUrl = import.meta.env.VITE_API_URL;

    // Section 1 — My Listings
    const fetchSection1 = async () => {
      setS1Loading(true);
      try {
        const res = await fetch(`${apiUrl}/listings?owner_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setS1Listings(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setS1Loading(false);
      }
    };

    // Section 2 — My Requests
    const fetchSection2 = async () => {
      setS2Loading(true);
      try {
        const res = await fetch(`${apiUrl}/requests?renter_id=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setS2Requests(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setS2Loading(false);
      }
    };

    // Section 3 — My Bookings (completed hidden; cancelled visible)
    const fetchSection3 = async () => {
      setS3Loading(true);
      try {
        const res = await fetch(`${apiUrl}/bookings`);
        if (!res.ok) return;
        const allBookings: Booking[] = await res.json();
        const mine = allBookings.filter(
          (b) =>
            (b.owner_id === userId || b.renter_id === userId) &&
            b.status !== "completed"
        );
        setS3Bookings(mine);

        const listingIds = Array.from(
          new Set(
            mine
              .map((b) => b.listing_id)
              .filter((id): id is string => Boolean(id))
          )
        );

        if (listingIds.length > 0) {
          const listingRes = await fetch(`${apiUrl}/listings`);
          if (listingRes.ok) {
            const allListings: Listing[] = await listingRes.json();
            const map: Record<string, Listing> = {};
            allListings.forEach((l) => {
              if (listingIds.includes(l.id)) map[l.id] = l;
            });
            setS3ListingsMap(map);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setS3Loading(false);
      }
    };

    // Section 4 — Pending Bids
    const fetchSection4 = async () => {
      setS4Loading(true);
      try {
        const res = await fetch(`${apiUrl}/bids`);
        if (res.ok) {
          const data: Bid[] = await res.json();
          const filtered = data.filter(
            (b) => b.bidder_id === userId && b.status === "pending"
          );
          setS4Bids(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setS4Loading(false);
      }
    };

    // Section 5 — Pending Extensions
    const fetchSection5 = async () => {
      setS5Loading(true);
      try {
        const bookingRes = await fetch(`${apiUrl}/bookings?owner_id=${userId}`);
        if (!bookingRes.ok) {
          setS5Extensions([]);
          return;
        }
        const ownerBookings: Booking[] = await bookingRes.json();
        if (ownerBookings.length === 0) {
          setS5Extensions([]);
          return;
        }

        const ownerBookingIds = ownerBookings.map((b) => b.id);
        const extRes = await fetch(`${apiUrl}/extensions`);
        if (!extRes.ok) {
          setS5Extensions([]);
          return;
        }
        const allExtensions: ExtensionRequest[] = await extRes.json();
        const mine = allExtensions.filter(
          (ext) =>
            ownerBookingIds.includes(ext.booking_id) && ext.status === "pending"
        );
        setS5Extensions(mine);
      } catch (err) {
        console.error(err);
      } finally {
        setS5Loading(false);
      }
    };

    fetchSection1();
    fetchSection2();
    fetchSection3();
    fetchSection4();
    fetchSection5();
  }, [userId]);

  const renderStatusBadge = (status: string, styles: Record<string, string>) => (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-neutral-500/10 text-neutral-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );

  const renderLoadingSpinner = () => (
    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="ml-2">Loading...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Control Tower
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your listings, requests, and active bookings in one place.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate("/listings/new")}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            New Listing
          </button>
          <button
            type="button"
            onClick={() => navigate("/requests/new")}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => navigate("/browse")}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            Browse Equipment
          </button>
          <button
            type="button"
            onClick={() => navigate("/browse/requests")}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            Browse Requests
          </button>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">My Listings</h2>
            {s1Loading ? (
              renderLoadingSpinner()
            ) : s1Listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No listings found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {s1Listings.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{l.title}</p>
                        {renderStatusBadge(l.status, LISTING_STATUS_STYLES)}
                      </div>
                      <p className="mt-2 text-sm font-medium">₹{l.price_per_day}/day</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/listings/${l.id}/manage`)}
                      className="mt-4 w-full rounded-md bg-secondary py-1.5 text-xs font-medium text-secondary-foreground transition hover:opacity-90"
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">My Requests</h2>
            {s2Loading ? (
              renderLoadingSpinner()
            ) : s2Requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {s2Requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{r.category}</p>
                        {renderStatusBadge(r.status, REQUEST_STATUS_STYLES)}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {r.task_description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {r.needed_from} → {r.needed_to}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/requests/${r.id}`)}
                      className="mt-4 w-full rounded-md bg-secondary py-1.5 text-xs font-medium text-secondary-foreground transition hover:opacity-90"
                    >
                      View Bids
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">My Bookings</h2>
            {s3Loading ? (
              renderLoadingSpinner()
            ) : s3Bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active bookings.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {s3Bookings.map((b) => {
                  const isOwner = b.owner_id === userId;
                  const listingTitle = b.listing_id
                    ? s3ListingsMap[b.listing_id]?.title ?? "Booking Equipment"
                    : "Booking";

                  return (
                    <div
                      key={b.id}
                      className="flex flex-col justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm">{listingTitle}</p>
                          {renderStatusBadge(b.status, BOOKING_STATUS_STYLES)}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {b.start_date} → {b.end_date}
                        </p>
                        <span className="mt-2 inline-block rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          {isOwner ? "You are the owner" : "You are the renter"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/bookings/${b.id}/track`)}
                        className="mt-4 w-full rounded-md bg-secondary py-1.5 text-xs font-medium text-secondary-foreground transition hover:opacity-90"
                      >
                        Track
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Pending Bids</h2>
            {s4Loading ? (
              renderLoadingSpinner()
            ) : s4Bids.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending bids.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {s4Bids.map((bid) => (
                  <div
                    key={bid.id}
                    className="flex flex-col justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">₹{bid.proposed_price}</p>
                        {renderStatusBadge(bid.status, BID_STATUS_STYLES)}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {bid.proposed_start} → {bid.proposed_end}
                      </p>
                    </div>
                    {bid.listing_id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/listings/${bid.listing_id}`)}
                        className="mt-4 w-full rounded-md bg-secondary py-1.5 text-xs font-medium text-secondary-foreground transition hover:opacity-90"
                      >
                        View Listing
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">
              Pending Extensions
            </h2>
            {s5Loading ? (
              renderLoadingSpinner()
            ) : s5Extensions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending extension requests.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {s5Extensions.map((ext) => (
                  <div
                    key={ext.id}
                    className="flex flex-col justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {ext.requested_days} Requested Day(s)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Extra Fee: ₹{ext.extra_fee}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/bookings/${ext.booking_id}/track`)}
                      className="mt-4 w-full rounded-md bg-secondary py-1.5 text-xs font-medium text-secondary-foreground transition hover:opacity-90"
                    >
                      Open Booking
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