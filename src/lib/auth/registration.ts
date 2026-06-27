/* Shared sign-up validation + duplicate-account guard, used by both the
 * register (send email OTP) and register/verify (create account) endpoints so
 * the rules can never drift apart. */
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { jsonError } from "@/lib/auth/guards";

export const registrationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/** Emails are matched case-insensitively, so store and compare them lowercased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Reject sign-up when the email or phone is already taken. A blocked account
 * still owns its email/phone — re-registration is not allowed (spec B9). Returns
 * a ready-to-send error response, or null when the identifiers are free.
 */
export async function duplicateAccountError(email: string, phone: string) {
  const dup = unwrap(
    await supabase
      .from("Customer")
      .select("id,blocked")
      .or(`email.eq."${email}",phone.eq."${phone}"`)
      .limit(1),
  ) as { id: string; blocked: boolean }[];

  if (!dup[0]) return null;
  if (dup[0].blocked) return jsonError(403, "This account is suspended — contact support.");
  return jsonError(409, "An account with this email or phone already exists.");
}
