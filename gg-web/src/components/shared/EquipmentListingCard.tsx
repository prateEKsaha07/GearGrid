import { cn } from "cn"
import { Button } from "../ui/button"
import { PaymentStatusBadge } from "./PaymentStatusBadge"
import { CategoryChip } from "./CategoryChip"

interface EquipmentListingCardProps {
  title: string
  pricePerDay: number
  status: string
  pincode?: string
  imageUrl?: string
  category?: string
  ownerName?: string
  rating?: number
  distanceKm?: number
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EquipmentListingCard({
  title,
  pricePerDay,
  status,
  pincode,
  imageUrl,
  category,
  ownerName,
  rating,
  distanceKm,
  actionLabel = "Manage",
  onAction,
  className,
}: EquipmentListingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {category && (
          <div className="absolute left-3 top-3">
            <CategoryChip label={category} />
          </div>
        )}
        {typeof distanceKm === "number" && (
          <span className="absolute right-3 top-3 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground/80 backdrop-blur-sm">
            {distanceKm} km away
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-base font-semibold text-foreground">
          ₹{pricePerDay.toLocaleString("en-IN")}/day
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          {ownerName && (
            <span>
              {ownerName}
              {typeof rating === "number" && (
                <span className="ml-1">· ★ {rating.toFixed(1)}</span>
              )}
            </span>
          )}
          {!ownerName && pincode && <span>📍 {pincode}</span>}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <PaymentStatusBadge status={status} domain="listing" />
          {onAction && (
            <Button variant="secondary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}