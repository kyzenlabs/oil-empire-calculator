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
      body: JSON.stringify({
        ok: false,
        error: "No price received yet",
        price: null,
        updatedAt: null,
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      ok: true,
      price: data.price,
      updatedAt: data.updatedAt,
    }),
  };
};
