import { useState } from "react";
import { Link } from "react-router-dom";

type NavBarProps = {
  unreadCount?: number;
  userName: string;
};

export default function NavBar({ unreadCount = 0, userName }: NavBarProps) {
  const [language, setLanguage] = useState<"EN" | "HI">("EN");

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          GearGrid
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            to="/browse"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Browse
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-muted"
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition hover:bg-muted"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span>{userName}</span>
          </Link>

          <button
            type="button"
            onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            {language}
          </button>
        </div>
      </div>
    </nav>
  );
}