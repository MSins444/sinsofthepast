(function () {
  const CART_KEY = "stp_cart";

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function load() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  }
  function save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  // ---------- ensure drawer exists on ANY page ----------
  function ensureMiniCartMarkup() {
    if ($("#mcart") && $("#mcartOverlay")) return;

    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="mcart-overlay" id="mcartOverlay" hidden></div>

      <aside class="mcart" id="mcart" aria-labelledby="mcartTitle" aria-modal="true" role="dialog" hidden>
<div id="siteHeader"></div>

        <div class="body" id="mcartBody">
          <ul class="mc-items" id="mcartList">
            <li class="mc-empty">Your bag is empty.</li>
          </ul>
        </div>

        <div class="footer">
          <div class="row">
            <span class="muted">Subtotal</span>
            <span class="subtotal" id="mcartTotal">$0.00</span>
          </div>
          <div class="checkout">
            <a href="cart.html" class="btn">View Cart</a>
            <button class="btn primary" id="mcartCheckout" type="button">Checkout</button>
          </div>
        </div>
      </aside>
    `.trim();

    // append at end of body
    document.body.appendChild(wrap.firstElementChild);
    document.body.appendChild(wrap.lastElementChild);
  }

  ensureMiniCartMarkup();

  // ---------- elements ----------
  const overlay = $("#mcartOverlay");
  const drawer = $("#mcart");
  const closeBtn = $("#mcartClose");
  const listEl = $("#mcartList");
  const totalEl = $("#mcartTotal");
  const countEl = $("#cartCount");
  const cartLink = $("#cartLink");

  // ---------- UI ----------
  function updateCount() {
    const n = load().reduce((s, i) => s + (i.qty || 1), 0);
    if (!countEl) return;
    countEl.textContent = n ? `(${n})` : "";
    countEl.classList.remove("bump");
    void countEl.offsetWidth;
    countEl.classList.add("bump");
  }

  function render() {
    if (!listEl) return;
    const items = load();

    if (!items.length) {
      listEl.innerHTML = `<li class="mc-empty">Your bag is empty.</li>`;
      if (totalEl) totalEl.textContent = `$0.00`;
      return;
    }

    listEl.innerHTML = items.map(i => `
      <li class="mc-item">
        <img src="${i.img || ""}" alt="" onerror="this.style.display='none'">
        <div class="mc-meta">
          <b>${escapeHtml(i.name || "Product")}</b>
          <span class="mc-qty">Qty ${i.qty || 1}</span>
        </div>
        <div class="mc-price">$${(Number(i.price) * (i.qty || 1)).toFixed(2)}</div>
      </li>
    `).join("");

    const total = items.reduce((s, i) => s + (Number(i.price) * (i.qty || 1)), 0);
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  function openCart() {
    if (!drawer || !overlay) return;
    drawer.hidden = false;
    overlay.hidden = false;
    drawer.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    if (!drawer || !overlay) return;
    drawer.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    setTimeout(() => { drawer.hidden = true; overlay.hidden = true; }, 200);
  }

  function addItem({ sku, name, price, url, img }) {
    const items = load();
    const found = items.find(x => x.sku === sku);

    if (found) found.qty = (found.qty || 1) + 1;
    else items.push({
      sku,
      name,
      price: Number(price) || 0,
      url: url || location.pathname,
      img: img || "",
      qty: 1,
      addedAt: Date.now()
    });

    save(items);
    updateCount();
    render();
    openCart();
  }

  // tiny sanitizer for names injected into HTML
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- bind add buttons (works on any page) ----------
  function bindAddButtons() {
    $$(".add-to-bag, .add-to-cart").forEach(btn => {
      if (btn.dataset.mcartBound === "1") return;
      btn.dataset.mcartBound = "1";

      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const sku = btn.dataset.sku || btn.dataset.id || btn.getAttribute("data-product") || "unknown";
        const name = btn.dataset.name || "Product";
        const price = btn.dataset.price || "0";
        const url = btn.dataset.url || location.pathname;

        // prefer data-img; fallback to nearby product image
        const img =
          btn.dataset.img ||
          btn.closest(".card")?.querySelector(".img img")?.getAttribute("src") ||
          btn.closest(".card")?.querySelector("img")?.getAttribute("src") ||
          "";

        addItem({ sku, name, price, url, img });
      });
    });
  }

  // in case some pages render content later
  bindAddButtons();
  const mo = new MutationObserver(bindAddButtons);
  mo.observe(document.body, { childList: true, subtree: true });

  // ---------- header cart link ----------
  if (cartLink) {
    cartLink.addEventListener("click", (e) => {
      // always open drawer instead of navigating
      e.preventDefault();
      render();
      openCart();
    });
  }

  // ---------- close actions ----------
  closeBtn && closeBtn.addEventListener("click", closeCart);
  overlay && overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  // ---------- init ----------
  render();
  updateCount();
})();
