import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/shared/NavBar";

type IDs = {
  listingId: string;
  requestId: string;
  bookingId: string;
  bidId: string;
};

const STORAGE_KEY = "gg_dev_ids";

const EMPTY_IDS: IDs = {
  listingId: "",
  requestId: "",
  bookingId: "",
  bidId: "",
};

type FlowStep = {
  label: string;
  role: "owner" | "renter" | "either";
  method?: string;
  path: (ids: IDs) => string;
  note?: string;
  requires?: keyof IDs;
};

const FLOW_STEPS: FlowStep[] = [
  {
    label: "1. Landing",
    role: "either",
    path: () => "/",
    note: "Wake backend",
  },
  {
    label: "2. Login / Signup",
    role: "either",
    path: () => "/login",
  },
  {
    label: "3. Dashboard Hub",
    role: "either",
    path: () => "/dashboard",
  },
  {
    label: "4. Add Listing",
    role: "owner",
    path: () => "/listings/new",
    note: "creates listing — copy id after",
  },
  {
    label: "5. Browse",
    role: "either",
    path: () => "/browse",
  },
  {
    label: "6. Listing Detail",
    role: "either",
    path: (ids) => `/listings/${ids.listingId}`,
    requires: "listingId",
    note: "renter bids here",
  },
  {
    label: "7. Listing Dashboard (accept bid)",
    role: "owner",
    path: (ids) => `/listings/${ids.listingId}/manage`,
    requires: "listingId",
    note: "owner accepts bid → booking created",
  },
  {
    label: "8. Booking Tracker",
    role: "either",
    path: (ids) => `/bookings/${ids.bookingId}/track`,
    requires: "bookingId",
    note: "single source of truth",
  },
  {
    label: "9. Pickup Flow",
    role: "either",
    path: (ids) => `/bookings/${ids.bookingId}/pickup`,
    requires: "bookingId",
  },
  {
    label: "10. Active Rental",
    role: "either",
    path: (ids) => `/bookings/${ids.bookingId}/active`,
    requires: "bookingId",
  },
  {
    label: "11. Extension Request",
    role: "renter",
    path: (ids) => `/bookings/${ids.bookingId}/extension`,
    requires: "bookingId",
  },
  {
    label: "12. Extension Approval",
    role: "owner",
    path: (ids) => `/listings/${ids.listingId}/extension`,
    requires: "listingId",
  },
  {
    label: "13. Return Flow",
    role: "either",
    path: (ids) => `/bookings/${ids.bookingId}/return`,
    requires: "bookingId",
  },
  {
    label: "14. Invoice View",
    role: "either",
    path: (ids) => `/bookings/${ids.bookingId}/invoice`,
    requires: "bookingId",
  },
  {
    label: "15. Relist Decision",
    role: "owner",
    path: (ids) => `/listings/${ids.listingId}/relist`,
    requires: "listingId",
  },
];

type AlternateRoute = {
  label: string;
  role: "owner" | "renter" | "either";
  path: (ids: IDs) => string;
  requires?: keyof IDs;
};

const ALTERNATE_ROUTES: AlternateRoute[] = [
  { label: "Notifications", role: "either", path: () => "/notifications" },
  { label: "Profile", role: "either", path: () => "/profile" },
  { label: "Edit Profile", role: "either", path: () => "/profile/edit" },
  { label: "Ratings", role: "either", path: () => "/profile/ratings" },
  {
    label: "Request Dashboard",
    role: "renter",
    path: () => "/requests",
  },
  {
    label: "Post Request",
    role: "renter",
    path: () => "/requests/new",
  },
  {
    label: "Request Detail",
    role: "renter",
    path: (ids) => `/requests/${ids.requestId}`,
    requires: "requestId",
  },
  { label: "Terms", role: "either", path: () => "/terms" },
  { label: "Backend Connecting", role: "either", path: () => "/connecting" },
  { label: "Success", role: "either", path: () => "/success" },
  { label: "Error", role: "either", path: () => "/error" },
];

