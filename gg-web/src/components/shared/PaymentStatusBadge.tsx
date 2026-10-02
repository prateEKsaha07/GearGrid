import { Badge } from "./Badge"

type Tone = "neutral" | "success" | "info" | "warning" | "danger"

const LISTING_STATUS: Record<string, Tone> = {
  available: "success",
  booked: "warning",
  under_maintenance: "warning",
  unlisted: "neutral",
}

const REQUEST_STATUS: Record<string, Tone> = {
  open: "success",
  matched: "info",
  expired: "neutral",
}

const BOOKING_STATUS: Record<string, Tone> = {
  confirmed: "success",
  pickup_in_progress: "info",
  active: "info",
  return_in_progress: "warning",
  completed: "neutral",
  cancelled: "danger",
}

const BID_STATUS: Record<string, Tone> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  auto_rejected_overlap: "neutral",
}

const MAPS = {
  listing: LISTING_STATUS,
  request: REQUEST_STATUS,
  booking: BOOKING_STATUS,
  bid: BID_STATUS,
} as const

interface PaymentStatusBadgeProps {
  status: string
  domain: keyof typeof MAPS
  className?: string
}

export function PaymentStatusBadge({
  status,
  domain,
  className,
}: PaymentStatusBadgeProps) {
  const tone = MAPS[domain][status] ?? "neutral"
  return (
    <Badge tone={tone} className={className}>
      {status.replace(/_/g, " ")}
    </Badge>
  )
}