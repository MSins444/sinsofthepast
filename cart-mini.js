// ===== Mini-Cart + cart storage =====
(function cart(){
  const CART_KEY = 'stp_cart';
  const countEl  = document.getElementById('cartCount');

  // Drawer elements
  const drawer   = document.getElementById('mcart');
  const overlay  = document.getElementById('mcartOverlay');
  const body     = document.getElementById('mcartBody');
  const empty    = document.getElementById('mcartEmpty');
  const subtotal = document.getElementById('mcartSubtotal');
  const closeBtn = document.getElementById('mcartClose');
  const checkoutBtn = document.getElementById('mcartCheckout');

  // --- Storage helpers
  function load(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
  function save(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); }

  // --- Badge
  function updateCount(){
    const n = load().reduce((sum,i) => sum + (i.qty||1), 0);
    if (countEl){
      countEl.textContent = n ? `(${n})` : '';
      countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    }
  }

  // --- Format money (USD for now)
  const money = (n) => `$${(n||0).toFixed(2).replace(/\.00$/,'')}`;

  // --- Render drawer
  function render(){
    const items = load();
    body.querySelectorAll('.mitem').forEach(n => n.remove());
    const has = items.length > 0;
    empty.style.display = has ? 'none' : '';
    let sum = 0;

    items.forEach(it => {
      sum += (it.price||0) * (it.qty||1);
      const row = document.createElement('div');
      row.className = 'mitem';
      row.dataset.sku = it.sku;

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      // try to guess a thumb (optional): set it.url or it.img in your add-to-bag buttons if you have product images
      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      // fallback: find first image on the page that links to product url
      if (it.img) img.src = it.img;
      else img.src = (document.querySelector(`a[href="${it.url}"] img`)?.src) || 'assets/Sinsbg.png';
      thumb.appendChild(img);

      const info = document.createElement('div');
      const h4   = document.createElement('h4'); h4.textContent = it.name;
      const meta = document.createElement('div'); meta.className='meta';
      meta.textContent = money(it.price);

      const qty  = document.createElement('div'); qty.className='qty';
      const minus = document.createElement('button'); minus.type='button'; minus.textContent='−'; minus.setAttribute('aria-label',`Decrease ${it.name}`);
      const qVal = document.createElement('span'); qVal.textContent = it.qty || 1;
      const plus = document.createElement('button'); plus.type='button'; plus.textContent='+'; plus.setAttribute('aria-label',`Increase ${it.name}`);

      qty.append(minus, qVal, plus);
      info.append(h4, meta, qty);

      const rm   = document.createElement('button'); rm.className='rm'; rm.type='button'; rm.textContent='Remove';

      row.append(thumb, info, rm);
      body.appendChild(row);

      // wire qty
      minus.addEventListener('click', () => changeQty(it.sku, -1));
      plus.addEventListener('click', () => changeQty(it.sku, +1));
      rm.addEventListener('click', () => removeItem(it.sku));
    });

    subtotal.textContent = money(sum);
  }

  function changeQty(sku, delta){
    const items = load();
    const it = items.find(i => i.sku===sku);
    if (!it) return;
    it.qty = Math.max(1, (it.qty||1) + delta);
    save(items); updateCount(); render();
  }

  function removeItem(sku){
    let items = load().filter(i => i.sku !== sku);
    save(items); updateCount(); render();
  }

  function addItem({sku,name,price,url,img}){
    const items = load();
    const found = items.find(i => i.sku===sku);
    if (found) found.qty = (found.qty||1)+1;
    else items.push({sku,name,price:Number(price),url,img,qty:1, addedAt:Date.now()});
    save(items); updateCount(); openDrawer(); render();
  }

  // --- Drawer controls
  function openDrawer(){
    if (!drawer || !overlay) return;
    drawer.hidden = false; overlay.hidden = false;
    // force reflow then show
    drawer.getBoundingClientRect();
    drawer.classList.add('show'); overlay.classList.add('show');
    // focus trap start
    closeBtn?.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(){
    if (!drawer || !overlay) return;
    drawer.classList.remove('show'); overlay.classList.remove('show');
    const done = () => { drawer.hidden = true; overlay.hidden = true; drawer.removeEventListener('transitionend', done); };
    drawer.addEventListener('transitionend', done);
    document.body.style.overflow = '';
  }

  overlay?.addEventListener('click', closeDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

  // --- Wire existing Add-to-Bag buttons
  document.querySelectorAll('.add-to-bag').forEach(btn => {
    btn.addEventListener('click', () => {
      addItem({
        sku: btn.dataset.sku,
        name: btn.dataset.name,
        price: btn.dataset.price,
        url: btn.dataset.url,
        img:  btn.dataset.img // optional: add data-img to your buttons if you want explicit thumbs
      });
    });
  });

  // --- Expose a way to open from header cart link
  document.getElementById('cartLink')?.addEventListener('click', (e) => {
    // if you have a dedicated cart page, you can let it navigate; otherwise open drawer:
    e.preventDefault();
    render(); openDrawer();
  });

  // --- Init
  updateCount();
})();
