import type { Customer } from "@prisma/client";

/** Customer fields safe to return to the client (never the password hash). */
export function publicCustomer(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    phoneVerified: c.phoneVerified,
  };
}
