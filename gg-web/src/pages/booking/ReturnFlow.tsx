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
  return_pin?: string | null;
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

export default function ReturnFlow() {
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
    if (data.booking.status !== "return_in_progress") return;
    const interval = setInterval(() => {
      fetchTrack().catch(() => {});
    }, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.booking.status]);

  useEffect(() => {
    if (data?.booking.status === "completed") {
      navigate(`/bookings/${bookingId}/invoice`);
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
    if (!photoFile || !data?.return_agreement) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/agreements/${data.return_agreement.id}/photo`,
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
      await postJson(`/bookings/${bookingId}/sign-return`, {
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
      await postJson(`/bookings/${bookingId}/verify-return-pin`, {
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

  const agreement = data?.return_agreement;
  const pickupAgreement = data?.pickup_agreement;
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

    if (status !== "return_in_progress") {
      return renderWaiting(
        "Return is not currently in progress. Return to the tracker for current status."
      );
    }

    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-border p-6">
          <h2 className="mb-1 text-lg font-medium">
            {role === "owner" ? "Your Return Steps" : "Return In Progress"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {role === "owner"
              ? "Complete each step below. The renter will sign and share the PIN once you're ready."
              : "The owner is documenting the return. Sign and share the PIN when prompted."}
          </p>
        </section>

        <section className="rounded-lg border border-border p-6">
          <h3 className="mb-3 text-sm font-medium">1. Condition Comparison</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">At Pickup</p>
              {pickupAgreement?.condition_photo_url ? (
                <img
                  src={pickupAgreement.condition_photo_url}
                  alt="Pickup condition"
                  className="aspect-square w-full rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  No pickup photo
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">At Return</p>
              {photoUploaded ? (
                <img
                  src={agreement.condition_photo_url ?? ""}
                  alt="Return condition"
                  className="aspect-square w-full rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  Not uploaded
                </div>
              )}
            </div>
          </div>

          {!photoUploaded && role === "owner" && (
            <div className="mt-4 space-y-3">
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
                {busy ? "Uploading..." : "Upload Return Photo"}
              </button>
            </div>
          )}

          {!photoUploaded && role === "renter" && (
            <p className="mt-4 text-sm text-muted-foreground">
              Waiting for the owner to upload the return photo.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border p-6">
          <h3 className="mb-3 text-sm font-medium">2. Signatures</h3>
          {!photoUploaded ? (
            renderWaiting("Signatures open after the return photo is uploaded.")
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
              {role === "renter" && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Share this PIN with the owner</p>
                  <p className="mt-2 font-mono text-3xl font-semibold tracking-widest">
                    {agreement.return_pin ?? "——"}
                  </p>
                </div>
              )}

              {role === "owner" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ask the renter for the 6-digit PIN and enter it below to complete the return.
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
                    {busy ? "Verifying..." : "Verify PIN & Complete Return"}
                  </button>
                  {agreement.pin_attempts > 0 && (
                    <p className="text-xs text-amber-700">
                      Incorrect attempts: {agreement.pin_attempts} of 5
                    </p>
                  )}
                </div>
              )}

              {role === "renter" && (
                <p className="text-xs text-muted-foreground">
                  Once the owner enters the PIN, the booking completes and an invoice is generated.
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
          <h1 className="text-2xl font-semibold tracking-tight">Return Flow</h1>
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