import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white hover:opacity-80",
        secondary:
          "border-transparent bg-secondary text-white hover:opacity-80",
        destructive:
          "border-transparent bg-error text-white hover:opacity-80",
        outline: "text-text-primary border-border",
        success:
          "border-transparent bg-success text-white hover:opacity-80",
        warning:
          "border-transparent bg-warning text-white hover:opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
