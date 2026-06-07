"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { api, ApiError } from "@/lib/api";

interface AuthResponse {
  customer: { id: string; name: string; email: string };
}

/** Only allow internal redirect targets (avoid open redirects). */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useUserStore((s) => s.setUser);
  const next = safeNext(params.get("next"));

  const [showPassword, setShowPassword] = useState(false);
  const [pssOptIn, setPssOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};

    const name = (fd.get("name") as string) || "";
    const email = fd.get("email") as string;
    const phone = fd.get("phone") as string;
    const password = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;

    if (!email.includes("@")) newErrors.email = "Enter a valid email address.";
    if (!/^(\+234|0)[789]\d{9}$/.test(phone.replace(/\s/g, "")))
      newErrors.phone = "Enter a valid Nigerian phone number (e.g. 08012345678).";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (password !== confirm) newErrors.confirm = "Passwords do not match.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { customer } = await api.post<AuthResponse>("/api/auth/register", {
        name: name.trim(),
        email,
        phone: phone.replace(/\s/g, ""),
        password,
      });
      setUser({ id: customer.id, email: customer.email, name: customer.name });
      // Phase 3: optionally route to phone OTP verification before continuing.
      router.push(pssOptIn ? "/pay-small-small" : next);
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : "Could not create your account. Please try again." });
      setLoading(false);
    }
  }

  const field = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-body-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors data-[error]:border-destructive"
        {...props}
      />
      {errors[id] && <p className="text-caption text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h1 font-bold mb-2">Create your account</h1>
          <p className="text-body-sm text-muted-foreground">
            Join OCare Phinas to track orders and save on great electronics
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {field("name", "Full name", { type: "text", autoComplete: "name", required: true, placeholder: "Chukwuemeka Anyanwu" })}
          {field("email", "Email address", { type: "email", autoComplete: "email", required: true, placeholder: "you@example.com" })}
          {field("phone", "Phone number (Nigerian)", { type: "tel", autoComplete: "tel", required: true, placeholder: "08012345678" })}

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-body-sm font-medium">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="At least 8 characters"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-caption text-destructive">{errors.password}</p>}
          </div>

          {field("confirm", "Confirm password", { type: "password", autoComplete: "new-password", required: true, placeholder: "Repeat your password" })}

          {/* Pay Small Small opt-in */}
          <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pssOptIn}
                onChange={(e) => setPssOptIn(e.target.checked)}
                className="mt-0.5 rounded border-input text-primary focus:ring-primary flex-shrink-0"
              />
              <div>
                <p className="text-body-sm font-medium">Join a Pay Small Small plan (optional)</p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  Pick any item and pay over time — on a solo plan choose any amount, daily, weekly or monthly, delivered at 50%. You can always start later — shopping works normally without a plan.
                </p>
              </div>
            </label>
          </div>

          {errors.form && (
            <p className="text-caption text-destructive bg-destructive/10 rounded-lg px-3 py-2">{errors.form}</p>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            <UserPlus className="size-4" />
            {loading ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-caption text-muted-foreground text-center">
            By registering you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </form>

        <p className="text-center text-body-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="text-primary font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
        </div>
      </Container>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-12 sm:py-16" />}>
      <RegisterForm />
    </Suspense>
  );
}
