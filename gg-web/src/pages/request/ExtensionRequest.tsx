import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";
import { useBookingRole } from "../../hooks/useBookingRole";

export default function ExtensionRequest() {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const {
    booking: roleBooking,
    role: callerRole,
    loading: roleLoading,
    error: roleError,
  } = useBookingRole(bookingId);

  const [requestedDays, setRequestedDays] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/extensions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          requested_days: Number(requestedDays),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      const data = await res.json();

      if (data.status === "auto_blocked_conflict") {
        navigate("/error", {
          state: {
            message: "Extension blocked — dates conflict with another booking",
            redirectTo: `/bookings/${bookingId}/active`,
          },
        });
        return;
      }

      if (data.status === "pending") {
        navigate("/success", {
          state: {
            message: "Extension request sent to owner",
            redirectTo: `/bookings/${bookingId}/active`,
          },
        });
        return;
      }

      navigate("/success", {
        state: {
          message: "Extension request submitted",
          redirectTo: `/bookings/${bookingId}/active`,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: `/bookings/${bookingId}/active` },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || roleLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;
  if (roleError) return <div>{roleError}</div>;
  if (!roleBooking || !callerRole) return <Navigate to="/error" replace />;
  if (callerRole !== "renter") return <Navigate to="/error" replace />;
  if (roleBooking.status !== "active") return <Navigate to="/error" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Request Extension
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border p-6">
          <p className="text-sm text-muted-foreground">
            Request additional days beyond the current rental end date. The owner
            must approve before the extension is confirmed.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Additional Days
            </label>
            <input
              type="number"
              value={requestedDays}
              onChange={(e) => setRequestedDays(e.target.value)}
              min={1}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || Number(requestedDays) < 1}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Submitting..." : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}