export default function DevRoutes() {
  const navigate = useNavigate();
  const [ids, setIds] = useState<IDs>(EMPTY_IDS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<IDs>;
        setIds({ ...EMPTY_IDS, ...parsed });
      } catch {
        // ignore
      }
    }
  }, []);

  const updateId = (key: keyof IDs, value: string) => {
    const next = { ...ids, [key]: value.trim() };
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearIds = () => {
    setIds(EMPTY_IDS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const canNavigate = (step: FlowStep | AlternateRoute) => {
    if (!step.requires) return true;
    return Boolean(ids[step.requires]);
  };

  const go = (step: FlowStep | AlternateRoute) => {
    if (!canNavigate(step)) return;
    navigate(step.path(ids));
  };

  const roleBadge = (role: "owner" | "renter" | "either") => {
    const styles = {
      owner: "bg-amber-500/10 text-amber-700",
      renter: "bg-blue-500/10 text-blue-700",
      either: "bg-neutral-500/10 text-neutral-600",
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[role]}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Dev Flow Tester</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Temporary page for testing. Paste IDs from Supabase below — they persist in
          localStorage. Remove before production.
        </p>

        <section className="mb-8 rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-medium">Test IDs</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <IdInput
              label="Listing ID"
              value={ids.listingId}
              onChange={(v) => updateId("listingId", v)}
            />
            <IdInput
              label="Request ID"
              value={ids.requestId}
              onChange={(v) => updateId("requestId", v)}
            />
            <IdInput
              label="Booking ID"
              value={ids.bookingId}
              onChange={(v) => updateId("bookingId", v)}
            />
            <IdInput
              label="Bid ID"
              value={ids.bidId}
              onChange={(v) => updateId("bidId", v)}
            />
          </div>
          <button
            type="button"
            onClick={clearIds}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            Clear All
          </button>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Primary Flow (in order)</h2>
          <ul className="space-y-1">
            {FLOW_STEPS.map((step) => {
              const enabled = canNavigate(step);
              return (
                <li key={step.label}>
                  <button
                    type="button"
                    onClick={() => go(step)}
                    disabled={!enabled}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left text-sm transition ${
                      enabled
                        ? "border-border hover:bg-muted"
                        : "cursor-not-allowed border-border opacity-40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{step.label}</span>
                      {roleBadge(step.role)}
                    </span>
                    <span className="flex items-center gap-3">
                      {step.note && (
                        <span className="text-xs text-muted-foreground">{step.note}</span>
                      )}
                      {step.requires && !ids[step.requires] && (
                        <span className="text-xs text-red-600">
                          needs {step.requires}
                        </span>
                      )}
                      <code className="text-xs text-muted-foreground">
                        {step.path(ids)}
                      </code>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium">Alternate Routes</h2>
          <ul className="space-y-1">
            {ALTERNATE_ROUTES.map((route) => {
              const enabled = canNavigate(route);
              return (
                <li key={route.label}>
                  <button
                    type="button"
                    onClick={() => go(route)}
                    disabled={!enabled}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left text-sm transition ${
                      enabled
                        ? "border-border hover:bg-muted"
                        : "cursor-not-allowed border-border opacity-40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{route.label}</span>
                      {roleBadge(route.role)}
                    </span>
                    <span className="flex items-center gap-3">
                      {route.requires && !ids[route.requires] && (
                        <span className="text-xs text-red-600">
                          needs {route.requires}
                        </span>
                      )}
                      <code className="text-xs text-muted-foreground">
                        {route.path(ids)}
                      </code>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Testing tips</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Use two browser profiles (normal + incognito) for owner/renter roles.</li>
            <li>
              After creating a listing, copy its id from Supabase → paste into
              &quot;Listing ID&quot; above.
            </li>
            <li>
              After accepting a bid, copy the booking id from Supabase → paste into
              &quot;Booking ID&quot;.
            </li>
            <li>
              IDs survive page reloads via localStorage. Clear manually with the button
              if starting fresh.
            </li>
            <li>Set BOOKING_FLOW_TIMEOUT_HOURS=999 in gg-core/.env to disable timeouts.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function IdInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="paste uuid"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}