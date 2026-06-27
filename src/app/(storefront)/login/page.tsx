"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { api, ApiError } from "@/lib/api";

interface AuthResponse {
  customer: { id: string; name: string; email: string };
}

/** Only allow internal redirect targets (avoid open redirects). */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useUserStore((s) => s.setUser);
  const next = safeNext(params.get("next"));

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const emailOrPhone = ((fd.get("email") as string) || "").trim();
    const password = (fd.get("password") as string) || "";
    try {
      const { customer } = await api.post<AuthResponse>("/api/auth/login", { emailOrPhone, password });
      setUser({ id: customer.id, email: customer.email, name: customer.name });
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="py-16 sm:py-20">
      <Container className="max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h1 font-bold mb-2">Welcome back</h1>
          <p className="text-body-sm text-muted-foreground">
            Log in to your OCare Phinas account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-body-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@email.com"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-body-sm font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-caption text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
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

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" />
            <span className="text-body-sm text-muted-foreground">Remember me</span>
          </label>

          {error && (
            <p className="text-caption text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            <LogIn className="size-4" />
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="text-center text-body-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href={next !== "/" ? `/register?next=${encodeURIComponent(next)}` : "/register"}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-16 sm:py-20" />}>
      <LoginForm />
    </Suspense>
  );
}
