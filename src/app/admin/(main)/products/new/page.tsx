"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Phones", "Laptops", "Tablets", "Audio", "Appliances", "Accessories", "Gaming", "Cameras", "Pre-owned"];
const BRANDS = ["LG", "Samsung", "Sony", "Mewe", "Iwin", "Binatone", "Ambiano", "Tower", "Silvercrest", "Panasonic", "Apple", "Dell", "Tecno", "Nikon"];

interface Spec { key: string; value: string }

export default function NewProductPage() {
  const [specs, setSpecs] = useState<Spec[]>([{ key: "", value: "" }]);
  const [saving, setSaving] = useState(false);

  const inputClass = "w-full h-10 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors";
  const labelClass = "text-body-sm font-medium block mb-1.5";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
          <ArrowLeft className="size-4" /> Products
        </Link>
        <h1 className="text-h1 font-bold">Add Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Basic information</h2>
          <div><label className={labelClass}>Product name *</label><input type="text" required placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" className={inputClass} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Category *</label><select required className={cn(inputClass, "cursor-pointer")}><option value="">Select category</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className={labelClass}>Brand *</label><select required className={cn(inputClass, "cursor-pointer")}><option value="">Select brand</option>{BRANDS.map((b) => <option key={b}>{b}</option>)}</select></div>
            <div><label className={labelClass}>Condition *</label><select required className={cn(inputClass, "cursor-pointer")}><option value="">Select condition</option><option value="new">New</option><option value="pre_owned">Pre-owned (Tokunbo / UK Used)</option></select></div>
            <div><label className={labelClass}>Condition note (pre-owned)</label><input type="text" placeholder="e.g. Grade A, minor scratches" className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Description</label><textarea rows={4} placeholder="Describe the product…" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" /></div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-body font-semibold">Pricing & stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Price (₦) *</label><input type="number" required min={0} placeholder="65990" className={inputClass} /></div>
            <div><label className={labelClass}>Stock quantity *</label><input type="number" required min={0} placeholder="10" className={inputClass} /></div>
            <div><label className={labelClass}>Delivery fee (₦) *</label><input type="number" required min={0} defaultValue={0} placeholder="2500" className={inputClass} /></div>
          </div>
          <p className="text-caption text-muted-foreground -mt-1">Set per product. Use 0 for free delivery.</p>
          <label className="flex items-center gap-2.5 cursor-pointer"><input type="checkbox" defaultChecked className="rounded border-input text-primary" /><span className="text-body-sm font-medium">Active (visible to customers)</span></label>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-body font-semibold">Specifications</h2>
            <button type="button" onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}><Plus className="size-3.5" /> Add row</button>
          </div>
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2">
              <input value={spec.key} onChange={(e) => setSpecs((s) => s.map((sp, idx) => idx === i ? { ...sp, key: e.target.value } : sp))} placeholder="Key (e.g. RAM)" className={cn(inputClass, "flex-1")} />
              <input value={spec.value} onChange={(e) => setSpecs((s) => s.map((sp, idx) => idx === i ? { ...sp, value: e.target.value } : sp))} placeholder="Value (e.g. 12GB)" className={cn(inputClass, "flex-1")} />
              <button type="button" onClick={() => setSpecs((s) => s.filter((_, idx) => idx !== i))} disabled={specs.length === 1} className="flex size-10 items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30 flex-shrink-0"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-body font-semibold mb-4">Images</h2>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 gap-3 cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-body-sm font-medium">Click to upload images</p>
            <p className="text-caption text-muted-foreground">PNG, JPG up to 5MB each. First image is primary.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2" disabled={saving}><Save className="size-4" />{saving ? "Saving…" : "Save product"}</Button>
          <Link href="/admin/products" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
