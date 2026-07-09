"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Wrench, CalendarClock, CheckCircle2, ArrowRight, Clock } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";
import type { SolarApplication, SolarInstallation } from "@/lib/db/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

interface ApplicationData {
  application: SolarApplication;
  installation: SolarInstallation | null;
}

export default function SolarInstallationStatusPage() {
  const user = useUserStore((s) => s.user);
  const [data, setData] = useState<ApplicationData | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    api
      .get<ApplicationData>("/api/solar/application")
      .then((d) => setData(d.application ? d : null))
      .catch(() => setData(null));
  }, [user]);

  if (!user) {
    return (
      <AuthRequired
        title="Log in to check installation status"
        description="Sign in to see your solar installation schedule."
      />
    );
  }

  if (data === undefined) {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-md text-center text-body-sm text-muted-foreground">Loading…</Container>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-md text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Sun className="size-7 text-primary" />
          </div>
          <h1 className="text-h2 font-bold mb-2">No solar application yet</h1>
          <p className="text-body-sm text-muted-foreground mb-6">Apply for a Solar Plan to track your installation here.</p>
          <Link href="/solar" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            View Solar Packages <ArrowRight className="size-4" />
          </Link>
        </Container>
      </div>
    );
  }

  const { application: app, installation } = data;
  const isInstalled = !!installation?.completedAt;
  const isScheduled = !!installation?.scheduledDate && !isInstalled;
  const isAwaiting =
    !isScheduled && !isInstalled && ["under_review", "approved_awaiting_deposit", "installation_processing"].includes(app.status);

  return (
    <div className="py-16 sm:py-20">
      <Container className="max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-full mx-auto mb-5",
              isInstalled ? "bg-success/15" : isScheduled ? "bg-primary/10" : "bg-muted",
            )}
          >
            {isInstalled ? (
              <CheckCircle2 className="size-8 text-success" />
            ) : isScheduled ? (
              <CalendarClock className="size-8 text-primary" />
            ) : (
              <Wrench className="size-8 text-muted-foreground" />
            )}
          </div>

          {isInstalled ? (
            <>
              <h1 className="text-h2 font-bold mb-2">Installed on {formatDate(installation!.completedAt!)}</h1>
              <p className="text-body-sm text-muted-foreground mb-6">
                Your solar system is live. Keep up your repayment schedule to stay on track.
              </p>
              <Link href="/solar/application" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
                View my plan <ArrowRight className="size-4" />
              </Link>
            </>
          ) : isScheduled ? (
            <>
              <h1 className="text-h2 font-bold mb-2">Installation scheduled</h1>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 text-left">
                <div className="flex justify-between text-body-sm mb-1.5">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold">{formatDate(installation!.scheduledDate!)}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-semibold">{installation!.scheduledTime}</span>
                </div>
                {installation!.notes && (
                  <p className="text-caption text-muted-foreground mt-3 pt-3 border-t border-border/60">{installation!.notes}</p>
                )}
              </div>
              <p className="text-caption text-muted-foreground">Please ensure someone is available at the installation address on this date.</p>
            </>
          ) : isAwaiting ? (
            <>
              <h1 className="text-h2 font-bold mb-2">Awaiting scheduling</h1>
              <p className="text-body-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <Clock className="size-4" />
                {app.status === "installation_processing"
                  ? "Your deposit is confirmed — we'll set a date soon."
                  : "We'll schedule your installation once your application is approved and your deposit is confirmed."}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-h2 font-bold mb-2">Not applicable</h1>
              <p className="text-body-sm text-muted-foreground">
                Your application status is <strong>{app.status.replace(/_/g, " ")}</strong>.
              </p>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
