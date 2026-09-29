import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";
import { useAuth } from "../../hooks/useAuth";

type FormState = {
  title: string;
  description: string;
  price_per_day: string;
  pincode: string;
  category_id: string;
  brand: string;
  model_name: string;
  condition_grade: string;
  registration_number: string;
  fuel_type: string;
  power_source: string;
  capacity_spec: string;
  manufacture_year: string;
  horsepower: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  price_per_day: "",
  pincode: "",
  category_id: "",
  brand: "",
  model_name: "",
  condition_grade: "",
  registration_number: "",
  fuel_type: "",
  power_source: "",
  capacity_spec: "",
  manufacture_year: "",
  horsepower: "",
};

export default function AddEditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/listings/${id}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = await res.json();
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          price_per_day: data.price_per_day?.toString() ?? "",
          pincode: data.pincode ?? "",
          category_id: data.category_id ?? "",
          brand: data.brand ?? "",
          model_name: data.model_name ?? "",
          condition_grade: data.condition_grade ?? "",
          registration_number: data.registration_number ?? "",
          fuel_type: data.fuel_type ?? "",
          power_source: data.power_source ?? "",
          capacity_spec: data.capacity_spec ?? "",
          manufacture_year: data.manufacture_year?.toString() ?? "",
          horsepower: data.horsepower?.toString() ?? "",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        navigate("/error", {
          state: { message, redirectTo: "/listings/new" },
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit, navigate]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      price_per_day: Number(form.price_per_day),
      pincode: form.pincode,
      category_id: form.category_id,
    };

    if (form.brand.trim()) payload.brand = form.brand;
    if (form.model_name.trim()) payload.model_name = form.model_name;
    if (form.condition_grade.trim()) payload.condition_grade = form.condition_grade;
    if (form.registration_number.trim())
      payload.registration_number = form.registration_number;
    if (form.fuel_type.trim()) payload.fuel_type = form.fuel_type;
    if (form.power_source.trim()) payload.power_source = form.power_source;
    if (form.capacity_spec.trim()) payload.capacity_spec = form.capacity_spec;
    if (form.manufacture_year.trim())
      payload.manufacture_year = Number(form.manufacture_year);
    if (form.horsepower.trim()) payload.horsepower = Number(form.horsepower);

    return payload;
  };

  const uploadPhoto = async (listingId: string) => {
    if (!photoFile) return;

    const formData = new FormData();
    formData.append("file", photoFile);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/listings/${listingId}/photos`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Photo upload failed with ${res.status}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let listingId = id ?? "";

      if (isEdit && id) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/listings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...buildPayload(),
            owner_id: userId,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const created = await res.json();
        listingId = created.id;
      }

      if (photoFile) {
        await uploadPhoto(listingId);
      }

      navigate("/success", {
        state: { message: "Listing saved", redirectTo: "/dashboard" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: "/listings/new" },
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Listing" : "Add Listing"}
        </h1>

        {loading ? (
          <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Price per Day (₹)</label>
                <input
                  type="number"
                  value={form.price_per_day}
                  onChange={(e) => handleChange("price_per_day", e.target.value)}
                  required
                  min={0}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Category ID</label>
              <input
                type="text"
                value={form.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
                required
                placeholder="Paste a category UUID"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                No category dropdown yet — paste a UUID from equipment_categories.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h2 className="mb-3 text-sm font-medium">Specifications (Optional)</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Model Name</label>
                  <input
                    type="text"
                    value={form.model_name}
                    onChange={(e) => handleChange("model_name", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Condition Grade</label>
                  <input
                    type="text"
                    value={form.condition_grade}
                    onChange={(e) => handleChange("condition_grade", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Registration Number</label>
                  <input
                    type="text"
                    value={form.registration_number}
                    onChange={(e) => handleChange("registration_number", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Fuel Type</label>
                  <input
                    type="text"
                    value={form.fuel_type}
                    onChange={(e) => handleChange("fuel_type", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Power Source</label>
                  <input
                    type="text"
                    value={form.power_source}
                    onChange={(e) => handleChange("power_source", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Capacity Spec</label>
                  <input
                    type="text"
                    value={form.capacity_spec}
                    onChange={(e) => handleChange("capacity_spec", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Manufacture Year</label>
                  <input
                    type="number"
                    value={form.manufacture_year}
                    onChange={(e) => handleChange("manufacture_year", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Horsepower</label>
                  <input
                    type="number"
                    value={form.horsepower}
                    onChange={(e) => handleChange("horsepower", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              {photoFile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: {photoFile.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Listing"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
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