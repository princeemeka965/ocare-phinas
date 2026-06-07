"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

import { useAdminStore } from "@/store/adminStore";
import { landingRoute, type AdminAccount } from "@/lib/admin-access";
import { api, ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAdminStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { admin } = await api.post<{ admin: AdminAccount }>("/api/admin/login", { email, password });
      setSession(admin);
      router.push(landingRoute(admin));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <h1 className="text-h2 font-bold">Admin Login</h1>
          <p className="text-body-sm text-muted-foreground mt-1">OCare Phinas — Super admins &amp; sub-admins</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-body-sm font-medium">Email address</label>
              <input id="email" type="email" autoComplete="email" required placeholder="admin@ocarephinas.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-body-sm font-medium">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-caption text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-white font-semibold text-body-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          {/* Seeded super admin — remove before production. */}
          <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-micro text-muted-foreground space-y-0.5">
            <p className="font-semibold text-foreground/70">Seeded super admin</p>
            <p><span className="font-mono">admin@ocarephinas.com</span> · password from <span className="font-mono">SEED_ADMIN_PASSWORD</span></p>
            <p>Create sub-admins from Team &amp; permissions after signing in.</p>
          </div>
        </div>
        <p className="text-center text-caption text-muted-foreground mt-6">Admin access only. Unauthorized access is prohibited.</p>
      </div>
    </div>
  );
}
