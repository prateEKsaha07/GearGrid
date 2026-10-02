import { cn } from "cn"

interface CategoryChipProps {
  label: string
  className?: string
}

export function CategoryChip({ label, className }: CategoryChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-background/90 px-2 py-0.5",
        "text-[11px] font-medium text-foreground/80 backdrop-blur-sm",
        className,
      )}
    >
      {label}
    </span>
  )
}