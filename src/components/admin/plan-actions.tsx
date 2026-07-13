"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Pencil, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import type { PlanFrequency, PlanStatus, PlanType } from "@/lib/db/types";

/** The subset of a Plan row this component needs — satisfied by both the
 *  admin order page's mapped OrderPlan and the solar page's raw Plan. */
export interface PlanActionData {
  id: string;
  type: PlanType;
  frequency: PlanFrequency;
  startDate: string;
  perPayment: number;
  slots: number;
  productId: string | null;
  status: string;
  amountAllocated: number;
}

const STATUS_OPTIONS: PlanStatus[] = [
  "active",
  "processing",
  "delivered",
  "completed",
  "awaiting_substitution",
  "awaiting_installation",
  "defaulted",
];

const FREQUENCY_OPTIONS: PlanFrequency[] = ["daily", "weekly", "monthly"];

interface ProductOption {
  id: string;
  name: string;
  price: number;
  deliveryFee: number;
}

/**
 * Admin escape hatch for a customer's Plan — edit its schedule, swap the
 * product/package, override its status, record/correct how much a customer
 * has paid, and delete it outright (reverses wallet/stock/group effects
 * first — see reversePlan in src/lib/server/lifecycle.ts). Raising "Amount
 * paid" is ledger-synced (fills whole payment periods and credits the wallet
 * — see recordLumpPayment/recordSolarLumpPayment); lowering it is a manual
 * correction that debits the wallet by the same amount but leaves confirmed
 * periods alone. Status remains a direct, unsynced override. Shared by the
 * order detail page (solo/group) and the solar application detail page.
 */
export function PlanActions({
  plan,
  onUpdated,
  onDeleted,
}: {
  plan: PlanActionData;
  onUpdated: (plan: PlanActionData) => void;
  onDeleted: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState<ProductOption[] | null>(null);

  const [frequency, setFrequency] = useState<PlanFrequency>(plan.frequency);
  const [startDate, setStartDate] = useState(plan.startDate.slice(0, 10));
  const [perPayment, setPerPayment] = useState(String(plan.perPayment));
  const [slots, setSlots] = useState(String(plan.slots));
  const [productId, setProductId] = useState(plan.productId ?? "");
  const [status, setStatus] = useState<PlanStatus>(plan.status as PlanStatus);
  const [amountAllocated, setAmountAllocated] = useState(String(plan.amountAllocated));

  const isSolar = plan.type === "solar";
  const isGroup = plan.type === "group";

  useEffect(() => {
    if (editOpen && !isSolar && products === null) {
      api
        .get<{ products: ProductOption[] }>("/api/admin/products?active=true&pageSize=100")
        .then((d) => setProducts(d.products))
        .catch(() => setProducts([]));
    }
  }, [editOpen, isSolar, products]);

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        startDate: new Date(startDate).toISOString(),
        perPayment: Number(perPayment),
        status,
        amountAllocated: Number(amountAllocated),
      };
      if (!isGroup) body.frequency = frequency;
      if (!isSolar) {
        body.slots = Number(slots);
        if (productId && productId !== plan.productId) body.productId = productId;
      }
      const { plan: updated } = await api.patch<{ plan: PlanActionData }>(`/api/admin/plans/${plan.id}`, body);
      onUpdated(updated);
      toast.success("Plan updated.", "Saved");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update the plan.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this plan? Confirmed payments are reversed (wallet, stock, group slot) and this cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.del(`/api/admin/plans/${plan.id}`);
      toast.success("Plan deleted — money and stock effects reversed.", "Plan deleted");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete the plan.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-body-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="size-4 text-destructive" /> Plan admin actions</p>
          <p className="text-caption text-muted-foreground mt-0.5">Manual corrections — use with care.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> Edit plan
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={remove} disabled={deleting}>
            <Trash2 className="size-3.5" /> {deleting ? "Deleting…" : "Delete plan"}
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen} title="Edit plan" description="Corrects the plan directly — some fields don't sync the ledger automatically.">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {!isGroup && (
              <div>
                <label className="text-body-sm font-medium block mb-1.5">Frequency</label>
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value as PlanFrequency)}>
                  {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
            )}
            <div>
              <label className="text-body-sm font-medium block mb-1.5">Start date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-body-sm font-medium block mb-1.5">Per payment (₦)</label>
              <Input type="number" min={1} value={perPayment} onChange={(e) => setPerPayment(e.target.value)} />
            </div>
            {!isSolar && (
              <div>
                <label className="text-body-sm font-medium block mb-1.5">Slots</label>
                <Input type="number" min={1} value={slots} onChange={(e) => setSlots(e.target.value)} />
              </div>
            )}
          </div>

          {!isSolar && (
            <div>
              <label className="text-body-sm font-medium block mb-1.5">Product</label>
              <Select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!products}>
                <option value="">{products ? "Keep current product" : "Loading…"}</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ₦{p.price.toLocaleString("en-NG")}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 space-y-3">
            <p className="text-caption font-semibold flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-warning" /> Status is a manual override — no ledger sync</p>
            <p className="text-micro text-muted-foreground -mt-1.5">
              Raising &ldquo;Amount paid&rdquo; records it as a real payment — it fills whole periods in the
              schedule below in order and credits the customer&apos;s wallet, same as confirming a period one
              at a time (a partial amount that doesn&apos;t complete a period is still credited to the wallet,
              held uncommitted until the next period). Lowering it is treated as correcting a past over-record:
              it debits the wallet by the difference but does not un-confirm any period or reverse fulfilment —
              use &ldquo;Delete plan&rdquo; if a confirmed payment needs to be fully reversed.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-body-sm font-medium block mb-1.5">Status</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-body-sm font-medium block mb-1.5">Amount paid (₦)</label>
                <Input type="number" min={0} value={amountAllocated} onChange={(e) => setAmountAllocated(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2"><Save className="size-4" /> {saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
