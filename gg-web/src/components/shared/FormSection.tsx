import * as React from "react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"

interface FormSectionProps {
  title: string
  badge?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  badge,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  )
}