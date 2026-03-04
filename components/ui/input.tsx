import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus-visible:border-[var(--primary)] focus-visible:ring-4 focus-visible:ring-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] placeholder:text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
