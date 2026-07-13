/* ------------------------------------------------------------------ *
 * Solar Pay Small Small — application/KYC, deposit, installation and    *
 * balance-repayment lifecycle (see ocare-phinas-solar-plan-addendum.md). *
 * ------------------------------------------------------------------ *
 * Mirrors src/lib/server/lifecycle.ts's conventions: manual payments     *
 * only change state here (never client-side), idempotency comes from    *
 * unique constraints, and the atomic inc_wallet_total RPC keeps the      *
 * wallet ledger race-safe.                                              *
 *                                                                       *
 * The registration fee is booked as part of Approve (not a separate     *
 * confirm step — there is no such button in the built admin UI) and     *
 * never calls inc_wallet_total, so it never contributes to Available    *
 * Balance and is never reversible, even on later rejection/default.     *
 * ------------------------------------------------------------------ */

import { supabase, unwrap } from "@/lib/supabase";
import { planPeriods } from "@/lib/payment-health";
import { packageBalance, cadenceFor } from "@/lib/solar";
import { sendEmail, solarInstallationScheduledEmail } from "@/lib/email";
import type {
  Plan,
  PlanPayment,
  PlanFrequency,
  Wallet,
  Customer,
  SolarApplication,
  SolarPackage,
  SolarInstallation,
  SolarIdType,
} from "@/lib/db/types";

export type SolarResult<T> = ({ ok: true } & T) | { ok: false; status: number; error: string };

/** Every SolarApplication.status except the two terminal ones — matches the
 *  partial unique index in 0004_solar.sql, so a customer can hold at most
 *  one of these at a time (independent of the Solo/Group slot rule). */
const ACTIVE_SOLAR_STATUSES = [
  "under_review",
  "not_approved",
  "approved_awaiting_deposit",
  "installation_processing",
  "installation_scheduled",
  "active_repayment",
] as const;

