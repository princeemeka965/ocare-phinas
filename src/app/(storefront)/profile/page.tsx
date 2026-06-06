"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Shield, Wallet, ChevronRight, CheckCircle, Save, AlertTriangle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/pay-small-small";
import { arrearsSummary, type PaymentHealth } from "@/lib/payment-health";
import { MOCK_PLANS, planHealth } from "@/lib/my-plans";

/* Mock profile — replace with authenticated fetch in Phase 3 */
const MOCK_PROFILE = {
  name: "Chukwuemeka Anyanwu",
  email: "anyanwue4@gmail.com",
  phone: "08012345678",
  phoneVerified: true,
  plan: {
    type: "solo" as "group" | "solo",
    reference: "SOLO-0042",
    daily: 7000,
    paymentsMade: 28,
    amountSaved: 196000,
    amountTarget: 350000,
  },
};

const INPUT_CLASS =
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const profile = MOCK_PROFILE;

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const planProgress = profile.plan
    ? (profile.plan.amountSaved / profile.plan.amountTarget) * 100
    : 0;

  /* Arrears headline across the customer's plans (shared with the dashboard). */
  const healths = MOCK_PLANS.map((p) => planHealth(p)).filter((h): h is PaymentHealth => h !== null);
  const arrears = arrearsSummary(healths);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-5xl">
        <h1 className="text-h1 font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: identity + plan */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Identity card */}
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary text-h2 font-bold mx-auto mb-4">
                {initials}
              </div>
              <p className="text-body font-semibold">{profile.name}</p>
              <p className="text-body-sm text-muted-foreground break-all">{profile.email}</p>
              {profile.phoneVerified && (
                <span className="inline-flex items-center gap-1 mt-3 rounded-full bg-success/10 px-2.5 py-1 text-micro font-semibold text-success">
                  <CheckCircle className="size-3" /> Phone verified
                </span>
              )}
            </div>

            {/* Arrears alert */}
            {arrears.count > 0 && (
              <Link
                href="/pay-small-small/my-plan"
                className={cn(
                  "block rounded-2xl border p-4 transition-colors",
                  arrears.status === "overdue"
                    ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                    : "border-warning/40 bg-warning/10 hover:border-warning/60",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={cn("size-4 flex-shrink-0 mt-0.5", arrears.status === "overdue" ? "text-destructive" : "text-warning")} />
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold">
                      {arrears.status === "overdue"
                        ? `${naira(arrears.overdueTotal)} overdue`
                        : `${naira(arrears.missedTotal)} behind on payments`}
                    </p>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      Tap to view and pay your outstanding amount.
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Plan tag */}
            {profile.plan && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                    <Wallet className="size-4 text-primary" />
                  </div>
                  <p className="text-body-sm font-semibold">
                    {profile.plan.type === "group" ? `Group #${profile.plan.reference}` : "Solo Plan"}
                  </p>
                </div>
                <p className="text-caption text-muted-foreground mb-3">
                  {profile.plan.paymentsMade} payments · ₦{profile.plan.daily.toLocaleString("en-NG")}/day · ₦{profile.plan.amountSaved.toLocaleString("en-NG")} of ₦{profile.plan.amountTarget.toLocaleString("en-NG")}
                </p>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${planProgress}%` }}
                  />
                </div>
                <Link
                  href="/pay-small-small/my-plan"
                  className="flex items-center justify-between gap-1.5 text-body-sm text-primary font-medium hover:underline"
                >
                  View my plan <ChevronRight className="size-4" />
                </Link>
              </div>
            )}
          </aside>

          {/* Main: forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal info */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <User className="size-5 text-primary" />
                <h2 className="text-body font-semibold">Personal information</h2>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium">Full name</label>
                    <input type="text" defaultValue={profile.name} className={INPUT_CLASS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium">Email address</label>
                    <input type="email" defaultValue={profile.email} className={INPUT_CLASS} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <label className="text-body-sm font-medium">Phone number</label>
                      {profile.phoneVerified && (
                        <span className="flex items-center gap-1 text-micro font-semibold text-success">
                          <CheckCircle className="size-3" /> Verified
                        </span>
                      )}
                    </div>
                    <input type="tel" defaultValue={profile.phone} className={INPUT_CLASS} />
                    {profile.phoneVerified && (
                      <p className="text-caption text-muted-foreground">
                        Changing your phone number requires re-verification.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" size="sm" className="gap-2" disabled={saving}>
                    <Save className="size-4" />
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                  {saved && (
                    <span className="flex items-center gap-1.5 text-caption text-success font-medium">
                      <CheckCircle className="size-3.5" /> Saved
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Security */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="size-5 text-primary" />
                <h2 className="text-body font-semibold">Security</h2>
              </div>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-body-sm font-medium">Current password</label>
                    <input type="password" placeholder="••••••••" className={INPUT_CLASS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium">New password</label>
                    <input type="password" placeholder="At least 8 characters" className={INPUT_CLASS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium">Confirm new password</label>
                    <input type="password" placeholder="Repeat new password" className={INPUT_CLASS} />
                  </div>
                </div>
                <Button type="submit" size="sm" variant="outline">Change password</Button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
