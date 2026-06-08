import Link from "next/link";
import { ArrowRight, Info, User, Users } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivePlanNoticeProps {
  /** Which per-type cap was hit. */
  type: "solo" | "group";
  /** The product the customer is still paying toward, if known. */
  productName?: string | null;
}

/**
 * Shown when a customer tries to start a second plan of a type they already
 * have running (§1: one ongoing Solo + one ongoing Group at a time). A solo
 * plan blocks another solo; a group plan blocks joining another group — but a
 * solo and a group may run together. The current plan's type only frees once
 * it is fully paid (a group then exits and frees its slot), so there is no way
 * to leave with an outstanding balance.
 */
export function ActivePlanNotice({ type, productName }: ActivePlanNoticeProps) {
  const isSolo = type === "solo";
  const Icon = isSolo ? User : Users;

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <Link
          href="/pay-small-small"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}
        >
          Pay Small Small
        </Link>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Icon className="size-7 text-primary" />
          </div>
          <h1 className="text-h2 font-bold mb-2">
            You already have a {isSolo ? "solo plan" : "group plan"} running
          </h1>
          <p className="text-body-sm text-muted-foreground mb-6 max-w-[46ch] mx-auto">
            {isSolo ? (
              <>
                You can only run <strong>one solo plan at a time</strong>
                {productName ? (
                  <> — you&apos;re still paying toward the <strong>{productName}</strong></>
                ) : null}
                . Finish paying it off and we&apos;ll free you up to start another.
              </>
            ) : (
              <>
                You can only be in <strong>one group at a time</strong>
                {productName ? (
                  <> — you&apos;re still paying toward the <strong>{productName}</strong></>
                ) : null}
                . Once it&apos;s fully paid you receive your item, leave the group, and can join
                any other open group. You can&apos;t leave while there&apos;s an outstanding balance.
              </>
            )}
          </p>

          <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-caption text-muted-foreground text-left max-w-md mx-auto mb-6">
            <Info className="size-4 text-primary flex-shrink-0 mt-0.5" />
            <span>
              {isSolo
                ? "A solo plan and a group plan can run at the same time — only a second solo plan is blocked."
                : "A group plan and a solo plan can run at the same time — only a second group is blocked."}
            </span>
          </div>

          <Link
            href="/pay-small-small/my-plan"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Go to My Plan <ArrowRight className="size-4" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
