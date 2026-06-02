import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ChevronRight, MessageCircle, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { naira } from "@/lib/pay-small-small";
import { MOCK_CONTRIBUTIONS, contributionDetail } from "@/lib/contributions";

export const metadata: Metadata = { title: "Contributions — OCare Phinas Admin" };

const TYPE_META = {
  group: { label: "Group", icon: Users, variant: "default" as const },
  solo: { label: "Solo", icon: User, variant: "secondary" as const },
};

export default function AdminContributionsPage() {
  const pending = MOCK_CONTRIBUTIONS.filter((c) => c.status === "awaiting");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Plan Contributions</h1>
        <p className="text-muted-foreground mt-1">Members pay by manual bank transfer and send a screenshot on WhatsApp. <strong>Group</strong> payments are the strict slot daily (slots × ₦1,000); <strong>Solo</strong> payments are the member&apos;s chosen daily. Open a contribution to verify the screenshot, then confirm — which advances the plan and updates the member&apos;s ledger.</p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <CheckCircle className="size-12 text-success mx-auto mb-3 opacity-50" />
          <p className="text-h3 font-semibold">All clear</p>
          <p className="text-body-sm text-muted-foreground mt-1">No contributions awaiting confirmation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((c) => {
            const meta = TYPE_META[c.type];
            const TypeIcon = meta.icon;
            return (
              <Link
                key={c.id}
                href={`/admin/contributions/${c.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-body font-semibold">{c.member.name}</p>
                    <Badge variant={meta.variant} className="text-micro gap-1"><TypeIcon className="size-3" />{meta.label}</Badge>
                  </div>
                  <p className="text-body-sm text-muted-foreground font-mono">{contributionDetail(c)} · {new Date(c.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
                  <p className="text-caption text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MessageCircle className="size-3.5 text-[#25D366]" /> Screenshot sent on WhatsApp — verify before confirming
                  </p>
                </div>
                <p className="text-h3 font-bold text-primary flex-shrink-0">{naira(c.amount)}</p>
                <ChevronRight className="size-5 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
