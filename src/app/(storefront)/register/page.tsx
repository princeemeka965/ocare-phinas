"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, UserPlus, MailCheck, ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { WELCOME_KEY } from "@/components/storefront/welcome-modal";
import { api, ApiError } from "@/lib/api";

interface AuthResponse {
  customer: { id: string; name: string; email: string };
}

interface OtpResponse {
  ok: boolean;
  devCode?: string;
}

interface PendingRegistration {
  name: string;
  email: string;
  phone: string;
  password: string;
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Two-phase sign-up: collect details → verify the emailed code → create account.
  // `pending` drives the code phase; `draft` survives "Change details" so the
  // form re-renders with what the customer already typed.
  const [pending, setPending] = useState<PendingRegistration | null>(null);
  const [draft, setDraft] = useState<PendingRegistration | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function handleDetails(e: React.FormEvent<HTMLFormElement>) {
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

    const data: PendingRegistration = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\s/g, ""),
      password,
    };

    setErrors({});
    setLoading(true);
    try {
      const res = await api.post<OtpResponse>("/api/auth/register", data);
      setDraft(data);
      setPending(data);
      setDevCode(res.devCode ?? null);
      setCode("");
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : "Could not start sign-up. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pending) return;
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: "Enter the 6-digit code we emailed you." });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { customer } = await api.post<AuthResponse>("/api/auth/register/verify", { ...pending, code });
      setUser({ id: customer.id, email: customer.email, name: customer.name });
      // Greet the new customer with a one-time welcome banner on the next page.
      sessionStorage.setItem(WELCOME_KEY, customer.name.trim().split(" ")[0] || "");
      router.push(next);
    } catch (err) {
      setErrors({ code: err instanceof ApiError ? err.message : "Could not verify the code. Please try again." });
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pending) return;
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post<OtpResponse>("/api/auth/register", pending);
      setDevCode(res.devCode ?? null);
    } catch (err) {
      setErrors({ code: err instanceof ApiError ? err.message : "Could not resend the code. Please try again." });
    } finally {
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

  // ---- Phase 2: verify the emailed code ----------------------------------
  if (pending) {
    return (
      <div className="py-12 sm:py-16">
        <Container>
          <div className="mx-auto w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="size-6 text-primary" />
              </div>
              <h1 className="text-h1 font-bold mb-2">Check your email</h1>
              <p className="text-body-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{pending.email}</span>. Enter
                it below to finish creating your account.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="code" className="text-body-sm font-medium">
                  Verification code
                </label>
                <input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full h-12 px-3 rounded-lg border border-input bg-background text-center text-h3 tracking-[0.5em] placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                />
                {errors.code && <p className="text-caption text-destructive">{errors.code}</p>}
                {devCode && (
                  <p className="text-caption text-muted-foreground">
                    Dev: your code is <span className="font-mono font-medium">{devCode}</span>
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                <MailCheck className="size-4" />
                {loading ? "Verifying…" : "Verify & create account"}
              </Button>

              <div className="flex items-center justify-between text-body-sm">
                <button
                  type="button"
                  onClick={() => {
                    setPending(null);
                    setErrors({});
                  }}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Change details
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-primary font-medium hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          </div>
        </Container>
      </div>
    );
  }

  // ---- Phase 1: collect details ------------------------------------------
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

        <form onSubmit={handleDetails} className="space-y-4" noValidate>
          {field("name", "Full name", { type: "text", autoComplete: "name", required: true, placeholder: "John Doe", defaultValue: draft?.name })}
          {field("email", "Email address", { type: "email", autoComplete: "email", required: true, placeholder: "name@email.com", defaultValue: draft?.email })}
          {field("phone", "Phone number (Nigerian)", { type: "tel", autoComplete: "tel", required: true, placeholder: "0800 000 0000", defaultValue: draft?.phone })}

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-body-sm font-medium">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                defaultValue={draft?.password}
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

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-body-sm font-medium">Confirm password</label>
            <div className="relative">
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                defaultValue={draft?.password}
                placeholder="Repeat your password"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirm && <p className="text-caption text-destructive">{errors.confirm}</p>}
          </div>

          {errors.form && (
            <p className="text-caption text-destructive bg-destructive/10 rounded-lg px-3 py-2">{errors.form}</p>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            <UserPlus className="size-4" />
            {loading ? "Sending code…" : "Create account"}
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
