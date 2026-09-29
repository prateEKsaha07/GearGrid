import { useEffect, useState } from "react";
import NavBar from "../../components/shared/NavBar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

type Rating = {
  id: string;
  booking_id: string;
  stage: string;
  rater_id: string;
  ratee_id: string;
  on_time: boolean | null;
  condition_as_described: boolean | null;
  condition_on_return_ok: boolean | null;
  communication_score: number | null;
  comments: string | null;
  created_at: string;
};

function BoolBadge({ value, label }: { value: boolean | null; label: string }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">{label}: —</span>;
  }
  return (
    <span className={`text-xs ${value ? "text-green-600" : "text-red-600"}`}>
      {label}: {value ? "✓" : "✗"}
    </span>
  );
}

function RatingCard({ rating }: { rating: Rating }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Communication: {rating.communication_score ?? "—"}/5
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(rating.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <BoolBadge value={rating.on_time} label="On Time" />
        <BoolBadge value={rating.condition_as_described} label="As Described" />
        <BoolBadge value={rating.condition_on_return_ok} label="Return OK" />
      </div>

      {rating.comments && (
        <p className="mt-3 text-sm text-muted-foreground">{rating.comments}</p>
      )}
    </div>
  );
}

export default function ReliabilityRatings() {
  const { userId, loading: authLoading } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from("ratings")
        .select("*")
        .eq("ratee_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setRatings([]);
      } else {
        setError(null);
        setRatings((data ?? []) as Rating[]);
      }

      setLoading(false);
    };

    load();
  }, [userId]);

  const pickupRatings = ratings.filter((r) => r.stage === "pickup");
  const returnRatings = ratings.filter((r) => r.stage === "return");

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Reliability &amp; Ratings History
        </h1>

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

        {!loading && !error && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-medium">Pickup Ratings</h2>
              {pickupRatings.length === 0 ? (
                <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                  No pickup ratings yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {pickupRatings.map((r) => (
                    <RatingCard key={r.id} rating={r} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium">Return Ratings</h2>
              {returnRatings.length === 0 ? (
                <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                  No return ratings yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {returnRatings.map((r) => (
                    <RatingCard key={r.id} rating={r} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}