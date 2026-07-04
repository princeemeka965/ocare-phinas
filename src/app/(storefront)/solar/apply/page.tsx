"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sun,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  Upload,
  User as UserIcon,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { useUserStore } from "@/store/userStore";
import { useSolarStore } from "@/store/solarStore";
import { useBankSettings } from "@/hooks/useBankSettings";
import { AuthRequired } from "@/components/storefront/auth-required";
import { BankTransferCard } from "@/components/storefront/bank-transfer-card";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { SOLAR_ID_TYPES, SOLAR_STATUS_META, packageBalance, type SolarFrequency, type SolarIdType } from "@/lib/solar";

type Step = "kyc" | "package" | "payment" | "done";

interface FileField {
  name: string | null;
}

function FileInput({
  label,
  file,
  onPick,
}: {
  label: string;
  file: FileField;
  onPick: (name: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-body-sm font-medium block mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-body-sm transition-colors",
          file.name ? "border-primary/40 bg-primary/5" : "border-dashed border-input hover:border-primary/40",
        )}
      >
        {file.name ? <FileText className="size-4 text-primary flex-shrink-0" /> : <Upload className="size-4 text-muted-foreground flex-shrink-0" />}
        <span className={cn("truncate", file.name ? "text-foreground font-medium" : "text-muted-foreground")}>
          {file.name ?? "Choose a file to upload"}
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f.name);
        }}
      />
    </div>
  );
}