/** A unique application reference, e.g. SOL-2026-04821. */
export async function nextSolarReference(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const reference = `SOL-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
    const { data } = await supabase.from("SolarApplication").select("id").eq("reference", reference).maybeSingle();
    if (!data) return reference;
  }
  return `SOL-${year}-${Date.now()}`;
}

/** Whether the customer already holds a non-terminal solar application/plan. */
export async function hasActiveSolarApplication(customerId: string): Promise<boolean> {
  const { count } = await supabase
    .from("SolarApplication")
    .select("*", { count: "exact", head: true })
    .eq("customerId", customerId)
    .in("status", [...ACTIVE_SOLAR_STATUSES]);
  return (count ?? 0) > 0;
}

export interface SubmitSolarApplicationInput {
  customerId: string;
  packageId: string;
  address: string;
  idType: SolarIdType;
  idDocumentUrl: string;
  utilityBillUrl: string;
  employmentDetails: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  chosenFrequency: PlanFrequency;
}

/** Submit a new KYC application. One active application per customer (§8). */
export async function submitSolarApplication(
  input: SubmitSolarApplicationInput,
): Promise<SolarResult<{ application: SolarApplication }>> {
  if (await hasActiveSolarApplication(input.customerId)) {
    return { ok: false, status: 409, error: "You already have a solar application in progress." };
  }
  const { data: pkg } = await supabase
    .from("SolarPackage")
    .select("*")
    .eq("id", input.packageId)
    .eq("active", true)
    .maybeSingle<SolarPackage>();
  if (!pkg) return { ok: false, status: 404, error: "Solar package not found." };

  const reference = await nextSolarReference();
  const inserted = await supabase
    .from("SolarApplication")
    .insert({
      reference,
      customerId: input.customerId,
      packageId: input.packageId,
      address: input.address,
      idType: input.idType,
      idDocumentUrl: input.idDocumentUrl,
      utilityBillUrl: input.utilityBillUrl,
      employmentDetails: input.employmentDetails,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      chosenFrequency: input.chosenFrequency,
      status: "under_review",
    })
    .select("*")
    .single();
  if (inserted.error) {
    // Race with another concurrent submit — the partial unique index catches it.
    if (inserted.error.code === "23505") {
      return { ok: false, status: 409, error: "You already have a solar application in progress." };
    }
    return { ok: false, status: 500, error: inserted.error.message };
  }
  const application = inserted.data as SolarApplication;

  await supabase.from("Notification").insert({
    customerId: input.customerId,
    channel: "in_app",
    type: "solar_application_submitted",
    body: "Your solar application has been submitted and is now under review.",
  });

  return { ok: true, application };
}

/** Approve a KYC application. Also books the (non-refundable) registration fee. */
export async function approveSolarApplication(
  applicationId: string,
  adminId: string,
): Promise<SolarResult<{ application: SolarApplication }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 404, error: "Application not found." };
  if (application.status !== "under_review") {
    return { ok: false, status: 409, error: "This application is not awaiting review." };
  }

  const { data: pkg } = await supabase
    .from("SolarPackage")
    .select("*")
    .eq("id", application.packageId)
    .maybeSingle<SolarPackage>();
  if (!pkg) return { ok: false, status: 404, error: "Solar package not found." };

  const { data: wallet } = await supabase
    .from("Wallet")
    .select("*")
    .eq("customerId", application.customerId)
    .maybeSingle<Wallet>();
  let registrationFeeTxnId: string | null = null;
  if (wallet) {
    // Ledger entry only — never inc_wallet_total, so this never becomes
    // Available Balance and is never reversed, even on later default.
    const txn = await supabase
      .from("Transaction")
      .insert({ walletId: wallet.id, type: "registration_fee", amount: pkg.registrationFee, planId: null, approved: true })
      .select("id")
      .single();
    if (!txn.error) registrationFeeTxnId = (txn.data as { id: string }).id;
  }

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({
        status: "approved_awaiting_deposit",
        reviewedById: adminId,
        reviewedAt: new Date().toISOString(),
        rejectionReason: null,
        registrationFeeTxnId,
      })
      .eq("id", applicationId)
      .select("*")
      .single(),
  ) as SolarApplication;

  await supabase.from("Notification").insert({
    customerId: application.customerId,
    channel: "in_app",
    type: "solar_approved",
    body: `Your solar application was approved — pay your ₦${pkg.initialDeposit.toLocaleString("en-NG")} deposit to begin installation scheduling.`,
  });

  return { ok: true, application: updated };
}

/** Reject a KYC application with a reason. No fee is recorded. */
export async function rejectSolarApplication(
  applicationId: string,
  adminId: string,
  reason: string,
): Promise<SolarResult<{ application: SolarApplication }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 404, error: "Application not found." };
  if (application.status !== "under_review") {
    return { ok: false, status: 409, error: "This application is not awaiting review." };
  }

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ status: "not_approved", reviewedById: adminId, reviewedAt: new Date().toISOString(), rejectionReason: reason })
      .eq("id", applicationId)
      .select("*")
      .single(),
  ) as SolarApplication;

  await supabase.from("Notification").insert({
    customerId: application.customerId,
    channel: "in_app",
    type: "solar_rejected",
    body: `Your solar application wasn't approved: ${reason}`,
  });

  return { ok: true, application: updated };
}

/** Re-open a rejected application for another review pass — reuses the same row. */
export async function reapplySolarApplication(customerId: string): Promise<SolarResult<{ application: SolarApplication }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("customerId", customerId)
    .eq("status", "not_approved")
    .order("createdAt", { ascending: false })
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 409, error: "No rejected application to re-apply from." };

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ status: "under_review", rejectionReason: null, reviewedById: null, reviewedAt: null })
      .eq("id", application.id)
      .select("*")
      .single(),
  ) as SolarApplication;

  return { ok: true, application: updated };
}

