import { NextRequest, NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import type { Group } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/groups/:id/close — close a group to new members.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("groups");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: group } = await supabase.from("Group").select("id").eq("id", id).maybeSingle();
  if (!group) return jsonError(404, "Group not found.");

  const updated = unwrap(
    await supabase.from("Group").update({ status: "closed" }).eq("id", id).select("*").single(),
  ) as Group;
  return NextResponse.json({ group: updated });
}
