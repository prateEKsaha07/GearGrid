import { cn } from "cn"

export interface TabItem {
  value: string
  label: string
  count?: number
}

interface TabStripProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TabStrip({ items, value, onChange, className }: TabStripProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-6 border-b border-border",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative -mb-px pb-2 text-sm transition-colors",
              active
                ? "border-b-2 border-primary font-medium text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}