export default function SolarApplyPage() {
  const user = useUserStore((s) => s.user);
  const allPackages = useSolarStore((s) => s.packages);
  const packages = allPackages.filter((p) => p.active);
  const applications = useSolarStore((s) => s.applications);
  const submitApplication = useSolarStore((s) => s.submitApplication);
  const settings = useBankSettings();

  const [step, setStep] = useState<Step>("kyc");
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get<{ customer: { phone: string } | null }>("/api/auth/me")
      .then((d) => setPhone(d.customer?.phone ?? ""))
      .catch(() => {});
  }, [user]);

  /* KYC fields — name/email/phone are never re-collected; they're read from the account. */
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState<SolarIdType>("nin");
  const [idDocument, setIdDocument] = useState<FileField>({ name: null });
  const [utilityBill, setUtilityBill] = useState<FileField>({ name: null });
  const [employmentDetails, setEmploymentDetails] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  /* Package + cadence. */
  const [packageId, setPackageId] = useState<string | null>(packages[0]?.id ?? null);
  const [frequency, setFrequency] = useState<SolarFrequency>("daily");

  const selectedPackage = packages.find((p) => p.id === packageId) ?? packages[0] ?? null;
  const cadence = selectedPackage?.cadenceOptions.find((c) => c.frequency === frequency);

  const kycValid =
    address.trim().length > 5 &&
    !!idDocument.name &&
    !!utilityBill.name &&
    employmentDetails.trim().length > 3 &&
    emergencyContactName.trim().length > 1 &&
    emergencyContactPhone.trim().length > 6;

  if (!user) {
    return (
      <AuthRequired
        title="Log in to apply for solar"
        description="You need an account to submit a solar application. It only takes a minute."
        next="/solar/apply"
      />
    );
  }

  const myApplication = applications.find((a) => a.customerId === user.id);

  /* One active solar application at a time (addendum §8, decision 1) — a
     rejected application re-applies from the status page, not here. Only
     block at the KYC entry point: once the customer has moved past it in
     this session, the application they're blocking on is the one they just
     submitted (created at the payment step), so let payment/done render. */
  if (myApplication && step === "kyc") {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-md">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
              <Sun className="size-7 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">You already have a solar application</h1>
            <p className="text-body-sm text-muted-foreground mb-6">
              Reference <span className="font-mono font-medium text-foreground">{myApplication.reference}</span> is
              currently <strong>{SOLAR_STATUS_META[myApplication.status].label}</strong>. You can hold one solar
              application at a time.
            </p>
            <Link href="/solar/application" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              View my application <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-md text-center">
          <p className="text-body-sm text-muted-foreground">No solar packages are available to apply for right now.</p>
        </Container>
      </div>
    );
  }

  /* ----------------------------- DONE ----------------------------- */
  if (step === "done") {
    return (
      <div className="py-20">
        <Container className="max-w-sm">
          <div className="text-center py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Application submitted</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              Your registration fee has been recorded — your application is now under review. We&apos;ll notify you
              once it&apos;s been verified.
            </p>
            <Link href="/solar/application" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              Track my application <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* --------------------------- PAYMENT --------------------------- */
  if (step === "payment" && selectedPackage && cadence) {
    async function confirmFeePaid() {
      setSubmitting(true);
      try {
        submitApplication({
          customerId: user!.id,
          customerName: user!.name,
          customerEmail: user!.email,
          customerPhone: phone,
          packageId: selectedPackage!.id,
          address,
          idType,
          idDocumentName: idDocument.name!,
          utilityBillName: utilityBill.name!,
          employmentDetails,
          emergencyContactName,
          emergencyContactPhone,
          chosenFrequency: frequency,
        });
        toast.success("Registration fee recorded — your application is under review.", "Submitted");
        setStep("done");
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-lg">
          <button onClick={() => setStep("package")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back
          </button>

          <h1 className="text-h1 font-bold mb-1">Pay your registration fee</h1>
          <p className="text-body-sm text-muted-foreground mb-6">
            This ₦{selectedPackage.registrationFee.toLocaleString("en-NG")} fee is non-refundable and starts your KYC
            review. Transfer it, then confirm below.
          </p>

          <BankTransferCard
            amount={selectedPackage.registrationFee}
            narration={`${user.name} — Solar registration`}
            settings={settings}
            waMessage={`Hi OCare Phinas! I just paid ${naira(selectedPackage.registrationFee)} for my Solar Plan registration fee. Please find my screenshot attached.`}
            confirmLabel="I've sent the registration fee"
            confirming={submitting}
            onConfirm={confirmFeePaid}
          />

          <p className="text-caption text-muted-foreground mt-5">
            By continuing you agree that the registration fee is non-refundable, that approval depends on
            successful verification, and that installation only begins once your deposit is confirmed.
          </p>
        </Container>
      </div>
    );
  }

  /* --------------------------- PACKAGE ---------------------------- */
  if (step === "package" && selectedPackage) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-lg">
          <button onClick={() => setStep("kyc")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back
          </button>

          <h1 className="text-h1 font-bold mb-1">Choose your package</h1>
          <p className="text-body-sm text-muted-foreground mb-6">Pick a package, then how often you&apos;d like to repay the balance.</p>

          <div className="space-y-3 mb-6">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setPackageId(pkg.id)}
                className={cn(
                  "w-full text-left rounded-2xl border-2 p-5 transition-colors",
                  packageId === pkg.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                    <Sun className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body font-bold">{pkg.name}</p>
                    <p className="text-caption text-muted-foreground">{naira(pkg.totalAmount)} total (deposit + balance)</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-caption">
                  <div><span className="text-muted-foreground block">Reg. fee</span><span className="font-semibold">{naira(pkg.registrationFee)}</span></div>
                  <div><span className="text-muted-foreground block">Deposit</span><span className="font-semibold">{naira(pkg.initialDeposit)}</span></div>
                  <div><span className="text-muted-foreground block">Balance</span><span className="font-semibold">{naira(packageBalance(pkg))}</span></div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            How would you like to repay the balance?
          </p>
          <div className="grid grid-cols-3 gap-2 mb-8">
            {selectedPackage.cadenceOptions.map((c) => (
              <button
                key={c.frequency}
                type="button"
                onClick={() => setFrequency(c.frequency)}
                aria-pressed={frequency === c.frequency}
                className={cn(
                  "rounded-xl border px-3 py-3 text-center transition-colors",
                  frequency === c.frequency ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                )}
              >
                <p className="text-body-sm font-bold">{naira(c.amount)}</p>
                <p className={cn("text-micro", frequency === c.frequency ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {SOLO_FREQUENCIES[c.frequency].per}
                </p>
              </button>
            ))}
          </div>

          <Button size="lg" className="w-full gap-2" onClick={() => setStep("payment")}>
            Continue to registration fee <ArrowRight className="size-4" />
          </Button>
        </Container>
      </div>
    );
  }

  /* ----------------------------- KYC ------------------------------ */
  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-lg">
        <Link href="/solar" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Solar Plans
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Sun className="size-5 text-primary" />
          </div>
          <h1 className="text-h1 font-bold">Apply for a Solar Plan</h1>
        </div>
        <p className="text-body-sm text-muted-foreground mb-8">
          A few details for verification. Your name, email and phone are already on file — no need to re-enter them.
        </p>

        {/* Read-only identity */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4 mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
            <UserIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-semibold truncate">{user.name}</p>
            <p className="text-caption text-muted-foreground truncate">{user.email}{phone ? ` · ${phone}` : ""}</p>
          </div>
          <Link href="/profile" className="text-caption font-medium text-primary hover:underline flex-shrink-0">
            Wrong info?
          </Link>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-body-sm font-medium block mb-1.5">Home / installation address</label>
            <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city, state" />
          </div>

          <div>
            <label className="text-body-sm font-medium block mb-1.5">ID type</label>
            <Select value={idType} onChange={(e) => setIdType(e.target.value as SolarIdType)}>
              {SOLAR_ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>

          <FileInput label="ID document" file={idDocument} onPick={(name) => setIdDocument({ name })} />
          <FileInput label="Utility bill / proof of address" file={utilityBill} onPick={(name) => setUtilityBill({ name })} />

          <div>
            <label className="text-body-sm font-medium block mb-1.5">Employment / business details</label>
            <Textarea rows={2} value={employmentDetails} onChange={(e) => setEmploymentDetails(e.target.value)} placeholder="e.g. Employer name, role, or business name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-body-sm font-medium block mb-1.5">Emergency contact name</label>
              <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="text-body-sm font-medium block mb-1.5">Emergency contact phone</label>
              <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="080…" />
            </div>
          </div>
        </div>

        <Button size="lg" className="w-full gap-2 mt-8" disabled={!kycValid} onClick={() => setStep("package")}>
          Continue <ArrowRight className="size-4" />
        </Button>
      </Container>
    </div>
  );
}
