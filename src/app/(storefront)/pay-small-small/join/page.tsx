import type { Metadata } from "next";
import Link from "next/link";
import { Users, ArrowLeft, Lock, ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Join a Group — Pay Small Small — OCare Phinas" };

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

/* Mock groups — replace with DB fetch in Phase 3 */
const MOCK_GROUPS: Group[] = [
  { id: "1", reference: "G-017", members: 3, capacity: 10, startDate: "2026-06-01", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "open" },
  { id: "2", reference: "G-016", members: 8, capacity: 10, startDate: "2026-05-20", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "open" },
  { id: "3", reference: "G-015", members: 10, capacity: 10, startDate: "2026-05-01", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "full" },
  { id: "4", reference: "G-014", members: 10, capacity: 10, startDate: "2026-04-01", targetValue: 50000, dailyAmount: 1000, duration: 50, status: "completed" },
];

const openGroups = MOCK_GROUPS.filter((g) => g.status === "open");

export default function JoinGroupPage() {
  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
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
            Pick an open group and start saving. Groups close automatically at 10 members.
          </p>
        </div>

        {openGroups.length > 0 ? (
          <div className="space-y-4 mb-8">
            {MOCK_GROUPS.map((group) => {
              const isFull = group.status === "full";
              const isCompleted = group.status === "completed";
              const slotsLeft = group.capacity - group.members;

              return (
                <div
                  key={group.id}
                  className={cn(
                    "rounded-2xl border bg-card p-5 transition-all duration-200",
                    !isFull && !isCompleted
                      ? "border-border hover:border-primary/40 hover:shadow-md"
                      : "border-border opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-body font-bold font-mono">{group.reference}</span>
                        <Badge
                          variant={
                            group.status === "open"
                              ? "success"
                              : group.status === "full"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-micro"
                        >
                          {group.status === "open" ? "Open" : group.status === "full" ? "Full" : "Completed"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-body-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {group.members}/{group.capacity} members
                        </span>
                        <span>Starts {new Date(group.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-caption text-muted-foreground">
                        <span>₦{group.dailyAmount.toLocaleString("en-NG")}/day</span>
                        <span>·</span>
                        <span>{group.duration} days</span>
                        <span>·</span>
                        <span>Target ₦{group.targetValue.toLocaleString("en-NG")}</span>
                      </div>

                      {/* Member slots bar */}
                      <div className="mt-3 flex gap-1">
                        {Array.from({ length: group.capacity }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-2 flex-1 rounded-full",
                              i < group.members ? "bg-primary" : "bg-muted",
                            )}
                          />
                        ))}
                      </div>
                      {!isFull && !isCompleted && (
                        <p className="text-caption text-primary font-medium mt-1.5">
                          {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {isFull || isCompleted ? (
                        <span className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                          <Lock className="size-4" />
                          {isFull ? "Full" : "Completed"}
                        </span>
                      ) : (
                        <Link
                          href={`/pay-small-small/join/${group.id}`}
                          className={cn(buttonVariants(), "gap-2")}
                        >
                          Join <ArrowRight className="size-4" />
                        </Link>
                      )}
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
              All groups are currently full. Try starting a solo plan or check back later.
            </p>
            <Link href="/pay-small-small/solo" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              Start a solo plan instead
            </Link>
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-body-sm font-semibold mb-1">Don&apos;t want to join a group?</p>
          <p className="text-body-sm text-muted-foreground mb-3">
            Start your own solo plan — same daily amount, no group needed.
          </p>
          <Link href="/pay-small-small/solo" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
            Start a solo plan
          </Link>
        </div>
      </Container>
    </div>
  );
}
