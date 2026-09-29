import { Link } from "react-router-dom";
import NavBar from "../components/shared/NavBar";

type RouteGroup = {
  title: string;
  routes: { label: string; path: string; note?: string }[];
};

const GROUPS: RouteGroup[] = [
  {
    title: "Public / Gateway",
    routes: [
      { label: "Landing", path: "/" },
      { label: "Login / Signup", path: "/login" },
      { label: "Terms", path: "/terms" },
      { label: "Backend Connecting", path: "/connecting" },
      { label: "Success (no state)", path: "/success", note: "fallback message" },
      { label: "Error (no state)", path: "/error", note: "fallback message" },
    ],
  },
  {
    title: "Dashboard",
    routes: [
      { label: "Dashboard Hub", path: "/dashboard" },
      { label: "Notification Centre", path: "/notifications" },
    ],
  },
  {
    title: "Listings",
    routes: [
      { label: "Browse / Search", path: "/browse" },
      { label: "Add Listing", path: "/listings/new" },
      { label: "Listing Detail", path: "/listings/REPLACE_ME", note: "needs real listing id" },
      { label: "Listing Dashboard", path: "/listings/REPLACE_ME/manage" },
      { label: "Extension Approval", path: "/listings/REPLACE_ME/extension" },
      { label: "Relist Decision", path: "/listings/REPLACE_ME/relist" },
    ],
  },
  {
    title: "Requests",
    routes: [
      { label: "Post Request", path: "/requests/new" },
      { label: "Request Dashboard", path: "/requests" },
      { label: "Request Detail", path: "/requests/REPLACE_ME", note: "needs real request id" },
    ],
  },
  {
    title: "Bookings",
    routes: [
      { label: "Booking Confirmation", path: "/bookings/REPLACE_ME/confirm" },
      { label: "Pickup Flow", path: "/bookings/REPLACE_ME/pickup" },
      { label: "Active Rental", path: "/bookings/REPLACE_ME/active" },
      { label: "Return Flow", path: "/bookings/REPLACE_ME/return" },
      { label: "Invoice View", path: "/bookings/REPLACE_ME/invoice" },
      { label: "Extension Request", path: "/bookings/REPLACE_ME/extension" },
    ],
  },
  {
    title: "Profile",
    routes: [
      { label: "Profile", path: "/profile" },
      { label: "Edit Profile", path: "/profile/edit" },
      { label: "Reliability & Ratings", path: "/profile/ratings" },
    ],
  },
];

export default function DevRoutes() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Dev Route Index</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Temporary page for testing. Remove before production.
        </p>

        <div className="space-y-8">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="mb-3 text-lg font-medium">{group.title}</h2>
              <ul className="space-y-1">
                {group.routes.map((r) => (
                  <li key={r.path + r.label}>
                    <Link
                      to={r.path}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-muted"
                    >
                      <span className="font-medium">{r.label}</span>
                      <span className="flex items-center gap-3">
                        {r.note && (
                          <span className="text-xs text-muted-foreground">{r.note}</span>
                        )}
                        <code className="text-xs text-muted-foreground">{r.path}</code>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Replace <code>REPLACE_ME</code> with a real UUID from the Supabase Table Editor.
        </p>
      </div>
    </div>
  );
}