/** Customer claims they've transferred the initial deposit. */
export async function submitSolarDepositClaim(customerId: string): Promise<SolarResult<{ application: SolarApplication }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("customerId", customerId)
    .eq("status", "approved_awaiting_deposit")
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 409, error: "No application is awaiting a deposit." };

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ depositSubmittedAt: new Date().toISOString() })
      .eq("id", application.id)
      .select("*")
      .single(),
  ) as SolarApplication;

  return { ok: true, application: updated };
}

/**
 * Confirm the initial deposit. This is what creates the real Plan row —
 * scoped to just the post-deposit balance (packageBalance), on the
 * customer's chosen cadence — sitting in `awaiting_installation` (not yet
 * payable/arrears-eligible) until installation completes.
 */
export async function confirmSolarDeposit(
  applicationId: string,
): Promise<SolarResult<{ application: SolarApplication; plan: Plan }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 404, error: "Application not found." };
  if (application.status !== "approved_awaiting_deposit") {
    return { ok: false, status: 409, error: "This application is not awaiting a deposit." };
  }
  if (!application.depositSubmittedAt) {
    return { ok: false, status: 400, error: "The customer hasn't claimed a deposit payment yet." };
  }

  const { data: pkg } = await supabase
    .from("SolarPackage")
    .select("*")
    .eq("id", application.packageId)
    .maybeSingle<SolarPackage>();
  if (!pkg) return { ok: false, status: 404, error: "Solar package not found." };

  const cadence = cadenceFor(pkg, application.chosenFrequency);
  const now = new Date().toISOString();

  const plan = unwrap(
    await supabase
      .from("Plan")
      .insert({
        customerId: application.customerId,
        type: "solar",
        productId: null,
        productPrice: packageBalance(pkg),
        deliveryFee: 0,
        slots: 1,
        perPayment: cadence.amount,
        frequency: application.chosenFrequency,
        startDate: now, // placeholder — reset to the real schedule start at completeSolarInstallation
        amountAllocated: 0,
        status: "awaiting_installation",
        solarApplicationId: application.id,
      })
      .select("*")
      .single(),
  ) as Plan;

  const { data: wallet } = await supabase
    .from("Wallet")
    .select("*")
    .eq("customerId", application.customerId)
    .maybeSingle<Wallet>();
  if (wallet) {
    await supabase.from("Transaction").insert([
      { walletId: wallet.id, type: "deposit", amount: pkg.initialDeposit, planId: plan.id, approved: true },
      { walletId: wallet.id, type: "allocation", amount: pkg.initialDeposit, planId: plan.id, approved: true },
    ]);
    await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta: pkg.initialDeposit });
  }

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ status: "installation_processing", depositPaidAt: now })
      .eq("id", applicationId)
      .select("*")
      .single(),
  ) as SolarApplication;

  await supabase.from("Notification").insert({
    customerId: application.customerId,
    channel: "in_app",
    type: "solar_deposit_confirmed",
    body: "Your deposit has been confirmed — installation is now being scheduled.",
  });

  return { ok: true, application: updated, plan };
}

/** Reject a claimed deposit payment — the customer can resubmit. No Plan is created. */
export async function rejectSolarDeposit(applicationId: string): Promise<SolarResult<{ application: SolarApplication }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 404, error: "Application not found." };
  if (application.status !== "approved_awaiting_deposit" || !application.depositSubmittedAt) {
    return { ok: false, status: 409, error: "No deposit claim to reject." };
  }

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ depositSubmittedAt: null })
      .eq("id", applicationId)
      .select("*")
      .single(),
  ) as SolarApplication;

  return { ok: true, application: updated };
}

