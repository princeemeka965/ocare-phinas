"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Eye, Mail, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { useAdminStore } from "@/store/adminStore";
import { ASSIGNABLE_PERMISSIONS, PERMISSION_META, type AdminPermission } from "@/lib/admin-access";

const INPUT_CLASS =
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";

interface SubAdminRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  disabled: boolean;
  permissions: AdminPermission[];
}

function PermissionToggle({
  perm,
  checked,
  onChange,
}: {
  perm: AdminPermission;
  checked: boolean;
  onChange: () => void;
}) {
  const meta = PERMISSION_META[perm];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
        checked ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex size-5 flex-shrink-0 items-center justify-center rounded-md border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {checked && <Check className="size-3.5" />}
      </span>
      <Icon className="size-4 text-muted-foreground flex-shrink-0" />
      <span className="min-w-0">
        <span className="block text-body-sm font-medium leading-tight">{meta.label}</span>
        <span className="block text-micro text-muted-foreground leading-tight">{meta.description}</span>
      </span>
    </button>
  );
}

export default function AdminTeamPage() {
  const previewAs = useAdminStore((s) => s.previewAs);

  const [subAdmins, setSubAdmins] = useState<SubAdminRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState<AdminPermission[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .get<{ subAdmins: SubAdminRow[] }>("/api/admin/team")
      .then((d) => setSubAdmins(d.subAdmins))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function toggleNewPerm(perm: AdminPermission) {
    setPerms((p) => (p.includes(perm) ? p.filter((x) => x !== perm) : [...p, perm]));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Name, email and a temporary password are required.", "Missing details");
      return;
    }
    if (password.trim().length < 8) {
      toast.error("The temporary password must be at least 8 characters.", "Password too short");
      return;
    }
    if (perms.length === 0) {
      toast.error("Grant at least one area so the sub-admin can do something.", "No permissions");
      return;
    }
    setCreating(true);
    try {
      const { subAdmin } = await api.post<{ subAdmin: SubAdminRow }>("/api/admin/team", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        permissions: perms,
      });
      setSubAdmins((list) => [subAdmin, ...list]);
      toast.success(`${subAdmin.name} can now sign in with the credentials you set.`, "Sub-admin added");
      setName("");
      setEmail("");
      setPassword("");
      setPerms([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create the sub-admin.");
    } finally {
      setCreating(false);
    }
  }

  async function togglePermission(sub: SubAdminRow, perm: AdminPermission) {
    const next = sub.permissions.includes(perm)
      ? sub.permissions.filter((p) => p !== perm)
      : [...sub.permissions, perm];
    // Optimistic update; revert on failure.
    setSubAdmins((list) => list.map((s) => (s.id === sub.id ? { ...s, permissions: next } : s)));
    try {
      await api.patch(`/api/admin/team/${sub.id}`, { permissions: next });
    } catch (err) {
      setSubAdmins((list) => list.map((s) => (s.id === sub.id ? { ...s, permissions: sub.permissions } : s)));
      toast.error(err instanceof ApiError ? err.message : "Couldn't update permissions.");
    }
  }

  async function removeSubAdmin(sub: SubAdminRow) {
    try {
      await api.del(`/api/admin/team/${sub.id}`);
      setSubAdmins((list) => list.filter((s) => s.id !== sub.id));
      toast.info(`${sub.name} removed.`, "Sub-admin removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't remove the sub-admin.");
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-h1 font-bold flex items-center gap-2"><ShieldCheck className="size-6 text-primary" /> Team &amp; permissions</h1>
        <p className="text-muted-foreground mt-1">
          Add sub-admins and choose exactly which areas they can access. When a sub-admin signs in with the credentials you
          create, they only see and can act on the areas you grant — everything else is hidden and blocked.
        </p>
      </div>

      {/* Add sub-admin */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <UserPlus className="size-5 text-primary" />
          <h2 className="text-body font-semibold">Add a sub-admin</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} placeholder="e.g. Ada Obi" />
          </div>
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} placeholder="name@ocarephinas.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-body-sm font-medium">Temporary password</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} placeholder="8+ chars — they change it on first login" />
          </div>
        </div>

        <div>
          <p className="text-body-sm font-medium mb-2">Privileges</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ASSIGNABLE_PERMISSIONS.map((perm) => (
              <PermissionToggle key={perm} perm={perm} checked={perms.includes(perm)} onChange={() => toggleNewPerm(perm)} />
            ))}
          </div>
          <p className="text-micro text-muted-foreground mt-2">Managing the team is reserved for super admins and can&apos;t be granted.</p>
        </div>

        <Button type="submit" disabled={creating} className="gap-2">
          <UserPlus className="size-4" /> {creating ? "Creating…" : "Create sub-admin"}
        </Button>
      </form>

      {/* Existing sub-admins */}
      <div className="space-y-3">
        <h2 className="text-body font-semibold">Sub-admins ({subAdmins.length})</h2>
        {!loaded ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : subAdmins.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-body-sm text-muted-foreground">
            No sub-admins yet. Add one above.
          </div>
        ) : (
          subAdmins.map((sub) => (
            <div key={sub.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold">{sub.name}</p>
                    <p className="text-caption text-muted-foreground flex items-center gap-1.5"><Mail className="size-3" /> {sub.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.disabled && <Badge variant="destructive" className="text-micro">Disabled</Badge>}
                  <Badge variant="secondary" className="text-micro">{sub.permissions.length} area{sub.permissions.length !== 1 ? "s" : ""}</Badge>
                  <button
                    onClick={() => previewAs({ id: sub.id, name: sub.name, email: sub.email, permissions: sub.permissions, createdAt: sub.createdAt })}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border text-caption font-medium hover:bg-muted transition-colors"
                    title="See the admin as this sub-admin sees it"
                  >
                    <Eye className="size-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => removeSubAdmin(sub)}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-destructive/30 text-destructive text-caption font-medium hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                </div>
              </div>

              <p className="text-caption font-medium text-muted-foreground mb-2">Privileges — toggle to grant or revoke</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ASSIGNABLE_PERMISSIONS.map((perm) => (
                  <PermissionToggle
                    key={perm}
                    perm={perm}
                    checked={sub.permissions.includes(perm)}
                    onChange={() => togglePermission(sub, perm)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
