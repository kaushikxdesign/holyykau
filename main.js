document.documentElement.classList.add('js');
// Play the greeting loader once per visit.
try { const l = document.querySelector('.loader'); if (l) { if (sessionStorage.getItem('seenLoader')) l.classList.add('skip'); else sessionStorage.setItem('seenLoader', '1'); } } catch (e) {}
document.addEventListener('DOMContentLoaded', () => {
  // Failsafe: reveal everything if the observer never fires (e.g. sandboxed viewers).
  setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('in'); }), 1200);
  const tt = document.querySelector('.totop'); if (tt) tt.addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
  const io = new IntersectionObserver((es) => es.forEach((x) => {
    if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
  }), { threshold: 0.08 });
  const tilt = (i) => [-3, 2, -1.5, 3, -2.5, 1.5][i % 6];
  const card = (inner, cap, i, href) => {
    const tag = href ? 'a' : 'figure';
    const h = href ? ` href="${href}" target="_blank" rel="noopener"` : '';
    return `<${tag} class="pola rv"${h} style="transform:rotate(${tilt(i)}deg)"><span class="tape"></span>${inner}<figcaption>${cap}</figcaption><span class="no">${String(i + 1).padStart(2, '0')}</span></${tag}>`;
  };
  const sEl = document.getElementById('shots-grid');
  if (sEl) sEl.innerHTML = (window.SHOTS || []).map((s, i) => card(
    s.img ? `<img src="${s.img}" alt="${s.title}" loading="lazy">` : `<div class="ph" style="--r:4/3">shot · add image</div>`, s.title, i, s.url)).join('');
  const pEl = document.getElementById('photos-grid');
  if (pEl) pEl.innerHTML = (window.PHOTOS || []).map((p, i) => card(
    p.src ? `<img src="${p.src}" alt="${p.alt || ''}" loading="lazy">` : `<div class="ph" style="--r:${p.ratio || '4/5'}">photo · add image</div>`, p.caption || p.alt || 'untitled', i)).join('');
  document.querySelectorAll('.rv').forEach((el) => io.observe(el));
  const lb = document.querySelector('.lightbox');
  if (pEl && lb) {
    pEl.addEventListener('click', (e) => { const img = e.target.closest('.pola img'); if (!img) return; lb.innerHTML = `<img src="${img.src}" alt="${img.alt}">`; lb.classList.add('on'); });
    lb.addEventListener('click', () => lb.classList.remove('on'));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && lb.classList.remove('on'));
  }
});

// Live LED matrix: 4px cells, 2px gap; lit cells get denser toward the bottom and twinkle.
document.querySelectorAll('canvas.led').forEach((c) => { try {
  const ctx = c.getContext('2d'), CELL = 4, GAP = 2, STEP = CELL + GAP;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cols, rows, life, dpr;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = c.getBoundingClientRect();
    c.width = r.width * dpr; c.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(r.width / STEP); rows = Math.ceil(r.height / STEP);
    life = new Float32Array(cols * rows);
    for (let i = 0; i < life.length; i++) if (Math.random() < odds(Math.floor(i / cols)) * 6) life[i] = Math.random();
  };
  const odds = (y) => 0.0009 + Math.pow(y / rows, 2.2) * 0.012; // bottom-weighted
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x, v = life[i];
      if (v > 0) {
        ctx.fillStyle = `rgba(${Math.round(18 + (1 - v) * 100)},${Math.round(69 + (1 - v) * 90)},255,${0.25 + v * 0.75})`;
      } else ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fillRect(x * STEP, y * STEP, CELL, CELL);
    }
  };
  const tick = () => {
    for (let i = 0; i < life.length; i++) {
      if (life[i] > 0) { life[i] -= 0.012 + Math.random() * 0.01; if (life[i] < 0) life[i] = 0; }
      else if (Math.random() < odds(Math.floor(i / cols)) * 0.12) life[i] = 1;
    }
    draw();
  };
  size(); draw();
  addEventListener('resize', () => { size(); draw(); });
  if (still) return;
  let last = 0, on = true;
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(c);
  const loop = (t) => { if (on && t - last > 1000 / 30) { last = t; tick(); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  } catch (e) { c.remove(); }
});