/** Set (or change) the installation date/time. Idempotent per application. */
export async function scheduleSolarInstallation(
  applicationId: string,
  adminId: string,
  date: string,
  time: string,
  notes?: string,
): Promise<SolarResult<{ application: SolarApplication; installation: SolarInstallation }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 404, error: "Application not found." };
  if (!["installation_processing", "installation_scheduled"].includes(application.status)) {
    return { ok: false, status: 409, error: "This application isn't awaiting installation scheduling." };
  }

  const installation = unwrap(
    await supabase
      .from("SolarInstallation")
      .upsert(
        { applicationId, scheduledDate: date, scheduledTime: time, scheduledById: adminId, scheduledAt: new Date().toISOString(), notes: notes ?? null },
        { onConflict: "applicationId" },
      )
      .select("*")
      .single(),
  ) as SolarInstallation;

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ status: "installation_scheduled" })
      .eq("id", applicationId)
      .select("*")
      .single(),
  ) as SolarApplication;

  await supabase.from("Notification").insert({
    customerId: application.customerId,
    channel: "in_app",
    type: "solar_installation_scheduled",
    body: `Your solar installation has been scheduled for ${date} at ${time}.`,
  });

  // Best-effort — the schedule is already saved and the in-app notification
  // above is the source of truth, so an email provider hiccup shouldn't fail
  // the admin's action.
  const { data: customer } = await supabase
    .from("Customer")
    .select("name,email")
    .eq("id", application.customerId)
    .maybeSingle<Pick<Customer, "name" | "email">>();
  if (customer) {
    try {
      await sendEmail({
        to: customer.email,
        ...solarInstallationScheduledEmail({ customerName: customer.name, date, time, notes }),
      });
    } catch (err) {
      console.error("[scheduleSolarInstallation] notification email failed", err);
    }
  }

  return { ok: true, application: updated, installation };
}

/** Mark installation complete — this is what starts the real repayment schedule. */
export async function completeSolarInstallation(
  applicationId: string,
): Promise<SolarResult<{ application: SolarApplication; plan: Plan }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 404, error: "Application not found." };
  if (application.status !== "installation_scheduled") {
    return { ok: false, status: 409, error: "Installation hasn't been scheduled yet." };
  }

  const { data: plan } = await supabase.from("Plan").select("*").eq("solarApplicationId", applicationId).maybeSingle<Plan>();
  if (!plan) return { ok: false, status: 404, error: "No plan is linked to this application." };

  const now = new Date().toISOString();
  await supabase.from("SolarInstallation").update({ completedAt: now }).eq("applicationId", applicationId);

  // The panels just changed hands — the deposit (already in totalBalance
  // since confirmSolarDeposit) converts from "committed, awaiting install"
  // to spent. Everything paid from here on (confirmSolarPeriod) is a
  // straight loan repayment on equipment already installed, so it's credited
  // as spent immediately too, not held as a separate "committed" bucket.
  const { data: pkg } = await supabase.from("SolarPackage").select("*").eq("id", application.packageId).maybeSingle<SolarPackage>();
  if (pkg) {
    const { data: wallet } = await supabase.from("Wallet").select("*").eq("customerId", application.customerId).maybeSingle<Wallet>();
    if (wallet) await supabase.rpc("inc_wallet_spent", { w_id: wallet.id, delta: pkg.initialDeposit });
  }

  // Repayment period #1 is due "now" — planPeriods() always treats startDate as day 1.
  const updatedPlan = unwrap(
    await supabase.from("Plan").update({ status: "active", startDate: now }).eq("id", plan.id).select("*").single(),
  ) as Plan;

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ status: "active_repayment" })
      .eq("id", applicationId)
      .select("*")
      .single(),
  ) as SolarApplication;

  return { ok: true, application: updated, plan: updatedPlan };
}

/**
 * Confirm one balance-repayment period. A parallel function to
 * confirmPlanPeriod (lifecycle.ts) rather than an adaptation of it — that
 * function is Order/goods-fulfilment-shaped (stock decrement, 50/100%
 * goods trigger, group slot release), none of which applies here: solar
 * has no Order row, and "delivery" already happened via installation.
 */
