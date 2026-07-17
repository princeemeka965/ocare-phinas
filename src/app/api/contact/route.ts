import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { jsonError } from "@/lib/auth/guards";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

// Public — stores a /contact form submission for the admin team to follow up on.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Please fill in all required fields.");

  const { name, email, phone, subject, message } = parsed.data;
  await supabase.from("ContactMessage").insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || null,
    subject,
    message: message.trim(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
