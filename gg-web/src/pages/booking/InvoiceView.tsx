import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

type Invoice = {
  id: string;
  booking_id: string;
  rental_days: number;
  extension_days: number;
  price_per_day: number;
  base_rental_amount: number;
  extension_amount: number;
  commission_rate: number;
  commission_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_rental_charges: number;
  deposit_paid: number;
  deposit_returned: number;
  deposit_retained: number;
  deposit_retained_reason: string | null;
  net_deposit_position: number;
  generated_at: string;
};

export default function InvoiceView() {
  const { id: bookingId } = useParams<{ id: string }>();
  const { userId, loading: authLoading } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [depositReturned, setDepositReturned] = useState("");
  const [depositRetained, setDepositRetained] = useState("");
  const [retainedReason, setRetainedReason] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const load = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("invoices")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setInvoice(null);
      } else {
        setError(null);
        setInvoice((data ?? null) as Invoice | null);
      }
      setLoading(false);
    };

    load();
  }, [bookingId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    setGenerating(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          deposit_returned: Number(depositReturned),
          deposit_retained: Number(depositRetained),
          deposit_retained_reason: retainedReason.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      const created = (await res.json()) as Invoice;
      setInvoice(created);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Invoice</h1>

        {loading && (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        )}

        {!loading && !invoice && (
          <form
            onSubmit={handleGenerate}
            className="space-y-5 rounded-lg border border-border p-6"
          >
            <h2 className="text-lg font-medium">Generate Invoice</h2>
            <p className="text-sm text-muted-foreground">
              No invoice exists for this booking yet. Enter deposit settlement to generate.
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Deposit Returned (₹)
              </label>
              <input
                type="number"
                value={depositReturned}
                onChange={(e) => setDepositReturned(e.target.value)}
                min={0}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Deposit Retained (₹)
              </label>
              <input
                type="number"
                value={depositRetained}
                onChange={(e) => setDepositRetained(e.target.value)}
                min={0}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Retention Reason (optional)
              </label>
              <textarea
                value={retainedReason}
                onChange={(e) => setRetainedReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generating ? "Generating..." : "Generate Invoice"}
            </button>
          </form>
        )}

        {!loading && invoice && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border">
              <div className="border-b border-border p-4">
                <h2 className="text-lg font-medium">Invoice Summary</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generated {new Date(invoice.generated_at).toLocaleString()}
                </p>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Rental Days</td>
                    <td className="px-4 py-3 text-right">{invoice.rental_days}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Extension Days</td>
                    <td className="px-4 py-3 text-right">{invoice.extension_days}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Price per Day</td>
                    <td className="px-4 py-3 text-right">₹{invoice.price_per_day}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Base Rental Amount</td>
                    <td className="px-4 py-3 text-right">₹{invoice.base_rental_amount}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Extension Amount</td>
                    <td className="px-4 py-3 text-right">₹{invoice.extension_amount}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">
                      Commission ({(invoice.commission_rate * 100).toFixed(0)}%)
                    </td>
                    <td className="px-4 py-3 text-right">₹{invoice.commission_amount}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">
                      Tax ({(invoice.tax_rate * 100).toFixed(0)}%)
                    </td>
                    <td className="px-4 py-3 text-right">₹{invoice.tax_amount}</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/40">
                    <td className="px-4 py-3 font-medium">Total Rental Charges</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{invoice.total_rental_charges}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Deposit Paid</td>
                    <td className="px-4 py-3 text-right">₹{invoice.deposit_paid}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Deposit Returned</td>
                    <td className="px-4 py-3 text-right">₹{invoice.deposit_returned}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Deposit Retained</td>
                    <td className="px-4 py-3 text-right">₹{invoice.deposit_retained}</td>
                  </tr>
                  {invoice.deposit_retained_reason && (
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 text-muted-foreground">
                        Retention Reason
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invoice.deposit_retained_reason}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-4 py-3 font-medium">Net Deposit Position</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{invoice.net_deposit_position}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}