"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Phase 3: wire up password reset email API
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="py-16 sm:py-20">
      <Container className="max-w-sm lg:max-w-lg">
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          style={{ marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
        >
          <ArrowLeft className="size-4" /> Back to login
        </Link>

        {sent ? (
          <div className="text-center py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-8 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Check your email</h1>
            <p className="text-body-sm text-muted-foreground mb-6">
              If that email address is registered with us, we&apos;ve sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Mail className="size-7 text-primary" />
              </div>
              <h1 className="text-h1 font-bold mb-2">Forgot your password?</h1>
              <p className="text-body-sm text-muted-foreground">
                Enter your email and we&apos;ll send a reset link if your account exists.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-body-sm font-medium">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
      </Container>
    </div>
  );
}
