"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Shield, Wallet, ChevronRight, CheckCircle, Save } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* Mock profile — replace with authenticated fetch in Phase 3 */
const MOCK_PROFILE = {
  name: "Chukwuemeka Anyanwu",
  email: "anyanwue4@gmail.com",
  phone: "08012345678",
  phoneVerified: true,
  plan: {
    type: "group" as const,
    reference: "G-013",
    dayCurrent: 12,
    dayTotal: 50,
    amountSaved: 12000,
    amountTarget: 50000,
  },
};

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const profile = MOCK_PROFILE;

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
      <Container className="max-w-2xl">
        <h1 className="text-h1 font-bold mb-8">My Profile</h1>

        <div className="space-y-5">
          {/* Plan tag */}
          {profile.plan && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Wallet className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold">
                      Pay Small Small — {profile.plan.type === "group" ? `Group #${profile.plan.reference}` : "Solo Plan"}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Day {profile.plan.dayCurrent} / {profile.plan.dayTotal} · ₦{profile.plan.amountSaved.toLocaleString("en-NG")} saved of ₦{profile.plan.amountTarget.toLocaleString("en-NG")}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 w-48 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(profile.plan.amountSaved / profile.plan.amountTarget) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Link
                  href="/pay-small-small/my-plan"
                  className="flex items-center gap-1.5 text-body-sm text-primary font-medium hover:underline flex-shrink-0"
                >
                  View my plan <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          )}

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
                  <input
                    type="text"
                    defaultValue={profile.name}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium">Email address</label>
                  <input
                    type="email"
                    defaultValue={profile.email}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-body-sm font-medium">Phone number</label>
                    {profile.phoneVerified && (
                      <span className="flex items-center gap-1 text-micro font-semibold text-success">
                        <CheckCircle className="size-3" /> Verified
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    defaultValue={profile.phone}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
                  />
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
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium">Current password</label>
                  <input type="password" placeholder="••••••••" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors" />
                </div>
                <div />
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium">New password</label>
                  <input type="password" placeholder="At least 8 characters" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium">Confirm new password</label>
                  <input type="password" placeholder="Repeat new password" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors" />
                </div>
              </div>
              <Button type="submit" size="sm" variant="outline">Change password</Button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
