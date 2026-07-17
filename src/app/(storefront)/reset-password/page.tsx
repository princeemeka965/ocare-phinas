"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!email || !token) {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-sm lg:max-w-lg">
          <div className="text-center py-8">
            <h1 className="text-h2 font-bold mb-2">Invalid reset link</h1>
            <p className="text-body-sm text-muted-foreground mb-6">
              This password reset link is missing or malformed. Request a new one.
            </p>
            <Link href="/forgot-password" className={buttonVariants({ variant: "outline" })}>
              Request a new link
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);
    const newPassword = (fd.get("newPassword") as string) || "";
    const confirmPassword = (fd.get("confirmPassword") as string) || "";
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { email, token, newPassword });
      setDone(true);
      toast.success("Your password has been reset. Log in with your new password.", "Password reset");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
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

        {done ? (
          <div className="text-center py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-8 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Password reset</h1>
            <p className="text-body-sm text-muted-foreground mb-6">
              Redirecting you to login…
            </p>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <KeyRound className="size-7 text-primary" />
              </div>
              <h1 className="text-h1 font-bold mb-2">Choose a new password</h1>
              <p className="text-body-sm text-muted-foreground">
                Resetting the password for {email}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-body-sm font-medium">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-body-sm font-medium">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Repeat new password"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                />
              </div>

              {error && (
                <p className="text-caption text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          </>
        )}
      </Container>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-16 sm:py-20" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
