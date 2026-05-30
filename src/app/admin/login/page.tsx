"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Phase 3: verify admin credentials server-side, check profiles.role = admin
    await new Promise((r) => setTimeout(r, 800));
    setError("Invalid credentials.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <h1 className="text-h2 font-bold">Admin Login</h1>
          <p className="text-body-sm text-muted-foreground mt-1">OCare Phinas — Super Admin</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-body-sm font-medium">Email address</label>
              <input id="email" type="email" autoComplete="email" required placeholder="admin@ocared.com"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-body-sm font-medium">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="••••••••"
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
        </div>
        <p className="text-center text-caption text-muted-foreground mt-6">Admin access only. Unauthorized access is prohibited.</p>
      </div>
    </div>
  );
}
