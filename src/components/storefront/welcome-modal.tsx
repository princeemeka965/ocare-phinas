"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PartyPopper, ArrowRight } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** sessionStorage key set by the register page right before it redirects. */
export const WELCOME_KEY = "ocare:welcome";

/**
 * A one-time celebratory modal that greets a customer immediately after they
 * create an account. The register page drops the new user's first name into
 * sessionStorage; this component reads it once (re-checking on each navigation,
 * since it lives in the persistent layout and isn't remounted by the
 * post-signup client-side redirect), pops the modal, then clears the flag so it
 * never shows again on subsequent visits.
 */
export function WelcomeModal() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

  /* The register page sets the flag, then client-side navigates to the next
     page WITHOUT remounting this layout-level component. Re-checking on every
     pathname change is what lets the modal appear after that redirect. */
  useEffect(() => {
    const stored = sessionStorage.getItem(WELCOME_KEY);
    if (stored !== null) {
      sessionStorage.removeItem(WELCOME_KEY);
      setName(stored);
    }
  }, [pathname]);

  return (
    <Dialog
      open={name !== null}
      onOpenChange={(open) => {
        if (!open) setName(null);
      }}
      showClose
      className="max-w-md"
    >
      <div className="px-2 py-4 text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <PartyPopper className="size-8" />
        </div>
        <h2 className="text-h2 font-bold mb-2">
          Welcome to OCare Phinas{name ? `, ${name}` : ""}! 🎉
        </h2>
        <p className="text-body-sm text-muted-foreground mb-7 max-w-[40ch] mx-auto">
          Your account is ready. Shop great electronics, or spread the cost with a
          Pay Small Small plan — pay a little each day and we deliver as you save.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            onClick={() => setName(null)}
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Start shopping <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pay-small-small"
            onClick={() => setName(null)}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Explore Pay Small Small
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
