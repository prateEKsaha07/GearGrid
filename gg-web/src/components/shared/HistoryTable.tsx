import { cn } from "cn"

export interface HistoryRow {
  id: string
  role: string
  title: string
  dates: string
  status: string
  href?: string
  onOpen?: () => void
}

interface HistoryTableProps {
  rows: HistoryRow[]
  actionLabel?: string
  className?: string
}

export function HistoryTable({
  rows,
  actionLabel = "Invoice & records →",
  className,
}: HistoryTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-b-0"
            >
              <td className="px-5 py-4 text-muted-foreground">{row.role}</td>
              <td className="px-5 py-4 font-medium text-foreground">
                {row.title}
              </td>
              <td className="px-5 py-4 text-muted-foreground">{row.dates}</td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-full bg-[var(--gg-success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--gg-success-fg)]">
                  {row.status}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                {row.href ? (
                  <a
                    href={row.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {actionLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={row.onOpen}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {actionLabel}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}