let sendPriceState;
try {
  sendPriceState = require("./send-price").state;
} catch {
  sendPriceState = () => ({ latestPrice: null, updatedAt: null });
}

exports.handler = async () => {
  const { latestPrice, updatedAt } = sendPriceState();

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  if (latestPrice === null) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ ok: false, error: "No price received yet", price: null, updatedAt: null }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, price: latestPrice, updatedAt }),
  };
};
