import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border-0 border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-out outline-none select-none hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-[0.98] active:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand-yellow text-brand-black shadow-[0_4px_14px_rgba(255,210,0,0.45)] hover:shadow-[0_8px_24px_rgba(255,210,0,0.55)] hover:bg-yellow-300 font-extrabold tracking-tight font-cocon",
        primary:
          "bg-brand-charcoal text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_24px_rgba(255,210,0,0.45)] hover:bg-brand-yellow hover:text-brand-black font-extrabold font-cocon",
        accent:
          "bg-brand-cyan text-white shadow-[0_4px_14px_rgba(36,169,197,0.35)] hover:shadow-[0_8px_24px_rgba(36,169,197,0.45)] hover:bg-cyan-400 font-extrabold font-cocon",
        outline:
          "border-2 border-current bg-transparent hover:bg-brand-yellow hover:border-brand-yellow hover:text-brand-black font-bold font-cocon shadow-sm hover:shadow-[0_4px_14px_rgba(255,210,0,0.3)]",
        secondary:
          "bg-brand-beige text-brand-black shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_18px_rgba(255,210,0,0.25)] hover:bg-brand-yellow font-bold font-cocon",
        ghost:
          "hover:bg-brand-yellow/20 hover:text-brand-black font-bold font-cocon",
        destructive:
          "bg-red-500 text-white shadow-[0_4px_14px_rgba(239,68,68,0.35)] hover:bg-red-600 hover:shadow-[0_8px_24px_rgba(239,68,68,0.45)] font-bold font-cocon",
        link: "text-brand-black underline-offset-4 hover:underline font-bold",
      },
      size: {
        default:
          "h-9 gap-1.5 px-5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-full px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-full px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-7 text-base",
        icon: "size-9",
        "icon-xs": "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-full",
        "icon-lg": "size-10",
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
