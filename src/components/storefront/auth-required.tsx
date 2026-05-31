"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, LogIn, UserPlus } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Login gate shown in place of a flow that requires an account.
 * Carries the page the user was trying to reach as `?next=` so login /
 * register can send them straight back after authenticating.
 */
export function AuthRequired({
  title,
  description,
  next,
}: {
  title: string;
  description: string;
  /** Return URL after auth. Defaults to the current path (incl. nothing else). */
  next?: string;
}) {
  const pathname = usePathname();
  const target = encodeURIComponent(next ?? pathname);

  return (
    <div className="py-16 sm:py-20">
      <Container className="max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Lock className="size-7 text-primary" />
          </div>
          <h1 className="text-h2 font-bold mb-2">{title}</h1>
          <p className="text-body-sm text-muted-foreground mb-6">{description}</p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/login?next=${target}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}
            >
              <LogIn className="size-4" /> Log in
            </Link>
            <Link
              href={`/register?next=${target}`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full gap-2 justify-center")}
            >
              <UserPlus className="size-4" /> Create an account
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
