/**
 * Netlify Scheduled Function: Recomputes installment plan arrears daily.
 *
 * Runs automatically every day at 06:00 UTC.
 * Calls the internal /api/cron/recompute-arrears route with CRON_SECRET.
 */
export default async () => {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[scheduled-arrears] CRON_SECRET is not configured in Netlify environment variables.");
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const targetUrl = `${siteUrl.replace(/\/$/, "")}/api/cron/recompute-arrears`;
    console.log(`[scheduled-arrears] Triggering arrears recompute at ${targetUrl}...`);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "x-cron-secret": cronSecret,
        "Content-Type": "application/json",
      },
    });

    const body = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      data = { raw: body };
    }

    console.log(`[scheduled-arrears] Finished with status ${res.status}:`, data);

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[scheduled-arrears] Failed to execute cron request:", err);
    return new Response(
      JSON.stringify({ error: "Failed to invoke arrears endpoint", details: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const config = {
  schedule: "0 6 * * *",
};

