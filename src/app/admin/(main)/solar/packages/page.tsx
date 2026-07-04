"use client";

import { useState } from "react";
import { Sun, Plus, Save, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/store/toastStore";
import { useSolarStore } from "@/store/solarStore";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { packageBalance, type SolarFrequency, type SolarPackage } from "@/lib/solar";

const CADENCE_ORDER: SolarFrequency[] = ["daily", "weekly", "monthly"];

interface FormState {
  name: string;
  description: string;
  registrationFee: number;
  initialDeposit: number;
  /** Total price of the solar system — the balance repaid is whatever remains after the deposit. */
  totalAmount: number;
  cadence: Record<SolarFrequency, number>;
  active: boolean;
}

function toFormState(pkg?: SolarPackage): FormState {
  const cadence = Object.fromEntries(CADENCE_ORDER.map((f) => [f, pkg?.cadenceOptions.find((c) => c.frequency === f)?.amount ?? 0])) as Record<SolarFrequency, number>;
  return {
    name: pkg?.name ?? "",
    description: pkg?.description ?? "",
    registrationFee: pkg?.registrationFee ?? 5_000,
    initialDeposit: pkg?.initialDeposit ?? 50_000,
    totalAmount: pkg?.totalAmount ?? 850_000,
    cadence,
    active: pkg?.active ?? true,
  };
}

function PackageFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (next: FormState) => void;
}) {
  const balance = Math.max(0, form.totalAmount - form.initialDeposit);
  return (
    <div className="space-y-4">
      <div>
        <label className="text-body-sm font-medium block mb-1.5">Package name</label>
        <Input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Solar Power Flex Plan" />
      </div>
      <div>
        <label className="text-body-sm font-medium block mb-1.5">Description</label>
        <Textarea rows={2} value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-body-sm font-medium block mb-1.5">Registration fee</label>
          <Input type="number" value={form.registrationFee} onChange={(e) => onChange({ ...form, registrationFee: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-body-sm font-medium block mb-1.5">Initial deposit</label>
          <Input type="number" value={form.initialDeposit} onChange={(e) => onChange({ ...form, initialDeposit: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-body-sm font-medium block mb-1.5">Total system price</label>
          <Input type="number" value={form.totalAmount} onChange={(e) => onChange({ ...form, totalAmount: Number(e.target.value) })} />
        </div>
      </div>
      <p className="text-caption text-muted-foreground -mt-1">
        Balance repaid after the deposit: <span className="font-semibold text-foreground">{naira(balance)}</span> (total price − deposit)
      </p>
      <div>
        <p className="text-body-sm font-medium mb-1.5">Repayment cadence amounts</p>
        <div className="grid grid-cols-3 gap-3">
          {CADENCE_ORDER.map((f) => (
            <div key={f}>
              <label className="text-caption text-muted-foreground block mb-1">{SOLO_FREQUENCIES[f].label}</label>
              <Input type="number" value={form.cadence[f]} onChange={(e) => onChange({ ...form, cadence: { ...form.cadence, [f]: Number(e.target.value) } })} />
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2.5">
        <Switch checked={form.active} onChange={(e) => onChange({ ...form, active: e.target.checked })} />
        <span className="text-body-sm font-medium">Active — visible to customers</span>
      </label>
    </div>
  );
}

function formValid(form: FormState): boolean {
  return (
    form.name.trim().length > 0 &&
    form.registrationFee >= 0 &&
    form.initialDeposit >= 0 &&
    form.totalAmount > form.initialDeposit &&
    CADENCE_ORDER.every((f) => form.cadence[f] > 0)
  );
}

function toPackageInput(form: FormState): Omit<SolarPackage, "id"> {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    registrationFee: form.registrationFee,
    initialDeposit: form.initialDeposit,
    totalAmount: form.totalAmount,
    cadenceOptions: CADENCE_ORDER.map((f) => ({ frequency: f, amount: form.cadence[f] })),
    active: form.active,
  };
}

function PackageCard({ pkg }: { pkg: SolarPackage }) {
  const updatePackage = useSolarStore((s) => s.updatePackage);
  const removePackage = useSolarStore((s) => s.removePackage);
  const [form, setForm] = useState<FormState>(() => toFormState(pkg));
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(toPackageInput(form)) !== JSON.stringify(toPackageInput(toFormState(pkg)));

  function save() {
    if (!formValid(form)) {
      toast.error("Fill in all amounts before saving — the total price must exceed the deposit.", "Incomplete");
      return;
    }
    setSaving(true);
    updatePackage(pkg.id, toPackageInput(form));
    toast.success(`${form.name} saved.`, "Updated");
    setSaving(false);
  }

  function remove() {
    if (!confirm(`Delete "${pkg.name}"? This won't affect existing applications.`)) return;
    removePackage(pkg.id);
    toast.info("Package deleted.", "Removed");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sun className="size-4 text-primary" />
          <p className="text-body font-semibold">{pkg.name}</p>
        </div>
        <p className="text-caption text-muted-foreground">Balance {naira(packageBalance(pkg))}</p>
      </div>
      <PackageFields form={form} onChange={setForm} />
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <button onClick={remove} className="inline-flex items-center gap-1.5 text-caption font-medium text-destructive hover:underline">
          <Trash2 className="size-3.5" /> Delete
        </button>
        <Button onClick={save} disabled={!dirty || saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
        </Button>
      </div>
    </div>
  );
}

export default function AdminSolarPackagesPage() {
  const packages = useSolarStore((s) => s.packages);
  const addPackage = useSolarStore((s) => s.addPackage);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<FormState>(() => toFormState());

  function createPackage() {
    if (!formValid(newForm)) {
      toast.error("Fill in all amounts before saving — the total price must exceed the deposit.", "Incomplete");
      return;
    }
    addPackage(toPackageInput(newForm));
    toast.success(`${newForm.name} added.`, "Saved");
    setNewForm(toFormState());
    setAdding(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h1 font-bold flex items-center gap-2"><Sun className="size-6 text-primary" /> Solar Packages</h1>
          <p className="text-muted-foreground mt-1">
            Registration fee, deposit and total system price for the Solar Plan — the repayment balance is always the
            total price minus the deposit.
          </p>
        </div>
        <Button onClick={() => setAdding((v) => !v)} variant={adding ? "outline" : "default"} className="gap-2">
          <Plus className="size-4" /> {adding ? "Cancel" : "New package"}
        </Button>
      </div>

      {adding && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <p className="text-body font-semibold">New package</p>
          <PackageFields form={newForm} onChange={setNewForm} />
          <Button onClick={createPackage} className="gap-2"><Plus className="size-4" /> Add package</Button>
        </div>
      )}

      {packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-body-sm text-muted-foreground">
          No solar packages yet.
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}
