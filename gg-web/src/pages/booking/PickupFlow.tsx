import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";
import { useBookingRole } from "../../hooks/useBookingRole";

type Agreement = {
  id: string;
  booking_id: string;
  stage: string;
  condition_photo_url: string | null;
  owner_signed: boolean;
  renter_signed: boolean;
  otp_verified: boolean;
  pin_verified_at: string | null;
  pin_attempts: number;
  abandoned_at: string | null;
  pickup_pin?: string | null;
};

type TrackResponse = {
  booking: {
    id: string;
    status: string;
    owner_id: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    deposit_amount: number;
  };
  role: "owner" | "renter";
  pickup_agreement: Agreement | null;
  return_agreement: Agreement | null;
};

const POLL_MS = 5000;

export default function PickupFlow() {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const {
    booking: roleBooking,
    role: callerRole,
    loading: roleLoading,
    error: roleError,
  } = useBookingRole(bookingId);

  const [data, setData] = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pinInput, setPinInput] = useState("");

  const fetchTrack = async () => {
    if (!bookingId || !userId) return;
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/track?caller_id=${userId}`
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed with ${res.status}`);
    }
    const json = (await res.json()) as TrackResponse;
    setData(json);
    return json;
  };

  useEffect(() => {
    if (!userId || !bookingId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        await fetchTrack();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, bookingId]);

  useEffect(() => {
    if (!data) return;
    if (data.booking.status !== "pickup_in_progress") return;
    const interval = setInterval(() => {
      fetchTrack().catch(() => {});
    }, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.booking.status]);

  useEffect(() => {
    if (data?.booking.status === "active") {
      navigate(`/bookings/${bookingId}/active`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.booking.status]);

  const postJson = async (path: string, body: object) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed with ${res.status}`);
    }
    return res.json();
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !data?.pickup_agreement) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/agreements/${data.pickup_agreement.id}/photo`,
        { method: "POST", body: formData }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed with ${res.status}`);
      }
      setPhotoFile(null);
      await fetchTrack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleSign = async (signer: "owner" | "renter") => {
    if (!bookingId || !userId) return;
    setBusy(true);
    try {
      await postJson(`/bookings/${bookingId}/sign-pickup`, {
        caller_id: userId,
        signer,
      });
      await fetchTrack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!bookingId || !userId || pinInput.length !== 6) return;
    setBusy(true);
    try {
      await postJson(`/bookings/${bookingId}/verify-pickup-pin`, {
        caller_id: userId,
        pin: pinInput,
      });
      setPinInput("");
      await fetchTrack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || roleLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;
  if (roleError) return <div>{roleError}</div>;
  if (!roleBooking || !callerRole) return <Navigate to="/error" replace />;

  const agreement = data?.pickup_agreement;
  const role = data?.role;
  const status = data?.booking.status;

  const ownerHasSigned = agreement?.owner_signed ?? false;
  const renterHasSigned = agreement?.renter_signed ?? false;
  const bothSigned = ownerHasSigned && renterHasSigned;
  const photoUploaded = Boolean(agreement?.condition_photo_url);

  const renderWaiting = (text: string) => (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      {text}
    </div>
  );

  const renderBody = () => {
    if (!data || !agreement || !role) return null;

    if (status !== "pickup_in_progress") {
      return renderWaiting(
        "Pickup is not currently in progress. Return to the tracker for current status."
      );
    }

    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-border p-6">
          <h2 className="mb-1 text-lg font-medium">
            {role === "renter" ? "Your Pickup Steps" : "Pickup In Progress"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {role === "renter"
              ? "Complete each step below. The owner will sign and share the PIN once you're ready."
              : "The renter is completing the pickup steps. Sign and share the PIN when prompted."}
          </p>
        </section>

        <section className="rounded-lg border border-border p-6">
          <h3 className="mb-3 text-sm font-medium">1. Condition Snapshot</h3>
          {photoUploaded ? (
            <div>
              <img
                src={agreement.condition_photo_url ?? ""}
                alt="Condition snapshot"
                className="mb-3 aspect-video w-full rounded-lg border border-border object-cover"
              />
              <p className="text-xs text-green-600">✓ Snapshot uploaded</p>
            </div>
          ) : role === "renter" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload a photo of the equipment's current condition.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={!photoFile || busy}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Uploading..." : "Upload Snapshot"}
              </button>
            </div>
          ) : (
            renderWaiting("Waiting for the renter to upload the condition snapshot.")
          )}
        </section>

        <section className="rounded-lg border border-border p-6">
          <h3 className="mb-3 text-sm font-medium">2. Signatures</h3>
          {!photoUploaded ? (
            renderWaiting("Signatures open after the snapshot is uploaded.")
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm">
                <span>Owner signature</span>
                <span className={ownerHasSigned ? "text-green-600" : "text-muted-foreground"}>
                  {ownerHasSigned ? "✓ Signed" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm">
                <span>Renter signature</span>
                <span className={renterHasSigned ? "text-green-600" : "text-muted-foreground"}>
                  {renterHasSigned ? "✓ Signed" : "Pending"}
                </span>
              </div>

              {role === "owner" && !ownerHasSigned && (
                <button
                  type="button"
                  onClick={() => handleSign("owner")}
                  disabled={busy}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Signing..." : "Sign as Owner"}
                </button>
              )}

              {role === "renter" && !renterHasSigned && (
                <button
                  type="button"
                  onClick={() => handleSign("renter")}
                  disabled={busy}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Signing..." : "Sign as Renter"}
                </button>
              )}

              {role === "renter" && !ownerHasSigned && renterHasSigned && (
                renderWaiting("Waiting for the owner to sign.")
              )}
              {role === "owner" && !renterHasSigned && ownerHasSigned && (
                renderWaiting("Waiting for the renter to sign.")
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border p-6">
          <h3 className="mb-3 text-sm font-medium">3. PIN Handshake</h3>
          {!bothSigned ? (
            renderWaiting("PIN handshake opens after both parties sign.")
          ) : (
            <div className="space-y-3">
              {role === "owner" && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Share this PIN with the renter</p>
                  <p className="mt-2 font-mono text-3xl font-semibold tracking-widest">
                    {agreement.pickup_pin ?? "——"}
                  </p>
                </div>
              )}

              {role === "renter" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ask the owner for the 6-digit PIN and enter it below to complete pickup.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-2xl tracking-widest outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPin}
                    disabled={pinInput.length !== 6 || busy}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? "Verifying..." : "Verify PIN"}
                  </button>
                  {agreement.pin_attempts > 0 && (
                    <p className="text-xs text-amber-700">
                      Incorrect attempts: {agreement.pin_attempts} of 5
                    </p>
                  )}
                </div>
              )}

              {role === "owner" && (
                <p className="text-xs text-muted-foreground">
                  Once the renter enters the PIN, the rental becomes active and this page will close.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Pickup Flow</h1>
          <button
            type="button"
            onClick={() => navigate(`/bookings/${bookingId}/track`)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            Tracker
          </button>
        </div>

        {loading && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loading && data && renderBody()}
      </div>
    </div>
  );
}