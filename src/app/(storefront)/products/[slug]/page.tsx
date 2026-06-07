import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { getProductBySlug, listProducts } from "@/lib/server/catalog";
import { ProductDetail, type ProductDetailData } from "./product-detail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — OCare Phinas" };
  return {
    title: `${product.name} — OCare Phinas`,
    description: product.description ?? `Buy ${product.name} at OCare Phinas.`,
  };
}

function toSpecs(specs: unknown): { key: string; value: string }[] {
  if (!specs || typeof specs !== "object") return [];
  return Object.entries(specs as Record<string, unknown>).map(([key, value]) => ({ key, value: String(value) }));
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await listProducts({ category: product.category?.slug }, 5)).filter((p) => p.slug !== product.slug).slice(0, 4);

  const data: ProductDetailData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand?.name ?? "",
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    price: product.price,
    stockQuantity: product.stockQuantity,
    condition: product.condition === "new" ? "new" : "pre_owned",
    description: product.description,
    specs: toSpecs(product.specs),
    images: product.images,
  };

  return (
    <div className="py-6 sm:py-10 pb-24 lg:pb-12">
      <Container>
        <ProductDetail product={data} related={related} />
      </Container>
    </div>
  );
}
