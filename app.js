// year
document.addEventListener('DOMContentLoaded',()=> {
  const y = document.getElementById('y'); if (y) y.textContent = new Date().getFullYear();
});

// fancy cursor
const cr = document.createElement('div'), cd = document.createElement('div');
cr.className='cursor'; cd.className='cursor dot';
document.body.append(cr, cd);
window.addEventListener('mousemove',e=>{
  cr.style.left = cd.style.left = e.clientX+'px';
  cr.style.top  = cd.style.top  = e.clientY+'px';
});
document.querySelectorAll('a,.btn,.card').forEach(el=>{
  el.addEventListener('mouseenter',()=>{ cr.style.width='34px'; cr.style.height='34px'; });
  el.addEventListener('mouseleave',()=>{ cr.style.width='18px'; cr.style.height='18px'; });
});

// tilt
document.querySelectorAll('.tilt').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
    const rx=((y/r.height)-.5)*6, ry=((x/r.width)-.5)*8;
    card.style.transform=`perspective(800px) rotateX(${-rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave',()=> card.style.transform='none');
});

// active nav link
const path = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a').forEach(a=>{
  const href = a.getAttribute('href');
  if ((path==='index.html' && href==='#') || href===path) a.classList.add('active');
});

// ---- Simple cart helpers (localStorage) ----
window.updateBadge = function(){
  const el = document.getElementById('cartCount');
  if (!el) return;
  const cart = JSON.parse(localStorage.getItem('stp_cart')||'[]');
  const count = cart.reduce((n,i)=>n+i.qty,0);
  el.textContent = count ? `(${count})` : '';
};

window.addToCart = function(item){
  const cart = JSON.parse(localStorage.getItem('stp_cart')||'[]');
  const idx = cart.findIndex(i => i.id === item.id);
  if (idx >= 0) cart[idx].qty += item.qty||1;
  else cart.push({ id:item.id, name:item.name, price:+item.price, img:item.img||'', qty:item.qty||1 });
  localStorage.setItem('stp_cart', JSON.stringify(cart));
  updateBadge();
};

// Auto-bind any "Add to Bag" buttons on the page
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.add-to-cart');
  if (!btn) return;
  const data = {
    id:    btn.dataset.id,
    name:  btn.dataset.name,
    price: parseFloat(btn.dataset.price||'0'),
    img:   btn.dataset.img || '',
    qty:   parseInt(btn.dataset.qty||'1',10)
  };
  addToCart(data);
  btn.textContent = 'Added!';
  setTimeout(()=>{ btn.textContent='Add to Bag'; }, 900);
});

// initialize badge on page load
document.addEventListener('DOMContentLoaded', updateBadge);


// ===== Global Music Controller =====
(function(){
  // only run once
  if (window.__stpMusicInit) return;
  window.__stpMusicInit = true;

  const TRACK = 'assets/999wrld_Master.m4a';  // <-- your file
  const PREF  = 'stp_music_on';      // "1" or "0"
  const FROMCOVER = sessionStorage.getItem('stp_from_cover') === '1';

  const audio = new Audio(TRACK);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0; // fade in

  // UI: add a small MUTE/UNMUTE button to the header
  function ensureButton(){
    const header = document.querySelector('.header .nav');
    if (!header || document.getElementById('musicToggle')) return;
    const btn = document.createElement('a');
    btn.href = '#';
    btn.id = 'musicToggle';
    btn.style.marginLeft = '8px';
    btn.textContent = (localStorage.getItem(PREF) === '0') ? 'Unmute' : 'Mute';
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      if (audio.paused || localStorage.getItem(PREF)==='0') {
        localStorage.setItem(PREF, '1');
        start();
      } else {
        localStorage.setItem(PREF, '0');
        audio.pause();
        btn.textContent = 'Unmute';
      }
    });
    header.appendChild(btn);
  }

  function fadeTo(target=0.6, ms=800){
    const start = audio.volume;
    const steps = Math.max(1, Math.floor(ms/40));
    let i = 0;
    clearInterval(audio.__fadeT);
    audio.__fadeT = setInterval(()=>{
      i++;
      audio.volume = start + (target - start) * (i/steps);
      if (i>=steps) clearInterval(audio.__fadeT);
    }, 40);
  }

  async function start(){
    try{
      await audio.play();   // will succeed after a real user gesture (cover click)
      fadeTo(0.6, 900);
      const btn = document.getElementById('musicToggle');
      if (btn) btn.textContent = 'Mute';
    }catch(err){
      // If blocked, we’ll wait for a click on this page
      document.addEventListener('pointerdown', onceStart, {once:true});
    }
  }
  function onceStart(){ localStorage.setItem(PREF,'1'); start(); }

  // Auto behavior:
  // - If user came from cover (user gesture), try autoplay.
  // - Respect saved preference (mute/unmute).
  document.addEventListener('DOMContentLoaded', ()=>{
    ensureButton();
    const wantMusic = localStorage.getItem(PREF) !== '0';
    if (wantMusic && FROMCOVER) {
      start();
    } else if (wantMusic) {
      // try quietly; if blocked, the first click on page will start it
      start();
    } else {
      // user had muted before
      audio.pause();
    }
  });

  // Keyboard shortcut: press "m" to toggle
  document.addEventListener('keydown', (e)=>{
    if (e.key.toLowerCase() === 'm') {
      const btn = document.getElementById('musicToggle');
      if (btn) btn.click();
    }
  });

  // Expose for debugging
  window.STPMusic = { audio, start };
})();

// ===== Minimal Music Controller =====
(function(){
  if (window.__stpMusicInit) return; window.__stpMusicInit = true;

  const TRACK = 'assets/999wrld_Master.m4a';
  const PREF  = 'stp_music_on';  // "1" to play, "0" to keep muted
  const FROMCOVER = sessionStorage.getItem('stp_from_cover') === '1';

  const audio = new Audio(TRACK);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.6;

  function ensureButton(){
    const nav = document.querySelector('.header .nav');
    if (!nav || document.getElementById('musicToggle')) return;
    const a = document.createElement('a');
    a.href = '#'; a.id = 'musicToggle'; a.style.marginLeft = '8px';
    a.textContent = (localStorage.getItem(PREF) === '0') ? 'Unmute' : 'Mute';
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      if (localStorage.getItem(PREF) === '0') {
        localStorage.setItem(PREF, '1');
        start();
      } else {
        localStorage.setItem(PREF, '0');
        audio.pause();
        a.textContent = 'Unmute';
      }
    });
    nav.appendChild(a);
  }

  function start(){
    audio.play().then(()=>{
      const t = document.getElementById('musicToggle');
      if (t) t.textContent = 'Mute';
    }).catch(()=>{
      // if blocked, start on first pointer gesture on this page
      document.addEventListener('pointerdown', once, {once:true});
    });
  }
  function once(){ localStorage.setItem(PREF,'1'); start(); }

  document.addEventListener('DOMContentLoaded', ()=>{
    ensureButton();
    const want = localStorage.getItem(PREF) !== '0';
    if (!want) return;               // user muted previously
    if (FROMCOVER) start();          // arrived from click → should autoplay
    else start();                    // try anyway; will resume on first click if blocked
  });
})();
