import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

type FormState = {
  name: string;
  phone: string;
  pincode: string;
  secondary_pincode: string;
  address_line: string;
  bio: string;
  language_pref: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  pincode: "",
  secondary_pincode: "",
  address_line: "",
  bio: "",
  language_pref: "en",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        navigate("/error", {
          state: { message: error.message, redirectTo: "/profile/edit" },
        });
        return;
      }

      if (data) {
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          pincode: data.pincode ?? "",
          secondary_pincode: data.secondary_pincode ?? "",
          address_line: data.address_line ?? "",
          bio: data.bio ?? "",
          language_pref: data.language_pref ?? "en",
        });
      }

      setLoading(false);
    };

    load();
  }, [userId, navigate]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({
        name: form.name || null,
        phone: form.phone || null,
        pincode: form.pincode || null,
        secondary_pincode: form.secondary_pincode || null,
        address_line: form.address_line || null,
        bio: form.bio || null,
        language_pref: form.language_pref,
      })
      .eq("id", userId);

    if (error) {
      navigate("/error", {
        state: { message: error.message, redirectTo: "/profile/edit" },
      });
      return;
    }

    navigate("/success", {
      state: { message: "Profile updated successfully", redirectTo: "/profile" },
    });
  };

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName={form.name || "User"} />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit Profile</h1>

        {loading ? (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Secondary Pincode</label>
                <input
                  type="text"
                  value={form.secondary_pincode}
                  onChange={(e) => handleChange("secondary_pincode", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Address</label>
              <input
                type="text"
                value={form.address_line}
                onChange={(e) => handleChange("address_line", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Language Preference</label>
              <select
                value={form.language_pref}
                onChange={(e) => handleChange("language_pref", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}