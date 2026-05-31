"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lock,
  CalendarDays,
  Banknote,
  MessageCircle,
  Target,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";

interface Group {
  id: string;
  reference: string;
  members: number;
  capacity: number;
  startDate: string;
  targetValue: number;
  dailyAmount: number;
  duration: number;
  status: "open" | "full" | "completed";
}

/* Mock groups — mirrors the list in ../page.tsx. Replace with DB fetch in Phase 3. */
const MOCK_GROUPS: Group[] = [
  { id: "1", reference: "G-017", members: 3, capacity: 10, startDate: "2026-06-01", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "open" },
  { id: "2", reference: "G-016", members: 8, capacity: 10, startDate: "2026-05-20", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "open" },
  { id: "3", reference: "G-015", members: 10, capacity: 10, startDate: "2026-05-01", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "full" },
  { id: "4", reference: "G-014", members: 10, capacity: 10, startDate: "2026-04-01", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "completed" },
];

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

const HOW_IT_WORKS = [
  { icon: Banknote, title: "Pay ₦1,000 daily", body: "Transfer the daily amount to our bank account." },
  { icon: MessageCircle, title: "Send your screenshot", body: "Share it on WhatsApp so we can confirm and log it." },
  { icon: Target, title: "Reach ₦50,000", body: "After 50 days your plan completes and we arrange your item." },
];

export default function JoinGroupConfirmPage() {
  const user = useUserStore((s) => s.user);
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const group = MOCK_GROUPS.find((g) => g.id === id);

  const [step, setStep] = useState<"confirm" | "done">("confirm");

  /* ---------------------------- AUTH GATE --------------------------- */
  if (!user) {
    return (
      <AuthRequired
        title="Log in to join a group"
        description="You need an account to join a group and track your Pay Small Small plan. It only takes a minute."
      />
    );
  }

  /* ---------------------------- NOT FOUND --------------------------- */
  if (!group) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back to groups
          </Link>
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-h3 font-semibold mb-2">Group not found</p>
            <p className="text-body-sm text-muted-foreground mb-5">
              This group doesn&apos;t exist or is no longer available. Browse the open groups instead.
            </p>
            <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              See open groups
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const slotsLeft = group.capacity - group.members;
  const isOpen = group.status === "open";

  /* ------------------------- CLOSED (full/done) --------------------- */
  if (!isOpen) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back to groups
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Lock className="size-7 text-muted-foreground" />
            </div>
            <h1 className="text-h2 font-bold mb-2">
              {group.reference} is {group.status === "full" ? "full" : "completed"}
            </h1>
            <p className="text-body-sm text-muted-foreground mb-6 max-w-[42ch] mx-auto">
              {group.status === "full"
                ? "All 10 slots in this group have been taken. Try another open group, or start a solo plan with no waiting."
                : "This group has finished its savings cycle. Join an open group or start your own solo plan."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pay-small-small/join" className={cn(buttonVariants(), "gap-2")}>
                <Users className="size-4" /> See open groups
              </Link>
              <Link href="/pay-small-small/solo" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
                Start a solo plan
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  /* ------------------------------ DONE ------------------------------ */
  if (step === "done") {
    return (
      <div className="py-20">
        <Container className="max-w-sm">
          <div className="text-center py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">You&apos;ve joined {group.reference}!</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              You&apos;re member {group.members + 1} of {group.capacity}. Pay {naira(group.dailyAmount)} daily and
              track your progress on the My Plan page.
            </p>
            <Link href="/pay-small-small/my-plan" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              Go to My Plan <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* ---------------------------- CONFIRM ----------------------------- */
  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Back to groups
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <h1 className="text-h1 font-bold">Join {group.reference}</h1>
        </div>
        <p className="text-body-sm text-muted-foreground mb-8">
          Review the group and your commitment before you join. You can only have one active plan at a time.
        </p>

        {/* Group summary */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-body font-bold font-mono">{group.reference}</span>
            <Badge variant="success" className="text-micro">Open</Badge>
          </div>

          <div className="flex items-center gap-4 text-body-sm text-muted-foreground flex-wrap mb-3">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {group.members}/{group.capacity} members
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> Starts {formatDate(group.startDate)}
            </span>
          </div>

          {/* Member slots bar */}
          <div className="flex gap-1 mb-1.5">
            {Array.from({ length: group.capacity }).map((_, i) => (
              <div
                key={i}
                className={cn("h-2 flex-1 rounded-full", i < group.members ? "bg-primary" : "bg-muted")}
              />
            ))}
          </div>
          <p className="text-caption text-primary font-medium">
            {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining — you&apos;d be member {group.members + 1}
          </p>
        </div>

        {/* Your commitment */}
        <div className="rounded-2xl border border-border bg-muted/50 p-5 mb-5">
          <h2 className="text-body font-semibold mb-3">Your commitment</h2>
          <div className="space-y-2 text-body-sm">
            {[
              ["Daily payment", naira(group.dailyAmount)],
              ["Duration", `${group.duration} days`],
              ["Target total", naira(group.targetValue)],
              ["Plan type", `Group ${group.reference}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <h2 className="text-body font-semibold mb-3">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 mb-3">
                <s.icon className="size-4 text-primary" />
              </div>
              <p className="text-body-sm font-semibold mb-1">{s.title}</p>
              <p className="text-caption text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="text-caption text-muted-foreground mb-5">
          By joining you agree to save {naira(group.dailyAmount)}/day toward the {naira(group.targetValue)} target.
          Missing a day just pauses your progress — there are no penalties. You can leave by contacting us on WhatsApp.
        </p>

        <Button size="lg" className="w-full gap-2" onClick={() => setStep("done")}>
          <Users className="size-5" /> Join {group.reference}
        </Button>
      </Container>
    </div>
  );
}
