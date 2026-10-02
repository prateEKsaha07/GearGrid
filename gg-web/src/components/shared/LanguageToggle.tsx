import { cn } from "cn"

export type Language = "en" | "hi"

interface LanguageToggleProps {
  value: Language
  onChange: (value: Language) => void
  className?: string
}

const options: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "hi", label: "हि" },
]

export function LanguageToggle({ value, onChange, className }: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1 py-0.5",
        "border-[var(--gg-pill-border)] bg-[var(--gg-pill)]",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--gg-lime)] text-[var(--gg-lime-foreground)]"
                : "text-[var(--gg-navbar-foreground)]/70 hover:text-[var(--gg-navbar-foreground)]",
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}