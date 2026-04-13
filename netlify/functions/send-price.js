// No external dependencies — pure Node.js built-ins only.
// Stores price in module-level memory (resets on cold start, fine for
// a value that updates every ~30s from the game).

let latestPrice = null;
let updatedAt   = null;

// Export state so get-price.js can read it when running in the same instance.
exports.state = () => ({ latestPrice, updatedAt });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const incomingKey = event.headers["x-api-key"] || "";
  const expectedKey = process.env.API_SECRET_KEY || "";

  if (!expectedKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API_SECRET_KEY not set" }) };
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

  latestPrice = price;
  updatedAt   = new Date().toISOString();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, price, updatedAt }),
  };
};
