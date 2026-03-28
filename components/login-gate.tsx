"use client";

import { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const SESSION_KEY = "maru-login-unlocked";

export function LoginGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(SESSION_KEY) === "unlocked";
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sanitizedPin = pin.replace(/\D/g, "").slice(0, 8);

    if (sanitizedPin.length !== 8) {
      setError("PIN must be 8 digits.");
      return;
    }

    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: sanitizedPin }),
    });

    if (!response.ok) {
      setError("Incorrect PIN.");
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, "unlocked");
    setError(null);
    setIsUnlocked(true);
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <main className="h-dvh max-h-dvh overflow-hidden">
      <div className="safe-page mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-0 sm:px-6 lg:px-8">
        <div className="relative flex safe-screen w-full items-center justify-center overflow-hidden">
          <ThemeToggle className="absolute right-0 top-0 z-10 sm:right-2 sm:top-2" />
          <Card className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/80 dark:shadow-none">
            <CardHeader className="text-center px-8 pt-10">
              <CardTitle className="text-3xl tracking-[-0.04em]">Login</CardTitle>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-300">
                Enter your 8-digit PIN to unlock.
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <form className="w-full" onSubmit={handleSubmit}>
                <div className="flex flex-col items-center space-y-4">
                  <InputOTP
                    id="login-pin"
                    maxLength={8}
                    pattern={REGEXP_ONLY_DIGITS}
                    autoComplete="one-time-code"
                    value={pin}
                    onChange={(value) => {
                      setPin(value);
                      setError(null);
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                      <InputOTPSlot index={6} />
                      <InputOTPSlot index={7} />
                    </InputOTPGroup>
                  </InputOTP>
                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
                      {error}
                    </div>
                  ) : null}
                  <Button type="submit" className="justify-center mt-2 w-full" disabled={pin.length !== 8}>
                    Unlock
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
