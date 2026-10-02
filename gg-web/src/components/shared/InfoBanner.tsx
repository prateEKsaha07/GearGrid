import { cn } from "cn"

interface InfoBannerProps {
  title: string
  description?: string
  className?: string
}

export function InfoBanner({ title, description, className }: InfoBannerProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--gg-info-bg)] p-4",
        className,
      )}
    >
      <p className="text-sm font-semibold text-[var(--gg-info-fg)]">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-[var(--gg-info-fg)]/80">{description}</p>
      )}
    </div>
  )
}