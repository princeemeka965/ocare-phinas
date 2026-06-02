"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle, Eye, Search, ShieldCheck, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import type { Customer } from "@/lib/customers";

const PLAN_ICON = { solo: User, group: Users } as const;

export function CustomersList({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [blocked, setBlocked] = useState<Record<string, boolean>>(
    () => Object.fromEntries(customers.map((c) => [c.id, c.blocked])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) =>
        [c.name, c.email, c.phone].some((v) => v.toLowerCase().includes(q)),
      )
    : customers;

  async function toggleBlock(c: Customer) {
    setBusy(c.id);
    const next = !blocked[c.id];
    // Phase 3: PATCH /api/admin/customers/:id { blocked: next }
    await new Promise((r) => setTimeout(r, 500));
    setBlocked((b) => ({ ...b, [c.id]: next }));
    setBusy(null);
    if (next) toast.info(`${c.name} has been blocked.`, "Customer blocked");
    else toast.success(`${c.name} has been unblocked.`, "Customer unblocked");
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-body-sm text-muted-foreground">
          No customers match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isBlocked = blocked[c.id];
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-2xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors",
                  isBlocked ? "border-destructive/30" : "border-border",
                )}
              >
                {/* Identity + plans */}
                <div className="flex items-center gap-3 sm:w-60 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-body-sm font-semibold truncate">{c.name}</p>
                      {c.verified && <ShieldCheck className="size-3.5 text-success flex-shrink-0" aria-label="Verified" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.plans.length === 0 ? (
                        <span className="text-micro text-muted-foreground">No plan</span>
                      ) : (
                        c.plans.map((p) => {
                          const Icon = PLAN_ICON[p.type];
                          return (
                            <Badge key={p.reference} variant="secondary" className="text-micro gap-1">
                              <Icon className="size-3" />{p.type === "solo" ? "Solo" : "Group"} · {p.reference}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="text-caption text-muted-foreground sm:flex-1 min-w-0">
                  <p className="truncate">{c.email}</p>
                  <p>{c.phone}</p>
                </div>

                {/* Orders + status */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                  <span className="text-caption text-muted-foreground"><span className="font-semibold text-foreground">{c.orderCount}</span> orders</span>
                  {isBlocked && <Badge variant="destructive" className="text-micro">Blocked</Badge>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-shrink-0 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border text-body-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Eye className="size-4" /> View
                  </Link>
                  <button
                    onClick={() => toggleBlock(c)}
                    disabled={busy === c.id}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-body-sm font-medium transition-colors disabled:opacity-60",
                      isBlocked
                        ? "border border-success/30 text-success hover:bg-success/10"
                        : "border border-destructive/30 text-destructive hover:bg-destructive/10",
                    )}
                  >
                    {isBlocked ? <><CheckCircle className="size-4" /> Unblock</> : <><Ban className="size-4" /> Block</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
