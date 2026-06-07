import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth/guards";

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
        qty: z.number().int().min(1),
        price: z.number().int().optional(), // client's stored price, to detect changes
      }),
    )
    .max(100),
});

// Public — re-validate a cart against live products before showing it / checking out.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid cart payload.");

  type Issue = "unavailable" | "out_of_stock" | "reduced_qty" | "price_changed" | null;

  const validated = await Promise.all(
    parsed.data.items.map(async (item) => {
      const product = item.id
        ? await prisma.product.findUnique({ where: { id: item.id } })
        : item.slug
          ? await prisma.product.findUnique({ where: { slug: item.slug } })
          : null;

      if (!product || !product.active) {
        return {
          id: item.id ?? null, slug: item.slug ?? null, name: null, image: null,
          price: null as number | null, stockQuantity: null as number | null,
          requestedQty: item.qty, qty: 0, ok: false, issue: "unavailable" as Issue,
        };
      }

      const qty = Math.min(item.qty, product.stockQuantity);
      const issue: Issue =
        product.stockQuantity === 0
          ? "out_of_stock"
          : qty < item.qty
            ? "reduced_qty"
            : item.price !== undefined && item.price !== product.price
              ? "price_changed"
              : null;

      return {
        id: product.id, slug: product.slug, name: product.name, image: product.images[0] ?? null,
        price: product.price as number | null, stockQuantity: product.stockQuantity as number | null,
        requestedQty: item.qty, qty, ok: product.stockQuantity > 0 && issue === null, issue,
      };
    }),
  );

  const subtotal = validated.reduce((s, v) => s + (v.price ?? 0) * v.qty, 0);
  const hasIssues = validated.some((v) => v.issue != null || !v.ok);
  return NextResponse.json({ items: validated, subtotal, hasIssues });
}
