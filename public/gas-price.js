(function () {
  const ENDPOINT  = "/.netlify/functions/get-price";
  const POLL_MS   = 10_000;
  const MAX_RETRY = 5;
  const RETRY_MS  = 3_000;

  const COLOR_RED    = "#ef4444";
  const COLOR_GREEN  = "#22c55e";
  const COLOR_PURPLE = "#a855f7";

  let lastUpdatedAt = null;

  function getColor(price) {
    if (price >= 14) return COLOR_PURPLE;
    if (price >= 10) return COLOR_GREEN;
    return COLOR_RED;
  }

  function formatAge(iso) {
    if (!iso) return "";
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 5)    return "just now";
    if (s < 60)   return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    return Math.floor(s / 3600) + "h ago";
  }

  function injectBanner() {
    if (document.getElementById("gas-price-banner")) return;

    const banner = document.createElement("div");
    banner.id = "gas-price-banner";
    banner.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "gap:10px",
      "background:#111111",
      "border:1px solid rgba(255,255,255,0.08)",
      "border-radius:8px",
      "padding:10px 16px",
      "margin-bottom:14px",
      "font-family:inherit",
    ].join(";");

    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span id="gas-dot" style="
          display:inline-block;width:8px;height:8px;border-radius:50%;
          background:#252525;flex-shrink:0;transition:background 0.4s;
        "></span>
        <span style="font-size:12px;color:#505a66;font-weight:500;letter-spacing:0.4px;">
          Current Gas Price
        </span>
      </div>
      <div style="display:flex;align-items:baseline;gap:8px;">
        <span id="gas-price-value" style="
          font-size:24px;font-weight:700;color:#252525;
          transition:color 0.4s;letter-spacing:-0.5px;
        ">—</span>
        <span id="gas-price-age" style="font-size:10px;color:#505a66;min-width:48px;text-align:right;"></span>
      </div>
    `;

    const prodTab = document.getElementById("tab-production");
    if (!prodTab) return;
    const cards = prodTab.querySelectorAll(".card");
    const target = cards[1] || cards[0];
    if (target) target.insertAdjacentElement("afterbegin", banner);
  }

  function setDot(online) {
    const dot = document.getElementById("gas-dot");
    if (dot) dot.style.background = online ? "#22c55e" : "#252525";
  }

  function setPriceDisplay(price, updatedAt) {
    lastUpdatedAt = updatedAt;
    const el  = document.getElementById("gas-price-value");
    const age = document.getElementById("gas-price-age");
    if (!el) return;
    el.textContent = "$" + price;
    el.style.color = getColor(price);
    if (age) age.textContent = formatAge(updatedAt);
    setDot(true);
    document.dispatchEvent(new CustomEvent("gasPriceUpdated", {
      detail: { price, updatedAt },
    }));
  }

  function clearDisplay() {
    const el = document.getElementById("gas-price-value");
    if (el) { el.textContent = "—"; el.style.color = "#252525"; }
    const age = document.getElementById("gas-price-age");
    if (age) age.textContent = "";
    setDot(false);
  }

  
  setInterval(function () {
    if (!lastUpdatedAt) return;
    const age = document.getElementById("gas-price-age");
    if (age) age.textContent = formatAge(lastUpdatedAt);
  }, 1000);

  async function fetchWithRetry() {
    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const res  = await fetch(ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (data.ok && data.price !== null) {
          setPriceDisplay(data.price, data.updatedAt);
        } else {
      
          clearDisplay();
        }
        return; 
      } catch (_) {
        if (attempt < MAX_RETRY) {
          await new Promise(r => setTimeout(r, RETRY_MS));
        }
      }
    }
 
    setDot(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectBanner);
  } else {
    injectBanner();
  }

  fetchWithRetry();
  setInterval(fetchWithRetry, POLL_MS);
  window.refreshGasPrice = fetchWithRetry;
})();
