import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#1A1917] text-white hover:bg-[#3D3C3A] active:scale-[0.98]",
        destructive:
          "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
        outline:
          "border border-[#E4E3E0] bg-white text-[#3D3C3A] hover:bg-[#F8F8F7] hover:border-[#C8C7C3]",
        secondary:
          "bg-[#F0EFED] text-[#1A1917] hover:bg-[#E4E3E0]",
        ghost:
          "text-[#6B6A67] hover:bg-[#F0EFED] hover:text-[#1A1917]",
        link:
          "text-[#1A1917] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:  "h-8 rounded-[6px] px-3 text-xs",
        lg:  "h-10 px-5",
        icon: "size-8 rounded-[6px]",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
