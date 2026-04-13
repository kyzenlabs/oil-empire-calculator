// netlify/functions/get-price-persistent.js
//
// Reads the latest price from Netlify Blobs. Works reliably across
// all Lambda instances and cold starts.

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  const store = getStore("gas-price");
  const data = await store.get("latest", { type: "json" }).catch(() => null);

  if (!data) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({ ok: false, error: "No price received yet", price: null }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({ ok: true, ...data }),
  };
};