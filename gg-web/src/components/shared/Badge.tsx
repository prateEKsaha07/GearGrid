import { cn } from "cn"

type Tone = "neutral" | "success" | "info" | "warning" | "danger"

interface BadgeProps {
  children: React.ReactNode
  tone?: Tone
  className?: string
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success:
    "bg-[var(--gg-success-bg)] text-[var(--gg-success-fg)]",
  info: "bg-[var(--gg-info-bg)] text-[var(--gg-info-fg)]",
  warning:
    "bg-[var(--gg-amber-bg)] text-[var(--gg-amber-fg)]",
  danger: "bg-destructive/10 text-destructive",
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}