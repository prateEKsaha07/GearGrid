import { useState } from "react";
import { Link } from "react-router-dom";

type NavBarProps = {
  unreadCount?: number;
  userName: string;
};

export default function NavBar({ unreadCount = 0, userName }: NavBarProps) {
  const [language, setLanguage] = useState<"EN" | "HI">("EN");

  return (
    <nav className="bg-[#1F3D2E] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C7E58E] text-[#1F3D2E]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M3 17h2l2-4h6l2 4h6" />
              <circle cx="7" cy="17" r="1.5" />
              <circle cx="17" cy="17" r="1.5" />
              <path d="M14 13V9a1 1 0 0 0-1-1H9" />
            </svg>
          </span>
          <span className="text-base font-semibold tracking-tight">GearGrid</span>
        </Link>

        {/* Center nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/dashboard"
            className="text-sm text-white/90 transition hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/browse"
            className="text-sm text-white/90 transition hover:text-white"
          >
            Browse
          </Link>
          <Link
            to="/notifications"
            className="text-sm text-white/90 transition hover:text-white"
          >
            Notifications{unreadCount > 0 ? ` · ${unreadCount}` : ""}
          </Link>
          <Link
            to="/profile"
            className="text-sm text-white/90 transition hover:text-white"
          >
            Profile
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
            className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/90 transition hover:bg-white/10"
          >
            <span className={language === "EN" ? "text-white" : "text-white/50"}>EN</span>
            <span className="text-white/30">/</span>
            <span className={language === "HI" ? "text-white" : "text-white/50"}>हिं</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C7E58E] text-xs font-semibold text-[#1F3D2E]">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-white">{userName}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}