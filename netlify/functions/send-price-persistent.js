// netlify/functions/send-price-persistent.js
//
// DROP-IN REPLACEMENT for send-price.js that uses Netlify Blobs for
// true cross-instance persistence. No extra services required — Netlify
// Blobs is built into Netlify's platform.
//
// To use: rename this file to send-price.js (replacing the original),
//         and rename get-price-persistent.js to get-price.js.
//
// No npm install needed — @netlify/blobs is available in the Netlify
// Functions runtime automatically.

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const incomingKey = event.headers["x-api-key"] || "";
  const expectedKey = process.env.API_SECRET_KEY || "";
  if (!expectedKey || incomingKey !== expectedKey) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid price" }) };
  }

  const updatedAt = new Date().toISOString();

  // Persist to Netlify Blobs — survives cold starts and multiple instances.
  const store = getStore("gas-price");
  await store.setJSON("latest", { price, updatedAt });

  // Forward to Discord
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
  if (webhookUrl) {
    const embed = {
      title: "⛽ Gas Price Update",
      color: 0x2563eb,
      fields: [
        { name: "New Price", value: `$${price} per unit`, inline: true },
        { name: "Updated", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      ],
      footer: { text: "Oil Empire Calculator" },
    };
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    }).catch(err => console.error("Discord error:", err.message));
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, price, updatedAt }),
  };
};