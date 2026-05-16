import * as React from "react"
import { cn } from "@/lib/utils"

export const IOSCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
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
        className,
      )}
    >
      {children}
    </div>
  )
})
IOSCard.displayName = "IOSCard"
