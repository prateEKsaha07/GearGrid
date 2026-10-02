import { Card } from "@/components/ui/card"
import { cn } from "cn"

interface ReliabilityCardProps {
  label: string
  score: number
  statsLine?: string
  className?: string
}

export function ReliabilityCard({
  label,
  score,
  statsLine,
  className,
}: ReliabilityCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-3xl font-semibold tabular-nums text-primary">
          {score.toFixed(1)}
        </p>
      </div>
      {statsLine && (
        <p className="mt-3 text-xs text-muted-foreground">{statsLine}</p>
      )}
    </Card>
  )
}