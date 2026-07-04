"use client";

import { useState } from "react";
import Link from "next/link";
import { Sun, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSolarStore } from "@/store/solarStore";
import { naira } from "@/lib/pay-small-small";
import { SOLAR_STATUS_META, type SolarApplicationStatus } from "@/lib/solar";

type TabKey = "all" | "under_review" | "not_approved" | "in_progress" | "completed";

const TABS: { key: TabKey; label: string; match: (s: SolarApplicationStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "under_review", label: "Under review", match: (s) => s === "under_review" },
  { key: "not_approved", label: "Not approved", match: (s) => s === "not_approved" },
  {
    key: "in_progress",
    label: "In progress",
    match: (s) => ["approved_awaiting_deposit", "installation_processing", "installation_scheduled", "active_repayment"].includes(s),
  },
  { key: "completed", label: "Completed / defaulted", match: (s) => s === "completed" || s === "defaulted" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function SolarApplicationsBoard() {
  const applications = useSolarStore((s) => s.applications);
  const packages = useSolarStore((s) => s.packages);
  const [tab, setTab] = useState<TabKey>("all");

  const activeTab = TABS.find((t) => t.key === tab)!;
  const rows = applications.filter((a) => activeTab.match(a.status));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => {
          const count = applications.filter((a) => t.match(a.status)).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors",
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {t.label}
              <span className={cn("text-micro tabular-nums", tab === t.key ? "text-primary-foreground/80" : "text-muted-foreground/70")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <Sun className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-body-sm text-muted-foreground">No applications in this view.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((app) => {
              const pkg = packages.find((p) => p.id === app.packageId);
              const meta = SOLAR_STATUS_META[app.status];
              return (
                <Link
                  key={app.id}
                  href={`/admin/solar/${app.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0 text-caption">
                    {app.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold truncate">{app.customerName}</p>
                    <p className="text-caption text-muted-foreground font-mono">{app.reference} · {pkg?.name ?? "—"}</p>
                  </div>
                  <p className="text-caption text-muted-foreground hidden sm:block flex-shrink-0">Applied {formatDate(app.createdAt)}</p>
                  <p className="text-body-sm font-semibold flex-shrink-0 hidden sm:block">{naira(pkg?.totalAmount ?? 0)}</p>
                  <Badge variant={meta.badge} className="text-micro flex-shrink-0">{meta.label}</Badge>
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
