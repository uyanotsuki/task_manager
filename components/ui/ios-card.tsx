import { cn } from "@/lib/utils"

export function IOSCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        `
        rounded-2xl
        border border-border
        bg-card
        shadow-sm
        p-5
        transition
        hover:shadow-md
        hover:-translate-y-[1px]
        `,
        className
      )}
    >
      {children}
    </div>
  )
}