export async function confirmSolarPeriod(
  applicationId: string,
  periodIndex: number,
  adminId: string,
  opts?: { allowAhead?: boolean },
): Promise<SolarResult<{ amountAllocated: number; planStatus: string }>> {
  const { data: plan } = await supabase.from("Plan").select("*").eq("solarApplicationId", applicationId).maybeSingle<Plan>();
  if (!plan || plan.status !== "active") return { ok: false, status: 409, error: "This plan isn't in active repayment." };

  const existing = unwrap(await supabase.from("PlanPayment").select("*").eq("planId", plan.id)) as PlanPayment[];
  const periods = planPeriods({
    price: plan.productPrice,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: new Date(plan.startDate).toISOString(),
    paidIndices: existing.map((p) => p.periodIndex),
  });
  const period = periods.find((p) => p.index === periodIndex);
  if (!period) return { ok: false, status: 400, error: "Invalid period." };
  if (period.status === "paid") return { ok: false, status: 409, error: "That period is already confirmed." };
  if (period.status === "upcoming" && !opts?.allowAhead) {
    return { ok: false, status: 400, error: "No paying ahead — that period is not due yet." };
  }

  const inserted = await supabase.from("PlanPayment").insert({
    planId: plan.id,
    periodIndex,
    amount: period.amount,
    dueDate: new Date(period.dueDate).toISOString(),
    confirmedById: adminId,
  });
  if (inserted.error) {
    if (inserted.error.code === "23505") return { ok: false, status: 409, error: "That period is already confirmed." };
    return { ok: false, status: 500, error: inserted.error.message };
  }

  const amountAllocated = existing.reduce((s, p) => s + p.amount, 0) + period.amount;

  const { data: wallet } = await supabase.from("Wallet").select("*").eq("customerId", plan.customerId).maybeSingle<Wallet>();
  if (wallet) {
    await supabase.from("Transaction").insert([
      { walletId: wallet.id, type: "deposit", amount: period.amount, planId: plan.id, approved: true },
      { walletId: wallet.id, type: "allocation", amount: period.amount, planId: plan.id, approved: true },
    ]);
    await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta: period.amount });
    // Installation already happened (completeSolarInstallation ran before repayment
    // could start) — every repayment period is paying off equipment already
    // received, so it's spent the moment it's confirmed, not "committed".
    await supabase.rpc("inc_wallet_spent", { w_id: wallet.id, delta: period.amount });
  }

  const complete = amountAllocated >= plan.productPrice;
  const planStatus = complete ? "completed" : "active";

  await supabase.from("Plan").update({ amountAllocated, status: planStatus }).eq("id", plan.id);
  if (complete) {
    await supabase.from("SolarApplication").update({ status: "completed" }).eq("id", applicationId);
  }

  return { ok: true, amountAllocated, planStatus };
}

export type SolarLumpPaymentResult = SolarResult<{
  amountAllocated: number;
  planStatus: string;
  periodsConfirmed: number;
  leftover: number;
}>;

/**
 * Record a lump sum against an active solar repayment plan — parallel to
 * recordLumpPayment (lifecycle.ts). Fills whole periods in schedule order via
 * confirmSolarPeriod (allowing ahead), crediting any remainder that doesn't
 * fill a whole period to the wallet directly as uncommitted balance.
 */
