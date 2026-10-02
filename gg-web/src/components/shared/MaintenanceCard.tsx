import { cn } from "cn"
import { Button } from "../ui/button"

interface MaintenanceCardProps {
  categoryLabel: string
  title: string
  note: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function MaintenanceCard({
  categoryLabel,
  title,
  note,
  actionLabel = "Change status",
  onAction,
  className,
}: MaintenanceCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--gg-amber-fg)]">
        {categoryLabel}
      </p>
      <h4 className="mt-2 text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}