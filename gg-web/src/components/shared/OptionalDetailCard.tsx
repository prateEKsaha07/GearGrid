import { Card } from "@/components/ui/card"
import { cn } from "cn"

interface OptionalDetailCardProps {
  title: string
  description: string
  className?: string
}

export function OptionalDetailCard({
  title,
  description,
  className,
}: OptionalDetailCardProps) {
  return (
    <Card className={cn("flex flex-col bg-muted/40 p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">Optional</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Card>
  )
}