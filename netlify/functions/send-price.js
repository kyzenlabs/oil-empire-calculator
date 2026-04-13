// netlify/functions/send-price.js
//
// Receives a gas price from your Roblox game (or any trusted caller),
// validates the API key, stores it in memory, and forwards it to Discord.
//
// Environment variables required (set in Netlify dashboard, never in code):
//   DISCORD_WEBHOOK_URL  — your full Discord webhook URL
//   API_SECRET_KEY       — a long random string you generate yourself

// Module-level variable persists for the lifetime of the Lambda instance.
// NOTE: Netlify Functions are stateless — this resets on cold starts.
// For true persistence across restarts, swap this for a KV store like
// Netlify Blobs, Upstash Redis, or a free PlanetScale DB row.
let latestPrice = null;
let lastUpdated = null;

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // ── API key validation ──────────────────────────────────────────────────
  // The key must arrive in the x-api-key header.
  // process.env.API_SECRET_KEY is injected by Netlify — it never touches
  // your repo or your frontend bundle.
  const incomingKey = event.headers["x-api-key"] || "";
  const expectedKey = process.env.API_SECRET_KEY || "";

  if (!expectedKey) {
    // Mis-configuration guard — fail loudly in logs, not to the caller
    console.error("API_SECRET_KEY environment variable is not set!");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server misconfiguration" }),
    };
  }

  if (incomingKey !== expectedKey) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "price must be a non-negative number" }),
    };
  }

  // ── Store in memory ─────────────────────────────────────────────────────
  latestPrice = price;
  lastUpdated = new Date().toISOString();

  // ── Forward to Discord ──────────────────────────────────────────────────
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL environment variable is not set!");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server misconfiguration" }),
    };
  }

  const embed = {
    title: "⛽ Gas Price Update",
    color: 0x2563eb,
    fields: [
      { name: "New Price", value: `$${price} per unit`, inline: true },
      { name: "Updated", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    ],
    footer: { text: "Oil Empire Calculator" },
  };

  try {
    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      console.error("Discord webhook error:", discordRes.status, text);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Discord delivery failed" }),
      };
    }
  } catch (err) {
    console.error("Fetch to Discord failed:", err.message);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Could not reach Discord" }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      price,
      updatedAt: lastUpdated,
    }),
  };
};

// Export price state so get-price.js can import it when bundled together.
// (Works only if both functions share the same Lambda instance, which is
//  not guaranteed. For reliable cross-function state, use external storage.)
exports.getState = () => ({ latestPrice, lastUpdated });