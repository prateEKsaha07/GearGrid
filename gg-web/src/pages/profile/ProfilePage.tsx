import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalNavBar } from "../../components/shared/GlobalNavBar";
import { ProfileHeaderCard } from "../../components/shared/ProfileHeaderCard";
import { ReliabilityCard } from "../../components/shared/ReliabilityCard";
import { AccountDetailsCard } from "../../components/shared/AccountDetailsCard";
import { OptionalDetailCard } from "../../components/shared/OptionalDetailCard";
import { Button } from "../../components/ui/button";
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

function formatMemberSince(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatLanguage(value: string | null) {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <GlobalNavBar
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Browse", href: "/browse" },
            { label: "Notifications", href: "/notifications", count: 0 },
            { label: "Profile", href: "/profile" },
          ]}
          activeHref="/profile"
          userName="User"
          language="en"
          onLanguageChange={() => {}}
        />
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <GlobalNavBar
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Browse", href: "/browse" },
            { label: "Notifications", href: "/notifications", count: 0 },
            { label: "Profile", href: "/profile" },
          ]}
          activeHref="/profile"
          userName="User"
          language="en"
          onLanguageChange={() => {}}
        />
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm text-muted-foreground">Not logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalNavBar
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Browse", href: "/browse" },
          { label: "Notifications", href: "/notifications", count: 0 },
          { label: "Profile", href: "/profile" },
        ]}
        activeHref="/profile"
        userName={user?.name ?? "User"}
        language="en"
        onLanguageChange={() => {}}
      />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Identity, verification and reliability for both sides of your
              GearGrid account.
            </p>
          </div>
          <Button onClick={() => navigate("/profile/edit")}>Edit profile</Button>
        </div>

        {loading && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && !user && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Profile not found.
          </div>
        )}

        {!loading && !error && user && (
          <div className="space-y-6">
            {/* Identity + Reliability row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ProfileHeaderCard
                name={user.name ?? "—"}
                pincode={user.pincode}
                isVerified={user.id_verified}
              />

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReliabilityCard
                    label="Owner reliability"
                    score={reliability?.owner_score ?? 0}
                  />
                  <ReliabilityCard
                    label="Renter reliability"
                    score={reliability?.renter_score ?? 0}
                  />
                </div>

                <AccountDetailsCard
                  items={[
                    { label: "Member since", value: "—" },
                    {
                      label: "Preferred language",
                      value: formatLanguage(user.language_pref),
                    },
                    { label: "Completed bookings", value: "—" },
                  ]}
                />
              </div>
            </div>

            {/* Optional details row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <OptionalDetailCard
                title="Payment details"
                description="Preferred method and masked UPI/bank details appear here for direct party payments."
              />
              <OptionalDetailCard
                title="Farm details"
                description="Farm size, crops, experience and FPO membership help local owners understand your needs."
              />
            </div>

            {/* Ratings history */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => navigate("/profile/ratings")}
                className="flex-1"
              >
                Ratings History
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}