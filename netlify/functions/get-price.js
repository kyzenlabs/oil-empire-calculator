let { getState } = (() => {
  try {
    return require("./send-price");
  } catch {
    return { getState: () => ({ latestPrice: null, lastUpdated: null }) };
  }
})();

exports.handler = async () => {
  const { latestPrice, lastUpdated } = getState();

  if (latestPrice === null) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
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
      price: latestPrice,
      updatedAt: lastUpdated,
    }),
  };
};
