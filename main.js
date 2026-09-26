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
