import { useEffect, useState } from "react";
import NavBar from "../../components/shared/NavBar";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

type Notification = {
  id: string;
  user_id: string;
  type: string;
  reference_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationCentre() {
  const { userId, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setNotifications([]);
    } else {
      setError(null);
      setNotifications((data ?? []) as Notification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleClick = async (id: string) => {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await fetchNotifications();
  };

  if (authLoading) return <div>Loading...</div>;
  if (!userId) return <div>Not logged in</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={notifications.filter((n) => !n.is_read).length} userName="User" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Notifications</h1>

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

        {!loading && !error && notifications.length === 0 && (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition hover:bg-muted ${
                    n.is_read ? "opacity-70" : ""
                  }`}
                >
                  <span
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                      n.is_read ? "bg-transparent" : "bg-primary"
                    }`}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {n.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{n.message}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}