import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-32 w-full rounded-[24px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus-visible:border-[var(--primary)] focus-visible:ring-4 focus-visible:ring-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] placeholder:text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
