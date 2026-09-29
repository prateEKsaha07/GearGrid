import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  pincode: string | null;
  id_verified: boolean;
  language_pref: string | null;
};

type ReliabilityRow = {
  user_id: string;
  owner_score: number;
  renter_score: number;
  non_return_flags: number;
  updated_at: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserRow | null>(null);
  const [reliability, setReliability] = useState<ReliabilityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      const { data: reliabilityData, error: reliabilityError } = await supabase
        .from("reliability_scores")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (reliabilityError) {
        setError(reliabilityError.message);
        setLoading(false);
        return;
      }

      setUser((userData ?? null) as UserRow | null);
      setReliability((reliabilityData ?? null) as ReliabilityRow | null);
      setError(null);
      setLoading(false);
    };

    load();
  }, [userId]);

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName={user?.name ?? "User"} />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Profile</h1>

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

        {!loading && !error && !user && (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            Profile not found.
          </div>
        )}

        {!loading && !error && user && (
          <div className="space-y-6">
            <section className="rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Account</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    user.id_verified
                      ? "bg-green-500/10 text-green-700"
                      : "bg-neutral-500/10 text-neutral-600"
                  }`}
                >
                  {user.id_verified ? "Verified" : "Unverified"}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-right">{user.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-right">{user.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Pincode</dt>
                  <dd className="text-right">{user.pincode ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Language</dt>
                  <dd className="text-right">{user.language_pref ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium">Reliability</h2>

              {reliability ? (
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Owner Score</dt>
                    <dd className="text-right">{reliability.owner_score}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Renter Score</dt>
                    <dd className="text-right">{reliability.renter_score}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Non-return Flags</dt>
                    <dd className="text-right">{reliability.non_return_flags}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No reliability data yet.
                </p>
              )}
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/profile/edit")}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile/ratings")}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
              >
                Ratings History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}