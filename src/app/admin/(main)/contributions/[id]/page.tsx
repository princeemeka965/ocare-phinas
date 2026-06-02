import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/pay-small-small";
import { getContribution, CONTRIB_STATUS_META, contributionDetail } from "@/lib/contributions";
import { waLink } from "@/lib/whatsapp";
import { DecisionActions } from "@/components/admin/decision-actions";

export const metadata: Metadata = { title: "Contribution — OCare Phinas Admin" };

const TYPE_META = {
  group: { label: "Group plan", icon: Users, variant: "default" as const },
  solo: { label: "Solo plan", icon: User, variant: "secondary" as const },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContributionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const c = getContribution(id);
  if (!c) notFound();

  const typeMeta = TYPE_META[c.type];
  const TypeIcon = typeMeta.icon;
  const statusMeta = CONTRIB_STATUS_META[c.status];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/contributions" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
        <ArrowLeft className="size-4" /> Contributions
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-h2 font-bold font-mono">{c.reference}</h1>
            <Badge variant={typeMeta.variant} className="text-micro gap-1"><TypeIcon className="size-3" />{typeMeta.label}</Badge>
            <Badge variant={statusMeta.variant} className="text-micro">{statusMeta.label}</Badge>
          </div>
          <p className="text-caption text-muted-foreground">
            {new Date(c.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <p className="text-h2 font-bold text-primary">{naira(c.amount)}</p>
      </div>

      {/* Verification */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-body font-semibold">Verify this contribution</h2>
        <p className="text-body-sm text-muted-foreground">
          Paid by manual bank transfer with a screenshot sent on WhatsApp — the system does not capture the bank, sender or
          transaction reference. {c.type === "group"
            ? "Group payments must be exactly the strict slot daily — no paying ahead."
            : "Solo payments are the member's chosen daily amount."}
          {" "}Confirm the screenshot against your statement before confirming.
        </p>

        <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border text-body-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Member</span>
            <span className="font-semibold">{c.member.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium flex items-center gap-1.5"><Phone className="size-3.5" /> {c.member.phone}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium font-mono text-right">{contributionDetail(c)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-primary">{naira(c.amount)}</span>
          </div>
        </div>

        <a
          href={waLink(c.member.phone, `Hi ${c.member.name}, regarding your OCare Phinas contribution to ${c.reference}…`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-body-sm px-4 py-2.5 transition-colors"
        >
          <MessageCircle className="size-4" /> Open WhatsApp chat
        </a>
      </div>

      {/* Decision */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-body font-semibold">Decision</h2>
        <DecisionActions
          reference={c.reference}
          initialStatus={c.status}
          confirmLabel="Confirm contribution"
          rejectLabel="Reject"
          confirmToast={`${c.reference} contribution confirmed — plan advanced and ledger updated.`}
          rejectToast={`${c.reference} contribution rejected.`}
          note="Confirming advances the plan cycle and updates the member's ledger. Money never becomes cash — it only ever becomes a product."
        />
      </div>
    </div>
  );
}
