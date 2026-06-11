import type { MetadataRoute } from "next";

import { listCategories } from "@/lib/server/catalog";

const BASE_URL = "https://ocarephinas.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await listCategories();

  const staticRoutes = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" as const },
    ...categories.map((c) => ({
      url: `${BASE_URL}/category/${c.slug}`,
      priority: 0.8,
      changeFrequency: "daily" as const,
    })),
    { url: `${BASE_URL}/login`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${BASE_URL}/register`, priority: 0.5, changeFrequency: "yearly" as const },
    { url: `${BASE_URL}/how-to-pay`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/delivery`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/about`, priority: 0.4, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/contact`, priority: 0.4, changeFrequency: "monthly" as const },
  ];

  return staticRoutes.map(({ url, priority, changeFrequency }) => ({
    url,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
