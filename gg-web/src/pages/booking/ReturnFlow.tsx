import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

type Step = 1 | 2 | 3 | 4 | 5;

type Booking = {
  id: string;
  listing_id: string;
  bid_id: string;
  owner_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  deposit_status: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const STEPS = [
  { n: 1, label: "Start" },
  { n: 2, label: "Photos" },
  { n: 3, label: "Signatures" },
  { n: 4, label: "Deposit" },
  { n: 5, label: "OTP" },
] as const;

export default function ReturnFlow() {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string | null>(null);
  const [returnPhotoFile, setReturnPhotoFile] = useState<File | null>(null);
  const [returnPhotoPreview, setReturnPhotoPreview] = useState<string | null>(null);
  const [returnPhotoUploadedUrl, setReturnPhotoUploadedUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [ownerSigned, setOwnerSigned] = useState(false);
  const [renterSigned, setRenterSigned] = useState(false);
  const [signingOwner, setSigningOwner] = useState(false);
  const [signingRenter, setSigningRenter] = useState(false);

  const [renterReturned, setRenterReturned] = useState(false);
  const [ownerReceived, setOwnerReceived] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  const createdRef = useRef(false);

  useEffect(() => {
    if (!bookingId || createdRef.current) return;
    createdRef.current = true;

    const load = async () => {
      try {
        const bookingRes = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/${bookingId}`
        );
        if (!bookingRes.ok) {
          const text = await bookingRes.text();
          throw new Error(text || `Request failed with ${bookingRes.status}`);
        }
        const bookingData = (await bookingRes.json()) as Booking;
        setBooking(bookingData);

        const { data: pickupAgreements, error: pickupError } = await supabase
          .from("agreements")
          .select("condition_photo_url")
          .eq("booking_id", bookingId)
          .eq("stage", "pickup")
          .limit(1);

        if (pickupError) {
          throw new Error(pickupError.message);
        }
        if (pickupAgreements && pickupAgreements.length > 0) {
          setPickupPhotoUrl(pickupAgreements[0].condition_photo_url ?? null);
        }

        const agreementRes = await fetch(
          `${import.meta.env.VITE_API_URL}/agreements`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: bookingId, stage: "return" }),
          }
        );
        if (!agreementRes.ok) {
          const text = await agreementRes.text();
          throw new Error(text || `Request failed with ${agreementRes.status}`);
        }
        const agreementData = await agreementRes.json();
        setAgreementId(agreementData.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      }
    };

    load();
  }, [bookingId]);

  const handlePhotoSelect = (file: File | null) => {
    setReturnPhotoFile(file);
    if (file) {
      setReturnPhotoPreview(URL.createObjectURL(file));
    } else {
      setReturnPhotoPreview(null);
    }
  };

  const uploadPhoto = async () => {
    if (!agreementId || !returnPhotoFile) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", returnPhotoFile);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/agreements/${agreementId}/photo`,
        { method: "POST", body: formData }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed with ${res.status}`);
      }
      const data = await res.json();
      setReturnPhotoUploadedUrl(data.condition_photo_url ?? null);
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const signAs = async (signer: "owner" | "renter") => {
    if (!agreementId) return;

    if (signer === "owner") setSigningOwner(true);
    else setSigningRenter(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/agreements/${agreementId}/sign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signer }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Sign failed with ${res.status}`);
      }

      if (signer === "owner") setOwnerSigned(true);
      else setRenterSigned(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      if (signer === "owner") setSigningOwner(false);
      else setSigningRenter(false);
    }
  };

  const confirmDepositSide = async (side: "payer" | "receiver") => {
    if (!bookingId || !booking) return;
    setPaymentBusy(true);
    try {
      let pid = paymentId;

      if (!pid) {
        const createRes = await fetch(`${import.meta.env.VITE_API_URL}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingId,
            payment_type: "deposit_returned",
            payer_id: booking.owner_id,
            receiver_id: booking.renter_id,
            amount: booking.deposit_amount,
          }),
        });
        if (!createRes.ok) {
          const text = await createRes.text();
          throw new Error(text || `Payment create failed with ${createRes.status}`);
        }
        const payment = await createRes.json();
        pid = payment.id;
        setPaymentId(pid);
      }

      const confirmRes = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/${pid}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmer: side }),
        }
      );
      if (!confirmRes.ok) {
        const text = await confirmRes.text();
        throw new Error(text || `Confirm failed with ${confirmRes.status}`);
      }

      if (side === "payer") setRenterReturned(true);
      else setOwnerReceived(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setPaymentBusy(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementId || !bookingId) return;

    setOtpBusy(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/agreements/${agreementId}/verify-otp`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp_code: otpCode }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `OTP verification failed with ${res.status}`);
      }
      navigate(`/bookings/${bookingId}/invoice`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setOtpBusy(false);
    }
  };

  const canAdvanceSign = ownerSigned && renterSigned;
  const canAdvancePayment = renterReturned && ownerReceived;

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Return Flow</h1>

        <div className="mb-8 flex items-center justify-between gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  step >= s.n
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {s.n}
              </div>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    step > s.n ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {(!booking || !agreementId) && !error && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading booking...
          </div>
        )}

        {booking && agreementId && step === 1 && (
          <section className="space-y-5 rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium">Start Return</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Start Date</dt>
                <dd className="text-right">{booking.start_date}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">End Date</dt>
                <dd className="text-right">{booking.end_date}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Deposit</dt>
                <dd className="text-right">₹{booking.deposit_amount}</dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">
              Begin the return handover process.
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Confirm Start Return
            </button>
          </section>
        )}

        {booking && agreementId && step === 2 && (
          <section className="space-y-5 rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium">Condition Comparison</h2>
            <p className="text-sm text-muted-foreground">
              Upload a photo of the equipment's current condition to compare with pickup.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  At Pickup
                </p>
                {pickupPhotoUrl ? (
                  <img
                    src={pickupPhotoUrl}
                    alt="Pickup condition"
                    className="aspect-square w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    No pickup photo
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  At Return
                </p>
                {returnPhotoPreview ? (
                  <img
                    src={returnPhotoPreview}
                    alt="Return preview"
                    className="aspect-square w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    Not uploaded
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoSelect(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={uploadPhoto}
              disabled={!returnPhotoFile || photoUploading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {photoUploading ? "Uploading..." : "Upload & Continue"}
            </button>
          </section>
        )}

        {booking && agreementId && step === 3 && (
          <section className="space-y-5 rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium">Signatures</h2>
            <p className="text-sm text-muted-foreground">
              Both parties must sign to proceed.
            </p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ownerSigned}
                disabled={ownerSigned || signingOwner}
                onChange={() => signAs("owner")}
              />
              <span>
                Owner Sign{" "}
                {signingOwner && (
                  <span className="text-xs text-muted-foreground">(signing...)</span>
                )}
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renterSigned}
                disabled={renterSigned || signingRenter}
                onChange={() => signAs("renter")}
              />
              <span>
                Renter Sign{" "}
                {signingRenter && (
                  <span className="text-xs text-muted-foreground">(signing...)</span>
                )}
              </span>
            </label>

            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!canAdvanceSign}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          </section>
        )}

        {booking && agreementId && step === 4 && (
          <section className="space-y-5 rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium">Deposit Settlement</h2>
            <p className="text-sm text-muted-foreground">
              Both parties must confirm the deposit return.
            </p>

            <div className="rounded-lg border border-border p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Deposit Amount</span>
                <span>₹{booking.deposit_amount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => confirmDepositSide("payer")}
              disabled={renterReturned || paymentBusy}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {renterReturned ? "Owner: Returned ✓" : "Mark Deposit Returned (Owner)"}
            </button>

            <button
              type="button"
              onClick={() => confirmDepositSide("receiver")}
              disabled={ownerReceived || paymentBusy}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ownerReceived ? "Renter: Received ✓" : "Confirm Received (Renter)"}
            </button>

            <button
              type="button"
              onClick={() => setStep(5)}
              disabled={!canAdvancePayment}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          </section>
        )}

        {booking && agreementId && step === 5 && (
          <form
            onSubmit={submitOtp}
            className="space-y-5 rounded-lg border border-border p-6"
          >
            <h2 className="text-lg font-medium">Renter OTP Clearance</h2>
            <p className="text-sm text-muted-foreground">
              The renter provides a 4-digit code to complete the return.
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
              placeholder="0000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-ring"
            />

            <button
              type="submit"
              disabled={otpCode.length !== 4 || otpBusy}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {otpBusy ? "Verifying..." : "Verify & Complete Return"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}