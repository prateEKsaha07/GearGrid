import { cn } from "cn"

type Tone = "success" | "warning"

interface HandoffAlertCardProps {
  tone: Tone
  title: string
  meta: string
  actionLabel: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

const toneClasses: Record<Tone, string> = {
  success:
    "bg-[var(--gg-success-bg)] text-[var(--gg-success-fg)] border-[var(--gg-success-border)]",
  warning:
    "bg-[var(--gg-amber-bg)] text-[var(--gg-amber-fg)] border-[var(--gg-amber-border)]",
}

export function HandoffAlertCard({
  tone,
  title,
  meta,
  actionLabel,
  actionHref,
  onAction,
  className,
}: HandoffAlertCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        toneClasses[tone],
        className,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-80">{meta}</p>
      {actionHref ? (
        <a
          href={actionHref}
          className="mt-2 inline-block text-xs font-semibold underline-offset-2 hover:underline"
        >
          {actionLabel}
        </a>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-block text-xs font-semibold underline-offset-2 hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}