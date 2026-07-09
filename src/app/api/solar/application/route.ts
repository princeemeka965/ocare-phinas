import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { paymentHealth, planPeriods } from "@/lib/payment-health";
import { submitSolarApplication } from "@/lib/server/solar-lifecycle";
import type { Plan, PlanPayment, SolarApplication, SolarInstallation, SolarPackage } from "@/lib/db/types";

// GET /api/solar/application — the customer's most recent solar application, with
// package/installation/plan detail and (once repayment is active) the schedule.
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*")
    .eq("customerId", gate.customer.id)
    .order("createdAt", { ascending: false })
    .maybeSingle<SolarApplication>();
  if (!application) return NextResponse.json({ application: null });

  const [{ data: pkg }, { data: installation }, { data: plan }] = await Promise.all([
    supabase.from("SolarPackage").select("*").eq("id", application.packageId).maybeSingle<SolarPackage>(),
    supabase.from("SolarInstallation").select("*").eq("applicationId", application.id).maybeSingle<SolarInstallation>(),
    supabase.from("Plan").select("*").eq("solarApplicationId", application.id).maybeSingle<Plan>(),
  ]);

  let periods = null;
  let health = null;
  if (plan) {
    const payments = unwrap(await supabase.from("PlanPayment").select("*").eq("planId", plan.id)) as PlanPayment[];
    periods = planPeriods({
      price: plan.productPrice,
      perPayment: plan.perPayment,
      frequency: plan.frequency,
      startDate: new Date(plan.startDate).toISOString(),
      paidIndices: payments.map((p) => p.periodIndex),
    });
    health = paymentHealth({
      price: plan.productPrice,
      amountPaid: plan.amountAllocated,
      perPayment: plan.perPayment,
      frequency: plan.frequency,
      startDate: new Date(plan.startDate).toISOString(),
    });
  }

  return NextResponse.json({
    application,
    package: pkg ?? null,
    installation: installation ?? null,
    plan: plan ?? null,
    periods,
    health,
  });
}

const submitSchema = z.object({
  packageId: z.string().min(1),
  address: z.string().min(5),
  idType: z.enum(["nin", "drivers_license", "voters_card", "passport"]),
  idDocumentUrl: z.string().url(),
  utilityBillUrl: z.string().url(),
  employmentDetails: z.string().min(3),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(6),
  chosenFrequency: z.enum(["daily", "weekly", "monthly"]),
});

// POST /api/solar/application — submit a new KYC application.
export async function POST(req: NextRequest) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const parsed = submitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "All KYC fields, a package and a repayment cadence are required.");

  const result = await submitSolarApplication({ customerId: gate.customer.id, ...parsed.data });
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application }, { status: 201 });
}
