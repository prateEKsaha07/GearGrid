import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalNavBar } from "../../components/shared/GlobalNavBar";
import { SectionHeader } from "../../components/shared/SectionHeader";
import { StatTile } from "../../components/shared/StatTile";
import { EquipmentListingCard } from "../../components/shared/EquipmentListingCard";
import { RequestCard } from "../../components/shared/RequestCard";
import { BookingCard } from "../../components/shared/BookingCard";
import { PaymentStatusBadge } from "../../components/shared/PaymentStatusBadge";
import { Button } from "../../components/ui/button";
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

  const renderLoading = () => (
    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="ml-2">Loading…</span>
    </div>
  );

  const renderEmpty = (message: string) => (
    <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
  );

  const availableCount = s1Listings.filter((l) => l.status === "available").length;
  const bookedCount = s1Listings.filter((l) => l.status === "booked").length;
  const matchedCount = s2Requests.filter((r) => r.status === "matched").length;
  const openCount = s2Requests.filter((r) => r.status === "open").length;
  const pendingDecisions = s4Bids.length + s5Extensions.length;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalNavBar
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Browse", href: "/browse" },
          { label: "Notifications", href: "/notifications", count: 0 },
          { label: "Profile", href: "/profile" },
        ]}
        activeHref="/dashboard"
        userName="User"
        language="en"
        onLanguageChange={() => {}}
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {today}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Control Tower
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your listings, requests and active bookings in one place.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={() => navigate("/listings/new")}>+ Add listing</Button>
            <Button variant="outline" onClick={() => navigate("/requests/new")}>
              Post request
            </Button>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="My Listings"
            value={s1Listings.length}
            caption={`${availableCount} available · ${bookedCount} booked`}
          />
          <StatTile
            label="My Requests"
            value={s2Requests.length}
            caption={`${matchedCount} matched · ${openCount} open`}
          />
          <StatTile
            label="Active Tools"
            value={s3Bookings.length}
            caption={`${s3Bookings.filter((b) => b.owner_id === userId).length} lent · ${
              s3Bookings.filter((b) => b.renter_id === userId).length
            } held`}
          />
          <StatTile
            label="Pending Decisions"
            value={pendingDecisions}
            caption={`${s4Bids.length} bids · ${s5Extensions.length} handoffs`}
          />
        </div>

        <div className="space-y-8">
          {/* My Listings */}
          <section>
            <SectionHeader
              title="My Listings"
              actionLabel="Open Listing Dashboard"
              onAction={() => navigate("/listings")}
            />
            {s1Loading
              ? renderLoading()
              : s1Listings.length === 0
              ? renderEmpty("No listings found.")
              : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {s1Listings.map((l) => (
                    <EquipmentListingCard
                      key={l.id}
                      title={l.title}
                      pricePerDay={l.price_per_day}
                      status={l.status}
                      pincode={l.pincode}
                      actionLabel="Manage"
                      onAction={() => navigate(`/listings/${l.id}/manage`)}
                    />
                  ))}
                </div>
              )}
          </section>

          {/* My Requests */}
          <section>
            <SectionHeader
              title="My Requests"
              actionLabel="Open Request Dashboard"
              onAction={() => navigate("/requests")}
            />
            {s2Loading
              ? renderLoading()
              : s2Requests.length === 0
              ? renderEmpty("No requests found.")
              : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {s2Requests.map((r) => (
                    <RequestCard
                      key={r.id}
                      category={r.category}
                      description={r.task_description}
                      neededFrom={r.needed_from}
                      neededTo={r.needed_to}
                      pincode={r.pincode}
                      status={r.status}
                      actionLabel="View Bids"
                      onAction={() => navigate(`/requests/${r.id}`)}
                    />
                  ))}
                </div>
              )}
          </section>

          {/* My Bookings */}
          <section>
            <SectionHeader
              title="My Bookings"
              subtitle="Track pickup, active rentals, returns, and archived bookings"
            />
            {s3Loading
              ? renderLoading()
              : s3Bookings.length === 0
              ? renderEmpty("No active bookings.")
              : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {s3Bookings.map((b) => {
                    const isOwner = b.owner_id === userId;
                    const listingTitle = b.listing_id
                      ? s3ListingsMap[b.listing_id]?.title ?? "Booking Equipment"
                      : "Booking";

                    return (
                      <BookingCard
                        key={b.id}
                        title={listingTitle}
                        startDate={b.start_date}
                        endDate={b.end_date}
                        status={b.status}
                        isOwner={isOwner}
                        metaLine={b.cancelled_reason ?? undefined}
                        actionLabel="Track"
                        onAction={() => navigate(`/bookings/${b.id}/track`)}
                      />
                    );
                  })}
                </div>
              )}
          </section>

          {/* Pending Bids */}
          <section>
            <SectionHeader title="Pending Bids" />
            {s4Loading
              ? renderLoading()
              : s4Bids.length === 0
              ? renderEmpty("No pending bids.")
              : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {s4Bids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex flex-col justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            ₹{bid.proposed_price.toLocaleString("en-IN")}
                          </p>
                          <PaymentStatusBadge status={bid.status} domain="bid" />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {bid.proposed_start} → {bid.proposed_end}
                        </p>
                      </div>
                      {bid.listing_id && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/listings/${bid.listing_id}`)}
                          className="mt-4 w-full"
                        >
                          View Listing
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </section>

          {/* Pending Extensions */}
          <section>
            <SectionHeader title="Pending Extensions" />
            {s5Loading
              ? renderLoading()
              : s5Extensions.length === 0
              ? renderEmpty("No pending extension requests.")
              : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {s5Extensions.map((ext) => (
                    <div
                      key={ext.id}
                      className="flex flex-col justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {ext.requested_days} Requested Day(s)
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Extra Fee: ₹{ext.extra_fee}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/bookings/${ext.booking_id}/track`)}
                        className="mt-4 w-full"
                      >
                        Open Booking
                      </Button>
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