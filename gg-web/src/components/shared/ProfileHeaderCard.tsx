import { BadgeCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "cn"

interface ProfileHeaderCardProps {
  name: string
  avatarUrl?: string
  pincode?: string | null
  city?: string | null
  isVerified: boolean
  bio?: string | null
  className?: string
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function ProfileHeaderCard({
  name,
  avatarUrl,
  pincode,
  city,
  isVerified,
  bio,
  className,
}: ProfileHeaderCardProps) {
  const location = [pincode, city].filter(Boolean).join(" · ")

  return (
    <Card className={cn("flex flex-col items-center p-6 text-center", className)}>
      <Avatar className="size-20">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} />
        ) : (
          <AvatarFallback className="text-2xl">
            {initials(name)}
          </AvatarFallback>
        )}
      </Avatar>

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        {name}
      </h2>

      {location && (
        <p className="mt-1 text-xs text-muted-foreground">{location}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gg-success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--gg-success-fg)]">
            <BadgeCheck className="size-3.5" />
            ID verified
          </span>
        )}
      </div>

      {bio && (
        <>
          <div className="my-4 h-px w-full bg-border" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {bio}
          </p>
        </>
      )}
    </Card>
  )
}