import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalNavBar } from "../../components/shared/GlobalNavBar";
import { FormField } from "../../components/shared/FormField";
import { FormSection } from "../../components/shared/FormSection";
import { PhotoUploadField } from "../../components/shared/PhotoUploadField";
import { InfoBanner } from "../../components/shared/InfoBanner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

// ─── Fields that hit the database ─────────────────────────────────
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

// ─── Visual-only fields (not persisted — TODO: wire to schema) ────
type ExtraFormState = {
  email: string;
  farm_size: string;
  primary_crop: string;
  years_farming: string;
  fpo_membership: string;
  preferred_payment_method: string;
  upi_id: string;
  bank_holder_name: string;
  bank_account_last4: string;
  referral_code: string;
};

const EMPTY_EXTRA_FORM: ExtraFormState = {
  email: "",
  farm_size: "",
  primary_crop: "",
  years_farming: "",
  fpo_membership: "",
  preferred_payment_method: "",
  upi_id: "",
  bank_holder_name: "",
  bank_account_last4: "",
  referral_code: "",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [extra, setExtra] = useState<ExtraFormState>(EMPTY_EXTRA_FORM);
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
        // ─── Persisted fields ─────────────────────────────────────
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          pincode: data.pincode ?? "",
          secondary_pincode: data.secondary_pincode ?? "",
          address_line: data.address_line ?? "",
          bio: data.bio ?? "",
          language_pref: data.language_pref ?? "en",
        });

        // ─── Visual-only fields (read-only from user row if present) ─
        setExtra({
          email: data.email ?? "",
          farm_size: "",
          primary_crop: "",
          years_farming: "",
          fpo_membership: "",
          preferred_payment_method: "",
          upi_id: "",
          bank_holder_name: "",
          bank_account_last4: "",
          referral_code: "",
        });
      }

      setLoading(false);
    };

    load();
  }, [userId, navigate]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleExtraChange = (field: keyof ExtraFormState, value: string) => {
    setExtra((prev) => ({ ...prev, [field]: value }));
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
        // TODO: farm_*, payment_*, upi_*, bank_*, referral_code not yet in schema
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
        <div className="mx-auto max-w-4xl px-6 py-8">
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
        <div className="mx-auto max-w-4xl px-6 py-8">
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
        userName={form.name || "User"}
        language="en"
        onLanguageChange={() => {}}
      />

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit profile
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Required identity details support safe handoffs. Optional farm and
              payment fields make direct coordination easier.
            </p>
          </div>
          {!loading && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" form="edit-profile-form" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* ─── Basic information ──────────────────────────────── */}
            <FormSection title="Basic information">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <PhotoUploadField />

                <div className="flex-1 space-y-5">
                  <FormField label="Full name" htmlFor="name">
                    <Input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField label="Phone" htmlFor="phone">
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </FormField>

                    <FormField label="Email" htmlFor="email">
                      <Input
                        id="email"
                        type="email"
                        value={extra.email}
                        onChange={(e) =>
                          handleExtraChange("email", e.target.value)
                        }
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField label="Primary pincode" htmlFor="pincode">
                      <Input
                        id="pincode"
                        type="text"
                        value={form.pincode}
                        onChange={(e) => handleChange("pincode", e.target.value)}
                      />
                    </FormField>

                    <FormField label="Language" htmlFor="language_pref">
                      <Select
                        id="language_pref"
                        value={form.language_pref}
                        onChange={(e) =>
                          handleChange("language_pref", e.target.value)
                        }
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी</option>
                      </Select>
                    </FormField>
                  </div>

                  <FormField label="Address" htmlFor="address_line">
                    <Input
                      id="address_line"
                      type="text"
                      value={form.address_line}
                      onChange={(e) =>
                        handleChange("address_line", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Bio" optional htmlFor="bio">
                    <Textarea
                      id="bio"
                      value={form.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      rows={3}
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            {/* ─── Farm & direct-payment details ──────────────────── */}
            <FormSection
              title="Farm & direct-payment details"
              badge="All optional"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Secondary pincode" optional htmlFor="secondary_pincode">
                  <Input
                    id="secondary_pincode"
                    type="text"
                    value={form.secondary_pincode}
                    onChange={(e) =>
                      handleChange("secondary_pincode", e.target.value)
                    }
                  />
                </FormField>

                <FormField label="Farm size" optional htmlFor="farm_size">
                  <Input
                    id="farm_size"
                    type="text"
                    value={extra.farm_size}
                    onChange={(e) =>
                      handleExtraChange("farm_size", e.target.value)
                    }
                  />
                </FormField>

                <FormField label="Primary crop" optional htmlFor="primary_crop">
                  <Input
                    id="primary_crop"
                    type="text"
                    value={extra.primary_crop}
                    onChange={(e) =>
                      handleExtraChange("primary_crop", e.target.value)
                    }
                  />
                </FormField>

                <FormField label="Years farming" optional htmlFor="years_farming">
                  <Input
                    id="years_farming"
                    type="text"
                    value={extra.years_farming}
                    onChange={(e) =>
                      handleExtraChange("years_farming", e.target.value)
                    }
                  />
                </FormField>

                <FormField label="FPO membership" optional htmlFor="fpo_membership">
                  <Input
                    id="fpo_membership"
                    type="text"
                    value={extra.fpo_membership}
                    onChange={(e) =>
                      handleExtraChange("fpo_membership", e.target.value)
                    }
                  />
                </FormField>

                <FormField
                  label="Preferred payment method"
                  optional
                  htmlFor="preferred_payment_method"
                >
                  <Input
                    id="preferred_payment_method"
                    type="text"
                    value={extra.preferred_payment_method}
                    onChange={(e) =>
                      handleExtraChange("preferred_payment_method", e.target.value)
                    }
                  />
                </FormField>

                <FormField label="UPI ID" optional htmlFor="upi_id">
                  <Input
                    id="upi_id"
                    type="text"
                    value={extra.upi_id}
                    onChange={(e) =>
                      handleExtraChange("upi_id", e.target.value)
                    }
                  />
                </FormField>

                <FormField
                  label="Bank-holder name"
                  optional
                  htmlFor="bank_holder_name"
                >
                  <Input
                    id="bank_holder_name"
                    type="text"
                    value={extra.bank_holder_name}
                    onChange={(e) =>
                      handleExtraChange("bank_holder_name", e.target.value)
                    }
                  />
                </FormField>

                <FormField
                  label="Bank account last four digits"
                  optional
                  htmlFor="bank_account_last4"
                >
                  <Input
                    id="bank_account_last4"
                    type="text"
                    value={extra.bank_account_last4}
                    onChange={(e) =>
                      handleExtraChange("bank_account_last4", e.target.value)
                    }
                  />
                </FormField>

                <FormField label="Referral code" optional htmlFor="referral_code">
                  <Input
                    id="referral_code"
                    type="text"
                    value={extra.referral_code}
                    onChange={(e) =>
                      handleExtraChange("referral_code", e.target.value)
                    }
                  />
                </FormField>
              </div>

              <InfoBanner
                title="No payment is processed by GearGrid"
                description="UPI and masked bank details are shared only for parties to pay each other directly. Never share an OTP or full bank account number."
              />
            </FormSection>
          </form>
        )}
      </div>
    </div>
  );
}