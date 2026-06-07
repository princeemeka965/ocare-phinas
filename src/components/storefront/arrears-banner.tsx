"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Clock } from "lucide-react";

import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { isMinimalChrome } from "@/lib/chrome-routes";
import { naira } from "@/lib/pay-small-small";
import { arrearsSummary, isArrears, type PaymentHealth } from "@/lib/payment-health";

/* Colours fixed against the dark banner so red (overdue) and gold (missed)
   read clearly regardless of the active theme. */
const OVERDUE_TEXT = "text-[oklch(0.74_0.19_25)]";
const MISSED_TEXT = "text-[oklch(0.84_0.15_85)]";

interface ApiPlan {
  id: string;
  productName: string | null;
  health: PaymentHealth | null;
}

interface ArrearsItem {
  id: string;
  productName: string;
  overdue: boolean;
  amount: number;
  daysOverdue: number;
}

/**
 * A thin, scrolling banner pinned above the header. The moment a signed-in
 * customer has a missed or overdue Pay Small Small payment, it strolls the
 * amounts owed across the top — each item naming the product, with OVERDUE
 * (red) clearly distinguished from MISSED (gold). Hidden when nothing is
 * owed, on auth / focused flows, and before the plans load.
 */
export function ArrearsBanner() {
  const user = useUserStore((s) => s.user);
  const pathname = usePathname();
  const [plans, setPlans] = useState<ApiPlan[]>([]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ plans: ApiPlan[] }>("/api/me/plans")
      .then((d) => setPlans(d.plans))
      .catch(() => setPlans([]));
  }, [user]);

  if (!user || isMinimalChrome(pathname)) return null;

  /* One item per plan in arrears — overdue first, then missed. */
  const items: ArrearsItem[] = plans
    .filter((p) => p.health !== null && isArrears(p.health.status))
    .map((p) => ({
      id: p.id,
      productName: p.productName ?? "Your plan",
      overdue: p.health!.status === "overdue",
      amount: p.health!.arrears,
      daysOverdue: p.health!.daysOverdue,
    }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue));

  if (items.length === 0) return null;

  const summary = arrearsSummary(
    plans.map((p) => p.health).filter((h): h is PaymentHealth => h !== null),
  );
  const hasOverdue = summary.overdueTotal > 0;

  /* The scrolling row of items, factored out so we can render it twice for a
     seamless loop. */
  const track = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item) => (
        <span key={item.id} className="flex items-center gap-1.5 whitespace-nowrap text-caption">
          {item.overdue ? (
            <AlertTriangle className={`size-3.5 ${OVERDUE_TEXT}`} />
          ) : (
            <Clock className={`size-3.5 ${MISSED_TEXT}`} />
          )}
          <span className={`font-bold uppercase tracking-wide ${item.overdue ? OVERDUE_TEXT : MISSED_TEXT}`}>
            {item.overdue ? "Overdue" : "Missed"}
          </span>
          <span className="text-white/85">
            · {item.productName} · <span className="font-semibold text-white">{naira(item.amount)}</span>{" "}
            {item.overdue ? `past due (${item.daysOverdue}d)` : "behind"}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <Link
      href="/pay-small-small/my-plan"
      aria-label={`You owe ${naira(summary.total)} — ${naira(summary.overdueTotal)} overdue and ${naira(summary.missedTotal)} missed. View your plan.`}
      className="group relative block overflow-hidden bg-[oklch(0.24_0.03_265)] text-white"
    >
      <div className="flex items-center">
        {/* Fixed label */}
        <span className="z-10 flex flex-shrink-0 items-center gap-1.5 bg-black/25 px-3 py-1.5 text-caption font-bold uppercase tracking-wide">
          {hasOverdue ? <AlertTriangle className={`size-3.5 ${OVERDUE_TEXT}`} /> : <Clock className={`size-3.5 ${MISSED_TEXT}`} />}
          Payments due
        </span>

        {/* Scrolling track — content duplicated for a seamless loop */}
        <div aria-hidden className="flex-1 overflow-hidden py-1.5">
          <div className="flex w-max animate-[marquee_32s_linear_infinite] group-hover:[animation-play-state:paused]">
            {track}
            {track}
          </div>
        </div>

        {/* Fixed total + CTA */}
        <span className="z-10 hidden flex-shrink-0 items-center gap-1.5 bg-black/25 px-3 py-1.5 text-caption font-bold sm:flex">
          <span className={hasOverdue ? OVERDUE_TEXT : MISSED_TEXT}>{naira(summary.total)}</span>
          <span className="text-white/70">· View plan →</span>
        </span>
      </div>
    </Link>
  );
}
