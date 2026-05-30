"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Tag, ShoppingBag, CreditCard, Users,
  Wallet, GitFork, Settings, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }] },
  { label: "Catalog", items: [
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories & Brands", href: "/admin/categories", icon: Tag },
  ]},
  { label: "Orders", items: [
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Payments Queue", href: "/admin/payments", icon: CreditCard },
  ]},
  { label: "Customers", items: [{ label: "Customers", href: "/admin/customers", icon: Users }] },
  { label: "Pay Small Small", items: [
    { label: "Groups", href: "/admin/groups", icon: GitFork },
    { label: "Contributions", href: "/admin/contributions", icon: Wallet },
  ]},
  { label: "System", items: [{ label: "Settings", href: "/admin/settings", icon: Settings }] },
];

export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-60 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-border">
          <span className="text-body font-bold text-primary">OCare Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Close sidebar">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_SECTIONS.map((section) => (
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

        <div className="px-3 py-4 border-t border-border">
          <Link href="/admin/login" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="size-4" /> Log out
          </Link>
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
          <div className="ml-auto flex items-center gap-3">
            <span className="text-caption text-muted-foreground hidden sm:block">Super Admin</span>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-caption">A</div>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