// Rolling testimonials
(() => {
  const root = document.querySelector('.tst'); if (!root) return;
  const items = [...root.querySelectorAll('.tst-item')], dots = root.querySelector('.tst-dots');
  if (items.length < 2 || !dots) return; // a single quote just sits still
  let i = 0, timer;
  items.forEach((_, n) => { const b = document.createElement('button'); b.setAttribute('aria-label', `Show testimonial ${n + 1}`); b.onclick = () => go(n, true); dots.appendChild(b); });
  const go = (n, user) => {
    i = (n + items.length) % items.length;
    items.forEach((el, k) => el.classList.toggle('on', k === i));
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    if (user) start();
  };
  const start = () => { clearInterval(timer); if (items.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go(i + 1), 6000); };
  root.querySelector('.tst-prev').onclick = () => go(i - 1, true);
  root.querySelector('.tst-next').onclick = () => go(i + 1, true);
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', start);
  go(0); start();
})();

// Keep வணக்கம் inside the width set by "Madras", whatever font loads.
(() => {
  const fitTamil = () => document.querySelectorAll('.hi').forEach((hi) => {
    const a = hi.querySelector('.hi-a'), b = hi.querySelector('.hi-b'); if (!a || !b) return;
    b.style.fontSize = '14px';
    const room = a.getBoundingClientRect().width, need = b.scrollWidth;
    if (need > room && need > 0) b.style.fontSize = Math.max(9, Math.floor(14 * room / need * 10) / 10) + 'px';
  });
  fitTamil();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTamil);
  addEventListener('load', fitTamil);
})();

// Glass cursor: a lens that follows the pointer and refracts what's behind it.
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const S = 32, R = S / 2;
  const map = document.createElement('canvas'); map.width = map.height = S;
  const cx = map.getContext('2d'), img = cx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x - R + .5) / R, dy = (y - R + .5) / R, d = Math.hypot(dx, dy), i = (y * S + x) * 4;
    const k = d < 1 ? Math.pow(d, 2.2) : 0; // bend light more towards the rim, like a convex lens
    img.data[i] = 128 - dx * k * 127; img.data[i + 1] = 128 - dy * k * 127; img.data[i + 2] = 128; img.data[i + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="glass-lens" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="${map.toDataURL()}" x="0" y="0" width="${S}" height="${S}" preserveAspectRatio="none" result="m"/><feDisplacementMap in="SourceGraphic" in2="m" scale="13" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  document.body.appendChild(svg);
  const c = document.createElement('div'); c.className = 'gcur'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<i></i>';
  document.body.appendChild(c); document.documentElement.classList.add('has-gcur');
  let x = -100, y = -100, tx = x, ty = y, raf = 0;
  const tick = () => { x += (tx - x) * .32; y += (ty - y) * .32; c.style.transform = `translate3d(${x}px,${y}px,0)`; raf = Math.abs(tx - x) + Math.abs(ty - y) > .1 ? requestAnimationFrame(tick) : 0; };
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY; c.classList.add('on');
    c.classList.toggle('hot', !!e.target.closest('a,button,summary,[role=button],label,.pc,.jf,.totop'));
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('on'));
  addEventListener('pointerdown', () => c.classList.add('down')); addEventListener('pointerup', () => c.classList.remove('down'));
})();

// "What we built": as the next card slides over, the previous one shrinks and dims.
(() => {
  const stacks = document.querySelectorAll('.x-scards');
  if (!stacks.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    stacks.forEach((st) => {
      const cards = [...st.querySelectorAll('.x-scard')];
      cards.forEach((c, i) => {
        const inner = c.firstElementChild, next = cards[i + 1];
        let p = 0;
        if (next) {
          const r = c.getBoundingClientRect(), nr = next.getBoundingClientRect();
          p = Math.min(1, Math.max(0, (r.bottom - nr.top) / r.height));
        }
        inner.style.transform = `scale(${1 - p * 0.06})`;
        inner.style.filter = `brightness(${1 - p * 0.45})`;
      });
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); addEventListener('hashchange', () => setTimeout(update, 50)); update();
})();
