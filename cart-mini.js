(() => {
  const CART_KEY = 'stp_cart';

  function load(){
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  }
  function save(items){
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function initMiniCart(){
    const overlay  = document.getElementById('mcartOverlay');
    const drawer   = document.getElementById('mcart');
    const closeBtn = document.getElementById('mcartClose');
    const listEl   = document.getElementById('mcartList');
    const totalEl  = document.getElementById('mcartTotal');
    const countEl  = document.getElementById('cartCount');
    const cartLink = document.getElementById('cartLink');

    function updateCount(){
      const n = load().reduce((s,i)=> s + (i.qty || 1), 0);
      if (!countEl) return;
      countEl.textContent = n ? `(${n})` : '';
      countEl.classList.remove('bump');
      void countEl.offsetWidth;
      countEl.classList.add('bump');
    }

    function render(){
      if (!listEl) return;

      const items = load();

      if (!items.length){
        listEl.innerHTML = `<li class="mc-empty">Your bag is empty.</li>`;
        if (totalEl) totalEl.textContent = `$0.00`;
        return;
      }

      listEl.innerHTML = items.map(i => `
        <li class="mc-item">
          <img src="${i.img || ''}" alt="" onerror="this.style.display='none'">
          <div class="mc-meta">
            <b>${i.name || 'Product'}</b>
            <span class="mc-qty">Qty ${i.qty || 1}</span>
          </div>
          <div class="mc-price">$${(Number(i.price) * (i.qty || 1)).toFixed(2)}</div>
        </li>
      `).join('');

      const total = items.reduce((s,i)=> s + (Number(i.price) * (i.qty || 1)), 0);
      if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    function openCart(){
      if (!drawer || !overlay) return;
      drawer.hidden = false;
      overlay.hidden = false;
      drawer.classList.add('open');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeCart(){
      if (!drawer || !overlay) return;
      drawer.classList.remove('open');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
      setTimeout(()=>{ drawer.hidden = true; overlay.hidden = true; }, 200);
    }

    function addItem({sku,name,price,url,img}){
      const items = load();
      const found = items.find(x => x.sku === sku);

      if (found) found.qty = (found.qty || 1) + 1;
      else items.push({
        sku,
        name,
        price: Number(price) || 0,
        url: url || location.pathname,
        img: img || '',
        qty: 1,
        addedAt: Date.now()
      });

      save(items);
      updateCount();
      render();
      openCart();
    }

    // ✅ Attach Add to Bag buttons
    document.querySelectorAll('.add-to-bag, .add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const sku   = btn.dataset.sku || btn.dataset.id || 'unknown';
        const name  = btn.dataset.name || 'Product';
        const price = btn.dataset.price || '0';
        const url   = btn.dataset.url || location.pathname;

        const img =
          btn.dataset.img ||
          btn.closest('.card')?.querySelector('.img img')?.getAttribute('src') ||
          btn.closest('.card')?.querySelector('img')?.getAttribute('src') ||
          '';

        addItem({sku, name, price, url, img});
      });
    });

    // Header cart link opens drawer
    if (cartLink){
      cartLink.addEventListener('click', (e)=>{
        // only prevent default if drawer exists
        if (drawer && overlay){
          e.preventDefault();
          render();
          openCart();
        }
      });
    }

    // Close actions
    closeBtn?.addEventListener('click', closeCart);
    overlay?.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeCart(); });

    // Start state
    render();
    updateCount();
  }

  // ✅ Run AFTER the page is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMiniCart);
  } else {
    initMiniCart();
  }
})();
