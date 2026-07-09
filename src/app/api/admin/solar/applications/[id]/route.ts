import { NextRequest, NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { paymentHealth, planPeriods } from "@/lib/payment-health";
import type { Plan, PlanPayment, SolarApplication, SolarInstallation, SolarPackage } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/solar/applications/:id — full detail: KYC, customer, package,
// installation, linked plan + payment schedule/history.
export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: application } = await supabase
    .from("SolarApplication")
    .select("*, customer:Customer(id,name,email,phone), reviewedBy:AdminUser!reviewedById(name)")
    .eq("id", id)
    .maybeSingle<
      SolarApplication & {
        customer: { id: string; name: string; email: string; phone: string };
        reviewedBy: { name: string } | null;
      }
    >();
  if (!application) return jsonError(404, "Application not found.");

  const [{ data: pkg }, { data: installation }, { data: plan }] = await Promise.all([
    supabase.from("SolarPackage").select("*").eq("id", application.packageId).maybeSingle<SolarPackage>(),
    supabase
      .from("SolarInstallation")
      .select("*, scheduledBy:AdminUser!scheduledById(name)")
      .eq("applicationId", id)
      .maybeSingle<SolarInstallation & { scheduledBy: { name: string } | null }>(),
    supabase.from("Plan").select("*").eq("solarApplicationId", id).maybeSingle<Plan>(),
  ]);

  let periods = null;
  let health = null;
  let payments: PlanPayment[] = [];
  if (plan) {
    payments = unwrap(
      await supabase.from("PlanPayment").select("*").eq("planId", plan.id).order("periodIndex", { ascending: true }),
    ) as PlanPayment[];
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
    payments,
    periods,
    health,
  });
}
