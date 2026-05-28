import type { MetadataRoute } from "next";

const BASE_URL = "https://ocarephinas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/phones`, priority: 0.9, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/laptops`, priority: 0.9, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/tablets`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/audio`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/appliances`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/accessories`, priority: 0.7, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/gaming`, priority: 0.7, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/category/cameras`, priority: 0.7, changeFrequency: "daily" as const },
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
