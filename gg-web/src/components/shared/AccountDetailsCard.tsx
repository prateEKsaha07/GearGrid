import { Card } from "@/components/ui/card"
import { cn } from "cn"

interface AccountDetailsItem {
  label: string
  value: string
}

interface AccountDetailsCardProps {
  items: AccountDetailsItem[]
  title?: string
  className?: string
}

export function AccountDetailsCard({
  items,
  title = "Account details",
  className,
}: AccountDetailsCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 text-lg font-medium text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}