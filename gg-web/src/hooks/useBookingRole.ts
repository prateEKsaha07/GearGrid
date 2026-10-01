import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export type BookingRole = "owner" | "renter" | null;

export type Booking = {
  id: string;
  listing_id: string | null;
  bid_id: string;
  owner_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  deposit_status: string;
  status: string;
  cancelled_reason: string | null;
  pickup_started_at: string | null;
  pickup_completed_at: string | null;
  return_started_at: string | null;
  return_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useBookingRole(bookingId: string | undefined) {
  const { userId, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [role, setRole] = useState<BookingRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !userId) {
      if (!authLoading && !userId) {
        setBooking(null);
        setRole(null);
        setLoading(false);
      }
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/${bookingId}?caller_id=${userId}`
        );

        if (res.status === 404) {
          if (!cancelled) {
            setError("Booking not found");
            setBooking(null);
            setRole(null);
          }
          return;
        }

        if (res.status === 403) {
          if (!cancelled) {
            setBooking(null);
            setRole(null);
            setError(null);
          }
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }

        const data = (await res.json()) as Booking;
        if (cancelled) return;

        let resolvedRole: BookingRole = null;
        if (data.owner_id === userId) resolvedRole = "owner";
        else if (data.renter_id === userId) resolvedRole = "renter";

        setBooking(data);
        setRole(resolvedRole);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setBooking(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId, userId, authLoading]);

  return { booking, role, loading, error };
}