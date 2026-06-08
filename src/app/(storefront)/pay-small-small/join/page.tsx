"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, ArrowLeft, ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { SLOT_DAILY, CYCLE_DAYS, SLOT_CYCLE_VALUE, GROUP_PRICE_CAP, isPlanOngoing, naira } from "@/lib/pay-small-small";
import { ActivePlanNotice } from "@/components/storefront/active-plan-notice";

interface Group {
  id: string;
  reference: string;
  name: string;
  totalSlots: number;
  slotsFilled: number;
  cycleLengthDays: number;
  slotsAvailable: number;
}

/** Minimal shape of a plan from /api/me/plans, for the one-group-at-a-time cap. */
interface MyPlan {
  type: "solo" | "group";
  status: string;
  productName: string | null;
}

function JoinGroupInner() {
  const params = useSearchParams();
  const itemQuery = params.toString();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [myPlans, setMyPlans] = useState<MyPlan[] | null>(null);

  useEffect(() => {
    api
      .get<{ groups: Group[] }>("/api/groups")
      .then((d) => setGroups(d.groups))
      .catch(() => setGroups([]));
    api
      .get<{ plans: MyPlan[] }>("/api/me/plans")
      .then((d) => setMyPlans(d.plans))
      .catch(() => setMyPlans([]));
  }, []);

  /* One group at a time (§1) — block browsing-to-join when already in one. */
  const ongoingGroup = myPlans?.find((p) => p.type === "group" && isPlanOngoing(p.status)) ?? null;
  if (ongoingGroup) {
    return <ActivePlanNotice type="group" productName={ongoingGroup.productName} />;
  }

  /* Carry any deep-linked item (from a product page) through to the confirm step. */
  const joinHref = (id: string) =>
    itemQuery ? `/pay-small-small/join/${id}?${itemQuery}` : `/pay-small-small/join/${id}`;

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-4xl">
        <Link href="/pay-small-small" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Pay Small Small
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <h1 className="text-h1 font-bold">Join a Group</h1>
          </div>
          <p className="text-body-sm text-muted-foreground">
            Each slot is {naira(SLOT_DAILY)}/day for {CYCLE_DAYS} days ({naira(SLOT_CYCLE_VALUE)} a cycle). Take 1 or 2 slots
            and receive your item in position order. Group plans cover items up to {naira(GROUP_PRICE_CAP)}.
          </p>
        </div>

        {groups === null ? (
          <div className="space-y-4 mb-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-4 mb-8">
            {groups.map((group) => {
              const slotsLeft = group.slotsAvailable;
              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-body font-bold font-mono">{group.reference}</span>
                        <Badge variant="success" className="text-micro">Open</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-body-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {group.slotsFilled}/{group.totalSlots} slots
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-caption text-muted-foreground">
                        <span>{naira(SLOT_DAILY)}/day per slot</span>
                        <span>·</span>
                        <span>{group.cycleLengthDays} days</span>
                        <span>·</span>
                        <span>{naira(SLOT_CYCLE_VALUE)} per slot/cycle</span>
                      </div>

                      {/* Slot fill bar */}
                      <div className="mt-3 flex gap-1">
                        {Array.from({ length: group.totalSlots }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-2 flex-1 rounded-full",
                              i < group.slotsFilled ? "bg-primary" : "bg-muted",
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-caption text-primary font-medium mt-1.5">
                        {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <Link href={joinHref(group.id)} className={cn(buttonVariants(), "gap-2")}>
                        Join <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center mb-8">
            <p className="text-h3 font-semibold mb-2">No open groups right now</p>
            <p className="text-body-sm text-muted-foreground mb-5">
              All groups are currently full. A solo plan has no waiting and no price cap — pick any item and start today.
            </p>
            <Link href="/pay-small-small/solo" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              Start a solo plan instead
            </Link>
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-body-sm font-semibold mb-1">Item over {naira(GROUP_PRICE_CAP)}?</p>
          <p className="text-body-sm text-muted-foreground mb-3">
            Group plans only cover items up to {naira(GROUP_PRICE_CAP)}. For anything pricier, a solo plan has no cap —
            ₦1,000 per slot per day, delivered at 50%.
          </p>
          <Link href="/pay-small-small/solo" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
            Start a solo plan
          </Link>
        </div>
      </Container>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={<div className="py-20" />}>
      <JoinGroupInner />
    </Suspense>
  );
}
