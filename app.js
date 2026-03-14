// year
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});

// fancy cursor
const cr = document.createElement('div');
const cd = document.createElement('div');
cr.className = 'cursor';
cd.className = 'cursor dot';
document.body.append(cr, cd);

window.addEventListener('mousemove', (e) => {
  cr.style.left = cd.style.left = e.clientX + 'px';
  cr.style.top = cd.style.top = e.clientY + 'px';
});

document.querySelectorAll('a,.btn,.card').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cr.style.width = '34px';
    cr.style.height = '34px';
  });
  el.addEventListener('mouseleave', () => {
    cr.style.width = '18px';
    cr.style.height = '18px';
  });
});

// tilt
document.querySelectorAll('.tilt').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = ((y / r.height) - 0.5) * 6;
    const ry = ((x / r.width) - 0.5) * 8;
    card.style.transform = `perspective(800px) rotateX(${-rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'none';
  });
});

// active nav link
const path = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a').forEach((a) => {
  const href = a.getAttribute('href');
  if ((path === 'index.html' && href === '#') || href === path) a.classList.add('active');
});

// ---- Simple cart helpers (localStorage) ----
window.updateBadge = function () {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const cart = JSON.parse(localStorage.getItem('stp_cart') || '[]');
  const count = cart.reduce((n, i) => n + i.qty, 0);
  el.textContent = count ? `(${count})` : '';
};

window.addToCart = function (item) {
  const cart = JSON.parse(localStorage.getItem('stp_cart') || '[]');
  const idx = cart.findIndex((i) => i.id === item.id);
  if (idx >= 0) cart[idx].qty += item.qty || 1;
  else cart.push({ id: item.id, name: item.name, price: +item.price, img: item.img || '', qty: item.qty || 1 });
  localStorage.setItem('stp_cart', JSON.stringify(cart));
  updateBadge();
};

// Auto-bind any "Add to Bag" buttons on the page
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart');
  if (!btn) return;
  const data = {
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: parseFloat(btn.dataset.price || '0'),
    img: btn.dataset.img || '',
    qty: parseInt(btn.dataset.qty || '1', 10)
  };
  addToCart(data);
  btn.textContent = 'Added!';
  setTimeout(() => {
    btn.textContent = 'Add to Bag';
  }, 900);
});

document.addEventListener('DOMContentLoaded', updateBadge);

// ===== Global Music Controller =====
(function () {
  if (window.__stpMusicInit) return;
  window.__stpMusicInit = true;

  const TRACK = 'assets/999wrld_Master.m4a';
  const PREF = 'stp_music_on';
  const TARGET_VOLUME = 0.6;
  let waitingForGesture = false;

  const audio = new Audio(TRACK);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;

  function syncButtons() {
    const isMuted = localStorage.getItem(PREF) === '0';
    document.querySelectorAll('#musicToggle').forEach((btn) => {
      btn.textContent = isMuted ? 'Unmute' : 'Mute';
      btn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
      btn.setAttribute('aria-label', isMuted ? 'Unmute site music' : 'Mute site music');
    });
  }

  function getMountPoint() {
    return document.querySelector('.header-right') ||
      document.querySelector('.header-meta') ||
      document.querySelector('.header .nav') ||
      document.querySelector('#siteHeader nav');
  }

  function ensureButton() {
    const host = getMountPoint();
    if (!host || document.getElementById('musicToggle')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'musicToggle';
    btn.className = 'music-toggle';
    btn.addEventListener('click', () => {
      const isMuted = localStorage.getItem(PREF) === '0';
      if (isMuted) {
        localStorage.setItem(PREF, '1');
        start();
      } else {
        localStorage.setItem(PREF, '0');
        clearInterval(audio.__fadeT);
        audio.pause();
        waitingForGesture = false;
        syncButtons();
      }
    });

    host.prepend(btn);
    syncButtons();
  }

  function fadeTo(target = TARGET_VOLUME, ms = 800) {
    const startVolume = audio.volume;
    const steps = Math.max(1, Math.floor(ms / 40));
    let step = 0;
    clearInterval(audio.__fadeT);
    audio.__fadeT = setInterval(() => {
      step++;
      audio.volume = startVolume + (target - startVolume) * (step / steps);
      if (step >= steps) clearInterval(audio.__fadeT);
    }, 40);
  }

  async function start() {
    if (localStorage.getItem(PREF) === '0') {
      syncButtons();
      return;
    }

    try {
      await audio.play();
      waitingForGesture = false;
      fadeTo(TARGET_VOLUME, 900);
      syncButtons();
    } catch (err) {
      if (waitingForGesture) return;
      waitingForGesture = true;
      document.addEventListener('pointerdown', startOnGesture, { once: true });
    }
  }

  function startOnGesture() {
    waitingForGesture = false;
    if (localStorage.getItem(PREF) !== '0') start();
  }

  function bootMusic() {
    ensureButton();
    syncButtons();
    if (localStorage.getItem(PREF) === '0') {
      audio.pause();
      return;
    }
    start();
  }

  document.addEventListener('DOMContentLoaded', bootMusic);
  window.addEventListener('stp:header:ready', ensureButton);

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'm') return;
    const btn = document.getElementById('musicToggle');
    if (btn) btn.click();
  });

  window.STPMusic = { audio, start, syncButtons };
})();
