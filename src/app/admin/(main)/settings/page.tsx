"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";

/** Editable settings — mirrors the PATCH /api/admin/settings schema. */
interface SettingsForm {
  storeName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  whatsappNumber: string;
  slotDaily: string;
  cycleDays: string;
  groupSlots: string;
  groupPriceCap: string;
}

const EMPTY: SettingsForm = {
  storeName: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  whatsappNumber: "",
  slotDaily: "",
  cycleDays: "",
  groupSlots: "",
  groupPriceCap: "",
};

const NUMERIC_FIELDS = ["slotDaily", "cycleDays", "groupSlots", "groupPriceCap"] as const;

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";
const labelClass = "text-body-sm font-medium block mb-1.5";

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<{ settings: SettingsForm }>("/api/admin/settings")
      .then(({ settings }) =>
        setForm({
          storeName: settings.storeName ?? "",
          bankName: settings.bankName ?? "",
          bankAccountName: settings.bankAccountName ?? "",
          bankAccountNumber: settings.bankAccountNumber ?? "",
          whatsappNumber: settings.whatsappNumber ?? "",
          slotDaily: String(settings.slotDaily ?? ""),
          cycleDays: String(settings.cycleDays ?? ""),
          groupSlots: String(settings.groupSlots ?? ""),
          groupPriceCap: String(settings.groupPriceCap ?? ""),
        }),
      )
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not load settings.", "Failed"),
      )
      .finally(() => setLoading(false));
  }, []);

  function update(key: keyof SettingsForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.storeName.trim()) {
      toast.error("Store name is required.", "Missing details");
      return;
    }
    for (const field of NUMERIC_FIELDS) {
      const n = Number(form[field]);
      if (!Number.isInteger(n) || n < 1) {
        toast.error("Pay Small Small values must be whole numbers of at least 1.", "Invalid values");
        return;
      }
    }

    setSaving(true);
    try {
      await api.patch("/api/admin/settings", {
        storeName: form.storeName.trim(),
        bankName: form.bankName.trim(),
        bankAccountName: form.bankAccountName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        slotDaily: Number(form.slotDaily),
        cycleDays: Number(form.cycleDays),
        groupSlots: Number(form.groupSlots),
        groupPriceCap: Number(form.groupPriceCap),
      });
      setSaved(true);
      toast.success("Settings saved.", "Saved");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save settings.", "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12">
        <Loader2 className="size-5 animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-h1 font-bold">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Bank account details</h2>
          <p className="text-caption text-muted-foreground -mt-2">
            Shown on the payment instructions page and plan payment screen. Never hardcode these.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bank name</label>
              <input type="text" value={form.bankName} onChange={update("bankName")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Account number</label>
              <input type="text" value={form.bankAccountNumber} onChange={update("bankAccountNumber")} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Account name</label>
              <input type="text" value={form.bankAccountName} onChange={update("bankAccountName")} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Payment WhatsApp number</h2>
          <p className="text-caption text-muted-foreground -mt-2">
            Used for all &ldquo;send screenshot&rdquo; deep links site-wide.
          </p>
          <div>
            <label className={labelClass}>WhatsApp number (international format)</label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={update("whatsappNumber")}
              placeholder="+2348012345678"
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Store information</h2>
          <div>
            <label className={labelClass}>Store name</label>
            <input type="text" value={form.storeName} onChange={update("storeName")} className={inputClass} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Pay Small Small defaults</h2>
          <p className="text-caption text-muted-foreground -mt-2">
            The slot engine: 1 slot = ₦1,000/day for 50 days (₦50,000 per slot/cycle). Slots required = price ÷
            ₦50,000, rounded up. Group plans use the strict slot daily; Solo plans let the member choose any daily.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Per-slot daily (₦)</label>
              <input type="number" value={form.slotDaily} onChange={update("slotDaily")} min={1} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cycle length (days)</label>
              <input type="number" value={form.cycleDays} onChange={update("cycleDays")} min={1} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Group slots</label>
              <input type="number" value={form.groupSlots} onChange={update("groupSlots")} min={1} max={50} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Group price cap (₦)</label>
              <input type="number" value={form.groupPriceCap} onChange={update("groupPriceCap")} min={1} step={50000} className={inputClass} />
            </div>
          </div>
          <p className="text-caption text-muted-foreground">
            Solo plans deliver at 50% and have no price cap. Group plans cover items up to the cap (max 2 slots per
            member). Money is never withdrawn as cash.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving…" : "Save settings"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-caption text-success font-medium">
              <CheckCircle className="size-3.5" /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
