"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "maru-theme";

const OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  icon: string;
}> = [
  { value: "system", label: "Auto", icon: "A" },
  { value: "light", label: "Light", icon: "L" },
  { value: "dark", label: "Dark", icon: "D" },
];

function applyTheme(mode: ThemeMode) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const resolvedMode = mode === "system" ? (media.matches ? "dark" : "light") : mode;
  document.documentElement.classList.toggle("dark", resolvedMode === "dark");
  document.documentElement.dataset.theme = mode;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    return savedTheme === "light" || savedTheme === "dark" || savedTheme === "system"
      ? savedTheme
      : "system";
  });

  useEffect(() => {
    applyTheme(theme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if ((window.localStorage.getItem(THEME_STORAGE_KEY) ?? "system") === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [theme]);

  function handleSelect(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)]/90 p-1 text-xs text-[var(--muted-foreground)] backdrop-blur",
        className,
      )}
      aria-label="Theme"
    >
      {OPTIONS.map((option) => {
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-3 font-medium",
              isActive
                ? "bg-[var(--surface-strong)] text-[var(--foreground)]"
                : "hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
            )}
            aria-pressed={isActive}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current/15 text-[10px]">
              {option.icon}
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
