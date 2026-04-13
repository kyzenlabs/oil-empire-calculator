

(function () {
  const POLL_INTERVAL_MS = 30_000; // 30 seconds
  const ENDPOINT = "/.netlify/functions/get-price";


  function el(id) { return document.getElementById(id); }

  function formatRelativeTime(isoString) {
    if (!isoString) return "unknown";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  async function fetchPrice() {
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      const data = await res.json();

      if (data.ok && data.price !== null) {
        
        const priceEl = el("gas-price-value");
        if (priceEl) priceEl.textContent = `$${data.price}`;

        
        const updEl = el("gas-price-updated");
        if (updEl) updEl.textContent = formatRelativeTime(data.updatedAt);

    
        const statusEl = el("gas-price-status");
        if (statusEl) { statusEl.textContent = ""; statusEl.className = ""; }

      
        document.dispatchEvent(new CustomEvent("gasPriceUpdated", {
          detail: { price: data.price, updatedAt: data.updatedAt },
        }));
      } else {
        const statusEl = el("gas-price-status");
        if (statusEl) {
          statusEl.textContent = data.error || "Price unavailable";
          statusEl.className = "price-status-warning";
        }
      }
    } catch (err) {
      console.warn("[gas-price] fetch failed:", err.message);
      const statusEl = el("gas-price-status");
      if (statusEl) {
        statusEl.textContent = "Could not reach price server";
        statusEl.className = "price-status-error";
      }
    }
  }

 
  fetchPrice();
  setInterval(fetchPrice, POLL_INTERVAL_MS);


  window.refreshGasPrice = fetchPrice;
})();
