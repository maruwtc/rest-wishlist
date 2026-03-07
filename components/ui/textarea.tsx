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
        "flex min-h-32 w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-4 focus-visible:ring-sky-500/15 dark:border-white/15 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-400 dark:focus-visible:border-sky-400 dark:focus-visible:ring-sky-400/15",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
