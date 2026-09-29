import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";

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
  { n: 1, label: "Summary" },
  { n: 2, label: "Photo" },
  { n: 3, label: "Signatures" },
  { n: 4, label: "Payment" },
  { n: 5, label: "OTP" },
] as const;

export default function PickupFlow() {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDone, setPhotoDone] = useState(false);

  const [ownerSigned, setOwnerSigned] = useState(false);
  const [renterSigned, setRenterSigned] = useState(false);
  const [signingOwner, setSigningOwner] = useState(false);
  const [signingRenter, setSigningRenter] = useState(false);

  const [renterPaid, setRenterPaid] = useState(false);
  const [ownerReceived, setOwnerReceived] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

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

        const agreementRes = await fetch(
          `${import.meta.env.VITE_API_URL}/agreements`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: bookingId, stage: "pickup" }),
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

  const uploadPhoto = async () => {
    if (!agreementId || !photoFile) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", photoFile);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/agreements/${agreementId}/photo`,
        { method: "POST", body: formData }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed with ${res.status}`);
      }
      setPhotoDone(true);
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

  const handleMarkPaid = async () => {
    if (!bookingId || !booking || paymentId) return;
    setPaymentBusy(true);
    try {
      const createRes = await fetch(`${import.meta.env.VITE_API_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_type: "deposit_paid",
          payer_id: booking.renter_id,
          receiver_id: booking.owner_id,
          amount: booking.deposit_amount,
          method: "cash",
        }),
      });
      if (!createRes.ok) {
        const text = await createRes.text();
        throw new Error(text || `Payment create failed with ${createRes.status}`);
      }
      const payment = await createRes.json();
      setPaymentId(payment.id);

      const confirmRes = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/${payment.id}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmer: "payer" }),
        }
      );
      if (!confirmRes.ok) {
        const text = await confirmRes.text();
        throw new Error(text || `Confirm failed with ${confirmRes.status}`);
      }
      const confirmed = await confirmRes.json();
      setPaymentStatus(confirmed.status);
      setRenterPaid(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setPaymentBusy(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!paymentId || paymentBusy) return;
    setPaymentBusy(true);
    try {
      const confirmRes = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/${paymentId}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmer: "receiver" }),
        }
      );
      if (!confirmRes.ok) {
        const text = await confirmRes.text();
        throw new Error(text || `Confirm failed with ${confirmRes.status}`);
      }
      const confirmed = await confirmRes.json();
      setPaymentStatus(confirmed.status);
      setOwnerReceived(true);
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
      navigate(`/bookings/${bookingId}/active`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setOtpBusy(false);
    }
  };

  const canAdvanceSign = ownerSigned && renterSigned;
  const canAdvancePayment = renterPaid && ownerReceived && paymentStatus === "confirmed";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Pickup Flow</h1>

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
            <h2 className="text-lg font-medium">Booking Summary</h2>
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
              Confirm to begin the physical handover process.
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Confirm Start Pickup
            </button>
          </section>
        )}

        {booking && agreementId && step === 2 && (
          <section className="space-y-5 rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium">Condition Snapshot</h2>
            <p className="text-sm text-muted-foreground">
              Upload a photo of the equipment's current condition.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            {photoFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {photoFile.name}
              </p>
            )}
            <button
              type="button"
              onClick={uploadPhoto}
              disabled={!photoFile || photoUploading}
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
            <h2 className="text-lg font-medium">Direct Transaction</h2>
            <p className="text-sm text-muted-foreground">
              Both parties must confirm the payment exchange.
            </p>

            <div className="rounded-lg border border-border p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Amount</span>
                <span>₹{booking.deposit_amount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={renterPaid || paymentBusy}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {renterPaid ? "Renter: Paid ✓" : "Mark as Paid (Renter)"}
            </button>

            <button
              type="button"
              onClick={handleConfirmReceived}
              disabled={!paymentId || ownerReceived || paymentBusy}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ownerReceived ? "Owner: Received ✓" : "Confirm Received (Owner)"}
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
            <h2 className="text-lg font-medium">Owner OTP Clearance</h2>
            <p className="text-sm text-muted-foreground">
              The owner provides a 4-digit code to activate the rental.
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
              {otpBusy ? "Verifying..." : "Verify & Activate"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}