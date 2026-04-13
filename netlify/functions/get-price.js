let sendPriceState;
try {
  sendPriceState = require("./send-price").state;
} catch (_) {
  sendPriceState = () => ({ latestPrice: null, updatedAt: null });
}

exports.handler = async () => {
  const { latestPrice, updatedAt } = sendPriceState();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      ok: latestPrice !== null,
      price: latestPrice,
      updatedAt: updatedAt,
      error: latestPrice === null ? "No price received yet" : null,
    }),
  };
};
