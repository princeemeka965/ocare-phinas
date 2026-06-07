"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, GitFork, Settings,
  ShieldCheck, LogOut, Menu, X, ChevronRight, AlertTriangle, Lock, Eye, UserCog, Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/adminStore";
import { hasPermission, permissionForPath, PERMISSION_META, type AdminAccount, type AdminPermission } from "@/lib/admin-access";
import { api } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission: AdminPermission;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: "dashboard" }] },
  { label: "Catalog", items: [
    { label: "Products", href: "/admin/products", icon: Package, permission: "products" },
    { label: "Categories & Brands", href: "/admin/categories", icon: Tag, permission: "categories" },
  ]},
  { label: "Orders", items: [
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag, permission: "orders" },
  ]},
  { label: "Customers", items: [{ label: "Customers", href: "/admin/customers", icon: Users, permission: "customers" }] },
  { label: "Pay Small Small", items: [
    { label: "Groups", href: "/admin/groups", icon: GitFork, permission: "groups" },
    { label: "Arrears", href: "/admin/arrears", icon: AlertTriangle, permission: "arrears" },
  ]},
  { label: "System", items: [
    { label: "Team & permissions", href: "/admin/team", icon: ShieldCheck, permission: "team" },
    { label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings" },
  ]},
];

export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const status = useAdminStore((s) => s.status);
  const current = useAdminStore((s) => s.current);
  const previewing = useAdminStore((s) => s.previewing);
  const exitPreview = useAdminStore((s) => s.exitPreview);
  const setSession = useAdminStore((s) => s.setSession);
  const clearSession = useAdminStore((s) => s.clearSession);

  /* Hydrate the admin session from the cookie on mount. */
  useEffect(() => {
    let active = true;
    api
      .get<{ admin: AdminAccount | null }>("/api/admin/me")
      .then((d) => { if (active) (d.admin ? setSession(d.admin) : clearSession()); })
      .catch(() => { if (active) clearSession(); });
    return () => { active = false; };
  }, [setSession, clearSession]);

  /* Not signed in → go to the admin login. */
  useEffect(() => {
    if (status === "guest") router.replace("/admin/login");
  }, [status, router]);

  async function logout() {
    await api.post("/api/admin/logout").catch(() => {});
    clearSession();
    router.replace("/admin/login");
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!current) return null; // guest — redirect effect handles navigation

  /* Only sections with at least one permitted item are shown. */
  const sections = NAV_SECTIONS
    .map((section) => ({ ...section, items: section.items.filter((i) => hasPermission(current, i.permission)) }))
    .filter((section) => section.items.length > 0);

  /* Route-level guard: block areas the current admin cannot access. */
  const required = permissionForPath(pathname);
  const allowed = required === null || hasPermission(current, required);
  const initials = current.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-60 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-border">
          <span className="text-body font-bold text-primary">OCare Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Close sidebar">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-micro font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1.5">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm font-medium transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                      aria-current={active ? "page" : undefined}>
                      <Icon className="size-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <Link
            href="/admin/account"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm font-medium transition-colors",
              pathname === "/admin/account" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <UserCog className="size-4" /> My account
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card/95 backdrop-blur-sm px-5 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Open sidebar">
            <Menu className="size-5" />
          </button>
          <nav className="flex items-center gap-1 text-body-sm text-muted-foreground" aria-label="Admin breadcrumb">
            <span>Admin</span>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium capitalize">
              {pathname.split("/").filter(Boolean).slice(1).join(" / ") || "Dashboard"}
            </span>
          </nav>
          <Link href="/admin/account" className="ml-auto flex items-center gap-3 rounded-lg px-1.5 py-1 -mr-1.5 hover:bg-muted transition-colors" title="My account">
            <div className="text-right hidden sm:block leading-tight">
              <p className="text-caption font-medium text-foreground">{current.name}</p>
              <p className="text-micro text-muted-foreground">{current.role === "super" ? "Super Admin" : "Sub-admin"}</p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-caption">{initials}</div>
          </Link>
        </header>

        {/* Preview banner — super admin viewing a sub-admin's restricted access */}
        {previewing && (
          <div className="flex items-center gap-2 bg-accent/15 border-b border-accent/30 px-5 py-2 text-caption">
            <Eye className="size-3.5 text-accent-foreground/80 flex-shrink-0" />
            <span className="text-foreground">
              Previewing as <strong>{current.name}</strong> — you only see what this sub-admin can access.
            </span>
            <button onClick={exitPreview} className="ml-auto font-semibold text-primary hover:underline">Exit preview</button>
          </div>
        )}

        <main className="flex-1 p-5 sm:p-8">
          {allowed ? (
            children
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                  <Lock className="size-6 text-muted-foreground" />
                </div>
                <h2 className="text-h3 font-semibold">No access to this area</h2>
                <p className="text-body-sm text-muted-foreground mt-1.5">
                  Your account doesn&apos;t have permission to view{" "}
                  <span className="font-medium">{required ? PERMISSION_META[required].label : "this page"}</span>.
                  Ask a super admin to grant it under Team &amp; permissions.
                </p>
                {previewing && (
                  <button onClick={exitPreview} className="mt-4 text-body-sm font-semibold text-primary hover:underline">Exit preview</button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
