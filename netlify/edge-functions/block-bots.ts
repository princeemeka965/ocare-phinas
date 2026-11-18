/**
 * Netlify Edge Function: Blocks aggressive AI scrapers, bots, and crawlers
 * at the edge network before they reach Next.js or consume site bandwidth.
 */
const BLOCKED_BOT_STRINGS = [
  "bytespider",
  "gptbot",
  "chatgpt-user",
  "ccbot",
  "anthropic-ai",
  "claudebot",
  "claude-web",
  "perplexitybot",
  "amazonbot",
  "petalbot",
  "semrushbot",
  "ahrefsbot",
  "dataforseobot",
  "mj12bot",
  "dotbot",
  "blexbot",
  "scrapy",
  "baiduspider",
  "sogou",
  "zoominfobot",
  "seekport",
  "criteo",
];

export default async function (request: Request, context: { next: () => Promise<Response> }) {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();

  // 1. Block known aggressive scrapers and AI bots
  if (BLOCKED_BOT_STRINGS.some((bot) => ua.includes(bot))) {
    return new Response("Forbidden: Bot traffic not allowed", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 2. Block Netlify's automated edge categorization if flagged
  const category = (request.headers.get("netlify-agent-category") || "").toLowerCase();
  if (category === "ai-crawler" || category === "scraper") {
    return new Response("Forbidden: Automated scraper traffic not allowed", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return context.next();
}

