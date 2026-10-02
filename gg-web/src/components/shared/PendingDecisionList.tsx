import { cn } from "cn"
import { Button } from "../ui/button"

export interface PendingDecisionItem {
  id: string
  title: string
  description: string
  timestamp: string
  href?: string
}

interface PendingDecisionListProps {
  title?: string
  items: PendingDecisionItem[]
  onApprove?: () => void
  onDecline?: () => void
  showActions?: boolean
  className?: string
}

export function PendingDecisionList({
  title = "Pending Decisions",
  items,
  onApprove,
  onDecline,
  showActions = false,
  className,
}: PendingDecisionListProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg bg-[var(--gg-info-bg)] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--gg-info-fg)]"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  {item.href && (
                    <a
                      href={item.href}
                      className="mt-1.5 inline-block text-xs font-medium text-[var(--gg-info-fg)] hover:underline"
                    >
                      View related page →
                    </a>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.timestamp}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {showActions && (
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
          <Button variant="outline" size="sm" onClick={onDecline}>
            Decline
          </Button>
        </div>
      )}
    </div>
  )
}