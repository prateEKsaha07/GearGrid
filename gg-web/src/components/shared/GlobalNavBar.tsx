import { cn } from "cn"
import { LanguageToggle, type Language } from "./LanguageToggle"
import { AvatarChip } from "./AvatarChip"

export interface NavItem {
  label: string
  href: string
  count?: number
}

interface GlobalNavBarProps {
  items: NavItem[]
  activeHref: string
  userName: string
  userAvatarSrc?: string
  language: Language
  onLanguageChange: (lang: Language) => void
  brandHref?: string
  brandLabel?: string
  className?: string
}

export function GlobalNavBar({
  items,
  activeHref,
  userName,
  userAvatarSrc,
  language,
  onLanguageChange,
  brandHref = "/",
  brandLabel = "GearGrid",
  className,
}: GlobalNavBarProps) {
  return (
    <header
      className={cn(
        "w-full overflow-x-clip bg-[var(--gg-navbar)] text-[var(--gg-navbar-foreground)]",
        className,
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-4 px-4 sm:gap-8 sm:px-6">
        {/* Brand */}
        <a
          href={brandHref}
          className="flex shrink-0 items-center gap-3"
          aria-label={brandLabel}
        >
          <span
            aria-hidden
            className={cn(
              "flex size-9 items-center justify-center rounded-[10px]",
              "bg-[var(--gg-lime)] text-[var(--gg-lime-foreground)]",
            )}
          >
            {/* Placeholder mark — swap for the real logo SVG */}
            <svg viewBox="0 0 24 24" fill="none" className="size-5">
              <path
                d="M4 9h16M6 9V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M6 9v8h12V9M9 13h6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="hidden text-lg font-medium tracking-tight sm:inline">
            {brandLabel}
          </span>
        </a>

        {/* Center links — hidden on mobile */}
        <ul className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {items.map((item) => {
            const active = item.href === activeHref
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sm transition-colors",
                    active
                      ? "font-semibold text-[var(--gg-navbar-foreground)]"
                      : "text-[var(--gg-navbar-foreground)]/85 hover:text-[var(--gg-navbar-foreground)]",
                  )}
                >
                  {item.label}
                  {typeof item.count === "number" && (
                    <span className="ml-1">· {item.count}</span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>

        {/* Right controls */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <LanguageToggle value={language} onChange={onLanguageChange} />
          <AvatarChip name={userName} src={userAvatarSrc} />
        </div>
      </nav>
    </header>
  )
}