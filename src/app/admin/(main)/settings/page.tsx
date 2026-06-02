"use client";

import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputClass = "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";
  const labelClass = "text-body-sm font-medium block mb-1.5";

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-h1 font-bold">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Bank account details</h2>
          <p className="text-caption text-muted-foreground -mt-2">Shown on the payment instructions page and plan payment screen. Never hardcode these.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Bank name</label><input type="text" defaultValue="GTBank" className={inputClass} /></div>
            <div><label className={labelClass}>Account number</label><input type="text" defaultValue="0123456789" className={inputClass} /></div>
            <div className="sm:col-span-2"><label className={labelClass}>Account name</label><input type="text" defaultValue="OCare Phinas Nigeria Ltd" className={inputClass} /></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Payment WhatsApp number</h2>
          <p className="text-caption text-muted-foreground -mt-2">Used for all &ldquo;send screenshot&rdquo; deep links site-wide.</p>
          <div><label className={labelClass}>WhatsApp number (international format)</label><input type="text" defaultValue="+2340000000000" placeholder="+2348012345678" className={inputClass} /></div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Store information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Store name</label><input type="text" defaultValue="OCare Phinas" className={inputClass} /></div>
            <div><label className={labelClass}>Phone number</label><input type="text" defaultValue="+2340000000000" className={inputClass} /></div>
            <div><label className={labelClass}>Delivery fee (₦)</label><input type="number" defaultValue={2500} min={0} className={inputClass} /></div>
            <div><label className={labelClass}>SMS sender ID</label><input type="text" defaultValue="OCAREPH" maxLength={11} className={inputClass} /></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Pay Small Small defaults</h2>
          <p className="text-caption text-muted-foreground -mt-2">The slot engine: 1 slot = ₦1,000/day for 50 days (₦50,000 per slot/cycle). Slots required = price ÷ ₦50,000, rounded up. Group plans use the strict slot daily; Solo plans let the member choose any daily at or above the solo minimum.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>Per-slot daily (₦)</label><input type="number" defaultValue={1000} min={100} className={inputClass} /></div>
            <div><label className={labelClass}>Cycle length (days)</label><input type="number" defaultValue={50} min={1} className={inputClass} /></div>
            <div><label className={labelClass}>Solo minimum daily (₦)</label><input type="number" defaultValue={100} min={1} className={inputClass} /></div>
            <div><label className={labelClass}>Group slots</label><input type="number" defaultValue={10} min={2} max={50} className={inputClass} /></div>
            <div><label className={labelClass}>Group price cap (₦)</label><input type="number" defaultValue={100000} min={50000} step={50000} className={inputClass} /></div>
          </div>
          <p className="text-caption text-muted-foreground">Solo plans deliver at 50% and have no price cap. Group plans cover items up to the cap (max 2 slots per member). Money is never withdrawn as cash.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2" disabled={saving}><Save className="size-4" />{saving ? "Saving…" : "Save settings"}</Button>
          {saved && <span className="flex items-center gap-1.5 text-caption text-success font-medium"><CheckCircle className="size-3.5" /> Saved</span>}
        </div>
      </form>
    </div>
  );
}
