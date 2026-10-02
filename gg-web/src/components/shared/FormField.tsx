import * as React from "react"
import { cn } from "cn"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  optional?: boolean
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  optional,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">
            · Optional
          </span>
        )}
      </Label>
      {children}
    </div>
  )
}