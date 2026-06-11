import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const BRANDS = ["LG", "Samsung", "Sony", "Mewe", "Iwin", "Binatone", "Ambiano", "Tower", "Silvercrest", "Panasonic"];
const CATEGORIES = ["Phones", "Laptops", "Tablets", "Audio", "Home Appliances", "Accessories", "Gaming", "Cameras", "Pre-owned"];

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD || "changeme123";
  const passwordHash = await bcrypt.hash(password, 10);

  // Settings singleton (mirrors the previous mock values).
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      storeName: "OCare Phinas",
      bankName: "GTBank",
      bankAccountName: "OCare Phinas Nigeria Ltd",
      bankAccountNumber: "0123456789",
      whatsappNumber: "2340000000000",
      deliveryFee: 2500,
      slotDaily: 1000,
      cycleDays: 50,
      groupSlots: 10,
      groupPriceCap: 100000,
    },
  });

  // Catalog scaffolding.
  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: slug(name) }, update: {}, create: { name, slug: slug(name) } });
  }
  for (const name of BRANDS) {
    await prisma.brand.upsert({ where: { slug: slug(name) }, update: {}, create: { name, slug: slug(name) } });
  }

  // Super admin (the owner). Sub-admins are created from the Team screen.
  await prisma.adminUser.upsert({
    where: { email: "admin@ocarephinas.com" },
    update: { name: "Ocare Phinas", role: "super", disabled: false },
    create: {
      name: "Ocare Phinas",
      email: "admin@ocarephinas.com",
      passwordHash,
      role: "super",
      mustChangePassword: false,
    },
  });

  console.info(`Seed complete. Super admin: admin@ocarephinas.com / "${password}" (change it after first login).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
