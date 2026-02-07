import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Premium variants
        premium:
          "bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium shadow-lg shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        notebooklm:
          "bg-gradient-to-br from-teal-400 via-cyan-500 to-purple-600 text-white font-medium shadow-lg shadow-cyan-500/25 hover:from-teal-500 hover:via-cyan-600 hover:to-purple-700 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        glass:
          "bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-gray-800/80 shadow-lg hover:shadow-xl",
        glow:
          "bg-brand-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:bg-brand-600 active:scale-[0.98]",
        "outline-brand":
          "border-2 border-brand-500 text-brand-600 dark:text-brand-400 bg-transparent hover:bg-brand-50 dark:hover:bg-brand-950 hover:border-brand-600",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        // Touch-friendly sizes (44px minimum for accessibility)
        touch: "h-11 min-w-11 px-5 py-3 text-base has-[>svg]:px-4",
        "touch-sm": "h-10 min-w-10 px-4 py-2 has-[>svg]:px-3",
        "icon-touch": "size-11 [&_svg:not([class*='size-'])]:size-5",
        "icon-touch-sm": "size-10 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
