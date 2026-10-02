import { Camera } from "lucide-react"
import { cn } from "cn"

interface PhotoUploadFieldProps {
  imageUrl?: string
  label?: string
  className?: string
}

export function PhotoUploadField({
  imageUrl,
  label = "Change photo",
  className,
}: PhotoUploadFieldProps) {
  // TODO: wire to file input when avatar upload is implemented
  return (
    <button
      type="button"
      className={cn(
        "flex size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-muted text-xs text-muted-foreground transition hover:bg-muted/80",
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="size-full rounded-full object-cover"
        />
      ) : (
        <>
          <Camera className="size-5" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}