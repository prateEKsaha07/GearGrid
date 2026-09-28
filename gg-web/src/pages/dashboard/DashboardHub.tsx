import { useState } from "react";
import NavBar from "../../components/shared/NavBar";

const TABS = [
  "My Listings",
  "My Requests",
  "Browse Nearby",
  "Active Tools",
  "Pending",
  "History",
] as const;

type Tab = (typeof TABS)[number];

export default function DashboardHub() {
  const [activeTab, setActiveTab] = useState<Tab>("My Listings");
  const profileComplete = false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {!profileComplete && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Complete your profile to start listing or bidding
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border p-6">
          <div>{activeTab}</div>
        </div>
      </div>
    </div>
  );
}