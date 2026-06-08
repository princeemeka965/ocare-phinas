import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * One-off: reset the super admin's password to the current SEED_ADMIN_PASSWORD.
 * The seed only sets the password on first create, so use this to rotate it.
 *   node --env-file=.env --import tsx prisma/reset-admin-password.ts
 */
const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error("SEED_ADMIN_PASSWORD is not set.");
  const email = process.env.SEED_ADMIN_EMAIL || "admin@ocarephinas.com";

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.update({
    where: { email },
    data: { passwordHash, mustChangePassword: false },
  });

  console.info(`Password reset for super admin: ${admin.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
