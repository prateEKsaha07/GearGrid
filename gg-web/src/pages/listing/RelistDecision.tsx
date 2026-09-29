import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

type Option = "now" | "later" | "unlisted";

export default function RelistDecision() {
  const { id: listingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [selected, setSelected] = useState<Option | null>(null);
  const [relistDate, setRelistDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchListing = async (body: Record<string, unknown>) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/listings/${listingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed with ${res.status}`);
    }
  };

  const handleRelistNow = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await patchListing({ status: "available" });
      navigate("/success", {
        state: { message: "Listing is now available", redirectTo: "/dashboard" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelistLater = async () => {
    if (!relistDate) {
      setError("Please pick a date.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await patchListing({ status: "unlisted" });
      navigate("/success", {
        state: { message: "Listing scheduled", redirectTo: "/dashboard" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeepUnlisted = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await patchListing({ status: "unlisted" });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Relist Decision</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelected("now")}
            className={`w-full rounded-lg border p-4 text-left transition ${
              selected === "now"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted"
            }`}
          >
            <p className="text-sm font-medium">Relist Now</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Make this listing available for new bids immediately.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelected("later")}
            className={`w-full rounded-lg border p-4 text-left transition ${
              selected === "later"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted"
            }`}
          >
            <p className="text-sm font-medium">Relist Later</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Schedule the listing to become available on a future date.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelected("unlisted")}
            className={`w-full rounded-lg border p-4 text-left transition ${
              selected === "unlisted"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted"
            }`}
          >
            <p className="text-sm font-medium">Keep Unlisted</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep the listing hidden. You can relist it any time.
            </p>
          </button>
        </div>

        {selected === "later" && (
          <div className="mt-6 space-y-3 rounded-lg border border-border p-4">
            <label className="block text-sm font-medium">Relist On</label>
            <input
              type="date"
              value={relistDate}
              onChange={(e) => setRelistDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {selected === "now" && (
          <button
            type="button"
            onClick={handleRelistNow}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Confirm Relist Now"}
          </button>
        )}

        {selected === "later" && (
          <button
            type="button"
            onClick={handleRelistLater}
            disabled={submitting || !relistDate}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Confirm Scheduled Relist"}
          </button>
        )}

        {selected === "unlisted" && (
          <button
            type="button"
            onClick={handleKeepUnlisted}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Confirm Keep Unlisted"}
          </button>
        )}
      </div>
    </div>
  );
}