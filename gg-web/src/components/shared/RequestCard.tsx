import { cn } from "cn"
import { Button } from "../ui/button"
import { PaymentStatusBadge } from "./PaymentStatusBadge"

interface RequestCardProps {
  category: string
  description: string
  neededFrom: string
  neededTo: string
  pincode?: string
  status: string
  offersCount?: number
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function RequestCard({
  category,
  description,
  neededFrom,
  neededTo,
  pincode,
  status,
  offersCount,
  actionLabel = "View Bids",
  onAction,
  className,
}: RequestCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{category}</h3>
          <PaymentStatusBadge status={status} domain="request" />
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {description}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          📅 {neededFrom} – {neededTo}
        </p>
        {pincode && (
          <p className="mt-1 text-xs text-muted-foreground">📍 {pincode}</p>
        )}
        {typeof offersCount === "number" && (
          <p className="mt-2 text-xs text-muted-foreground">
            {offersCount} offers
          </p>
        )}
      </div>
      {onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-4 w-full"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}