const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const incomingKey = event.headers["x-api-key"] || "";
  const expectedKey = process.env.API_SECRET_KEY || "";

  if (!expectedKey) {
    console.error("API_SECRET_KEY env var not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfiguration" }) };
  }

  if (incomingKey !== expectedKey) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "price must be a non-negative number" }) };
  }

  const updatedAt = new Date().toISOString();

  const store = getStore("gas-price");
  await store.setJSON("latest", { price, updatedAt });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, price, updatedAt }),
  };
};
