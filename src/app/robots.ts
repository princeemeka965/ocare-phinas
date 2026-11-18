import type { MetadataRoute } from "next";

const AI_AND_SCRAPER_BOTS = [
  "Bytespider",
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Amazonbot",
  "Applebot-Extended",
  "FacebookBot",
  "SemrushBot",
  "AhrefsBot",
  "DotBot",
  "PetalBot",
  "DataForSeoBot",
  "MJ12bot",
  "Baiduspider",
  "Scrapy",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block known aggressive AI crawlers and scrapers from indexing
      ...AI_AND_SCRAPER_BOTS.map((bot) => ({
        userAgent: bot,
        disallow: ["/"],
      })),
      // Legitimate search crawlers (Google, Bing, etc.)
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/cart",
          "/checkout",
          "/orders",
          "/profile",
          "/*?*", // Disallow infinite faceted query combinations
        ],
        crawlDelay: 2,
      },
    ],
    sitemap: "https://ocarephinas.com/sitemap.xml",
  };
}
