"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Shield, Wallet, ChevronRight, CheckCircle, Save, AlertTriangle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";
import { naira, SOLO_DELIVERY_THRESHOLD } from "@/lib/pay-small-small";
import { arrearsSummary, type PaymentHealth } from "@/lib/payment-health";

interface MeCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
}

interface ApiPlan {
  id: string;
  type: "solo" | "group" | "outright";
  reference: string | null;
  perPayment: number;
  productPrice: number;
  amountAllocated: number;
  status: string;
  health: PaymentHealth | null;
}

const INPUT_CLASS =
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";

export default function ProfilePage() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [me, setMe] = useState<MeCustomer | null>(null);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ customer: MeCustomer | null }>("/api/auth/me")
      .then((d) => {
        if (d.customer) {
          setMe(d.customer);
          setForm({ name: d.customer.name, email: d.customer.email, phone: d.customer.phone });
        }
      })
      .catch(() => {});
    api.get<{ plans: ApiPlan[] }>("/api/me/plans").then((d) => setPlans(d.plans)).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <AuthRequired
        title="Log in to see your profile"
        description="Sign in to manage your details and Pay Small Small plans."
      />
    );
  }

  if (!me) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-5xl">
          <div className="h-8 w-40 rounded bg-muted animate-pulse mb-8" />
          <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
        </Container>
      </div>
    );
  }

  const initials = me.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const plan = plans.find((p) => p.status === "active" || p.status === "delivered" || p.status === "processing") ?? null;
  const planProgress = plan ? Math.min(100, (plan.amountAllocated / plan.productPrice) * 100) : 0;

  const healths = plans.map((p) => p.health).filter((h): h is PaymentHealth => h !== null);
  const arrears = arrearsSummary(healths);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { customer } = await api.patch<{ customer: MeCustomer }>("/api/auth/me", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setMe(customer);
      updateUser({ name: customer.name, email: customer.email });
      toast.success("Your profile has been updated.", "Saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New password and confirmation don't match.");
      return;
    }
    setChangingPassword(true);
    try {
      await api.patch("/api/auth/me/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Your password has been changed.", "Saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't change your password.");
    } finally {
      setChangingPassword(false);
    }
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
              <p className="text-body font-semibold">{me.name}</p>
              <p className="text-body-sm text-muted-foreground break-all">{me.email}</p>
              {me.phoneVerified && (
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
            {plan && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                    <Wallet className="size-4 text-primary" />
                  </div>
                  <p className="text-body-sm font-semibold">
                    {plan.type === "group" ? `Group ${plan.reference ?? ""}` : "Solo Plan"}
                  </p>
                </div>
                <p className="text-caption text-muted-foreground mb-3">
                  ₦{plan.perPayment.toLocaleString("en-NG")}/payment · ₦{plan.amountAllocated.toLocaleString("en-NG")} of ₦{plan.productPrice.toLocaleString("en-NG")}
                  {plan.type === "solo" && ` · delivers at ${naira(plan.productPrice * SOLO_DELIVERY_THRESHOLD)}`}
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
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium">Email address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <label className="text-body-sm font-medium">Phone number</label>
                      {me.phoneVerified && (
                        <span className="flex items-center gap-1 text-micro font-semibold text-success">
                          <CheckCircle className="size-3" /> Verified
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                    <p className="text-caption text-muted-foreground">
                      Changing your phone number requires re-verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" size="sm" className="gap-2" disabled={saving}>
                    <Save className="size-4" />
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Security */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="size-5 text-primary" />
                <h2 className="text-body font-semibold">Security</h2>
              </div>
              <form className="space-y-4" onSubmit={handleChangePassword}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-body-sm font-medium">Current password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium">New password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium">Confirm new password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Repeat new password"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" variant="outline" disabled={changingPassword}>
                  {changingPassword ? "Changing…" : "Change password"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