export async function recordSolarLumpPayment(
  applicationId: string,
  amount: number,
  adminId: string,
): Promise<SolarLumpPaymentResult> {
  if (amount <= 0) return { ok: false, status: 400, error: "Amount must be greater than zero." };

  const { data: plan } = await supabase.from("Plan").select("*").eq("solarApplicationId", applicationId).maybeSingle<Plan>();
  if (!plan || plan.status !== "active") return { ok: false, status: 409, error: "This plan isn't in active repayment." };

  const existing = unwrap(await supabase.from("PlanPayment").select("*").eq("planId", plan.id)) as PlanPayment[];
  const unpaid = planPeriods({
    price: plan.productPrice,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: new Date(plan.startDate).toISOString(),
    paidIndices: existing.map((p) => p.periodIndex),
  })
    .filter((p) => p.status !== "paid")
    .sort((a, b) => a.index - b.index);

  let remaining = amount;
  let periodsConfirmed = 0;
  let last: { amountAllocated: number; planStatus: string } | null = null;

  for (const period of unpaid) {
    if (remaining < period.amount) break;
    const result = await confirmSolarPeriod(applicationId, period.index, adminId, { allowAhead: true });
    if (!result.ok) return result;
    remaining -= period.amount;
    periodsConfirmed++;
    last = result;
  }

  if (remaining > 0) {
    const { data: wallet } = await supabase.from("Wallet").select("*").eq("customerId", plan.customerId).maybeSingle<Wallet>();
    if (wallet) {
      await supabase.from("Transaction").insert({
        walletId: wallet.id,
        type: "deposit",
        amount: remaining,
        planId: plan.id,
        approved: true,
      });
      await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta: remaining });
    }
  }

  return {
    ok: true,
    amountAllocated: last?.amountAllocated ?? plan.amountAllocated,
    planStatus: last?.planStatus ?? plan.status,
    periodsConfirmed,
    leftover: remaining,
  };
}

/**
 * After the linked Plan is deleted (admin "delete plan" — see reversePlan in
 * lifecycle.ts), reset the SolarApplication back to awaiting-deposit so the
 * admin can redo confirmSolarDeposit from a clean state. The registration
 * fee is untouched — it was never added to wallet totalBalance and is
 * intentionally never reversible.
 *
 * reversePlan already reversed `plan.amountAllocated` (the repayment periods)
 * from totalBalance/spentOnProducts, but the initial deposit lives outside
 * `amountAllocated` (it's booked in confirmSolarDeposit, before the plan even
 * has a schedule) — so it needs its own reversal here, using the package this
 * application points to.
 */
export async function revertSolarApplicationAfterPlanDeletion(applicationId: string, plan: Plan): Promise<void> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();

  if (application) {
    const { data: pkg } = await supabase.from("SolarPackage").select("*").eq("id", application.packageId).maybeSingle<SolarPackage>();
    if (pkg) {
      const { data: wallet } = await supabase.from("Wallet").select("*").eq("customerId", application.customerId).maybeSingle<Wallet>();
      if (wallet) {
        await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta: -pkg.initialDeposit });
        // Installed panels stay installed — this mirrors reversePlan's "undo the
        // ledger as if it never happened" behaviour, not a real repossession.
        // Once installed, every naira (deposit + every confirmed repayment
        // period) was credited as spent — reversePlan skips solar entirely for
        // spentOnProducts, so both portions are reversed together here.
        if (plan.status !== "awaiting_installation") {
          await supabase.rpc("inc_wallet_spent", { w_id: wallet.id, delta: -(pkg.initialDeposit + plan.amountAllocated) });
        }
      }
    }
  }

  await supabase
    .from("SolarApplication")
    .update({ status: "approved_awaiting_deposit", depositSubmittedAt: null, depositPaidAt: null })
    .eq("id", applicationId);
}

/** Manual-only default marker (no auto-detection) — terminal, frees the one-per-customer gate. */
export async function markSolarDefaulted(applicationId: string): Promise<SolarResult<{ application: SolarApplication }>> {
  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle<SolarApplication>();
  if (!application) return { ok: false, status: 404, error: "Application not found." };
  if (application.status !== "active_repayment") {
    return { ok: false, status: 409, error: "Only an active repayment plan can be marked defaulted." };
  }

  await supabase.from("Plan").update({ status: "defaulted" }).eq("solarApplicationId", applicationId);

  const updated = unwrap(
    await supabase
      .from("SolarApplication")
      .update({ status: "defaulted" })
      .eq("id", applicationId)
      .select("*")
      .single(),
  ) as SolarApplication;

  return { ok: true, application: updated };
}
