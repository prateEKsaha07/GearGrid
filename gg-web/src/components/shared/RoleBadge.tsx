import { cn } from "cn"

interface RoleBadgeProps {
  isOwner: boolean
  className?: string
}

export function RoleBadge({ isOwner, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        isOwner
          ? "bg-[var(--gg-success-bg)] text-[var(--gg-success-fg)]"
          : "bg-[var(--gg-info-bg)] text-[var(--gg-info-fg)]",
        className,
      )}
    >
      {isOwner ? "You are the owner" : "You are the renter"}
    </span>
  )
}