import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-[8px] border border-[#E4E3E0] bg-white px-3 py-1 text-sm text-[#1A1917] placeholder:text-[#9B9A96] transition-colors duration-150 outline-none",
        "focus:border-[#1A1917]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:border-[#DC2626]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
