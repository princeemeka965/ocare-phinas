"use client";

import { useState } from "react";
import { UserCog, Shield, KeyRound, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/store/toastStore";
import { useAdminStore } from "@/store/adminStore";
import { PERMISSION_META } from "@/lib/admin-access";

const INPUT_CLASS =
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";

export default function AdminAccountPage() {
  const current = useAdminStore((s) => s.current);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const initials = current.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw.trim() || !newPw.trim() || !confirmPw.trim()) {
      toast.error("Fill in all password fields.", "Missing details");
      return;
    }
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters.", "Too short");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New password and confirmation don't match.", "Mismatch");
      return;
    }
    setSaving(true);
    // Phase 3: PATCH /api/admin/me/password { currentPassword, newPassword } —
    // verifies the current password server-side before updating the hash.
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    toast.success("Your password has been updated.", "Password changed");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-h1 font-bold flex items-center gap-2"><UserCog className="size-6 text-primary" /> My account</h1>
        <p className="text-muted-foreground mt-1">Your admin profile and password.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity + access */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary text-h3 font-bold mx-auto mb-3">
              {initials}
            </div>
            <p className="text-body font-semibold">{current.name}</p>
            <p className="text-body-sm text-muted-foreground break-all">{current.email}</p>
            <Badge variant={current.role === "super" ? "default" : "secondary"} className="text-micro mt-3">
              {current.role === "super" ? "Super Admin" : "Sub-admin"}
            </Badge>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-4 text-primary" />
              <h2 className="text-body-sm font-semibold">Your access</h2>
            </div>
            {current.role === "super" ? (
              <p className="text-caption text-muted-foreground">Full access to every area of the admin.</p>
            ) : current.permissions.length === 0 ? (
              <p className="text-caption text-muted-foreground">No areas granted yet. Ask a super admin for access.</p>
            ) : (
              <ul className="space-y-1.5">
                {current.permissions.map((perm) => (
                  <li key={perm} className="flex items-center gap-2 text-body-sm">
                    <CheckCircle className="size-3.5 text-success flex-shrink-0" />
                    {PERMISSION_META[perm].label}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-micro text-muted-foreground mt-3">Only a super admin can change what you can access.</p>
          </div>
        </div>

        {/* Change password */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="size-5 text-primary" />
              <h2 className="text-body font-semibold">Change password</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-body-sm font-medium">Current password</label>
                <input type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" className={INPUT_CLASS} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium">New password</label>
                  <input type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" className={INPUT_CLASS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium">Confirm new password</label>
                  <input type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" className={INPUT_CLASS} />
                </div>
              </div>
              <Button type="submit" size="sm" className="gap-2" disabled={saving}>
                <KeyRound className="size-4" /> {saving ? "Updating…" : "Update password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
