import { cn } from "cn"
import { Button } from "../ui/button"
import { PaymentStatusBadge } from "./PaymentStatusBadge"
import { RoleBadge } from "./RoleBadge"

interface BookingCardProps {
  title: string
  startDate: string
  endDate: string
  status: string
  isOwner: boolean
  metaLine?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function BookingCard({
  title,
  startDate,
  endDate,
  status,
  isOwner,
  metaLine,
  actionLabel,
  onAction,
  className,
}: BookingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <PaymentStatusBadge status={status} domain="booking" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {startDate} – {endDate}
        </p>
        <div className="mt-3">
          <RoleBadge isOwner={isOwner} />
        </div>
        {metaLine && (
          <p className="mt-2 text-xs text-muted-foreground">{metaLine}</p>
        )}
      </div>
      {onAction && actionLabel && (
        <Button size="sm" onClick={onAction} className="mt-4 w-full">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}