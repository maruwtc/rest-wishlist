"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "mx-auto flex max-w-full items-center justify-center overflow-x-auto rounded-[2rem] border border-slate-200/80 bg-slate-50/90 px-3 py-3 shadow-sm shadow-slate-900/5 transition-colors duration-200 dark:border-slate-700/80 dark:bg-slate-950/70 dark:shadow-none",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center justify-center gap-1 sm:gap-2 md:gap-3", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-[1.25rem] border border-slate-200 bg-white text-base shadow-sm shadow-slate-900/5 transition-all duration-200 outline-none data-[active=true]:z-10 data-[active=true]:border-sky-500 data-[active=true]:bg-sky-50 data-[active=true]:ring-4 data-[active=true]:ring-sky-500/15 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:shadow-none dark:data-[active=true]:border-sky-400 dark:data-[active=true]:bg-slate-900/80 dark:data-[active=true]:ring-sky-400/15",
        className
      )}
      {...props}
    >
      {char ? (
        <span className="h-3.5 w-3.5 rounded-full bg-slate-950 dark:bg-white" />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/15" />
      )}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-caret-blink bg-sky-500 duration-1000 dark:bg-sky-400" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
