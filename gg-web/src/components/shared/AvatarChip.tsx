import { cn } from "cn"

interface AvatarChipProps {
  name: string
  src?: string
  className?: string
}

export function AvatarChip({ name, src, className }: AvatarChipProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="size-9 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="size-9 rounded-full bg-[var(--gg-lime)]"
        />
      )}
      <span className="text-sm font-medium text-[var(--gg-navbar-foreground)]">
        {name}
      </span>
    </div>
  )
}