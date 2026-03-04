"use client";

import { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const SESSION_KEY = "maru-login-day";

function getTodayPinParts(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return {
    key: `${date.getFullYear()}-${month}-${day}`,
    pin: `${day}${month}${year}`,
    label: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

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

    return window.sessionStorage.getItem(SESSION_KEY) === getTodayPinParts().key;
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sanitizedPin = pin.replace(/\D/g, "").slice(0, 6);
    const { key, pin: expectedPin } = getTodayPinParts();

    if (sanitizedPin !== expectedPin) {
      setError("Incorrect PIN.");
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, key);
    setError(null);
    setIsUnlocked(true);
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <Card className="w-full max-w-md flex-col items-center space-y-4 bg-[var(--surface)] backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl tracking-[-0.04em]">Enter PIN</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col items-center space-y-2">
              <InputOTP
                id="daily-pin"
                maxLength={6}
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
                </InputOTPGroup>
              </InputOTP>
              {error ? (
                <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-foreground)]">
                  {error}
                </div>
              ) : null}
              <Button type="submit" className="justify-center mt-6 w-full" disabled={pin.length !== 6}>
                Unlock
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
