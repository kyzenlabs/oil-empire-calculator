let latestPrice = null;
let updatedAt   = null;

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: latestPrice !== null,
        price: latestPrice,
        updatedAt: updatedAt,
        error: latestPrice === null ? "No price received yet" : null,
      }),
    };
  }

  if (event.httpMethod === "POST") {
    const incomingKey = event.headers["x-api-key"] || "";
    const expectedKey = process.env.API_SECRET_KEY || "";

    if (!expectedKey || incomingKey !== expectedKey) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    let body;
    try { body = JSON.parse(event.body || "{}"); } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid price" }) };
    }

    latestPrice = price;
    updatedAt   = new Date().toISOString();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, price, updatedAt }),
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
