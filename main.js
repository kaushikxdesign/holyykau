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

// Brand colours for the canvas animations, read from the CSS colour tokens so the palette lives in one place.
const TOK = (() => {
  const cs = getComputedStyle(document.documentElement);
  const rgb = (name, fb) => { const h = (cs.getPropertyValue(name).trim() || fb).replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const str = (name, fb) => cs.getPropertyValue(name).trim() || fb;
  return { accent: rgb('--accent', '#0A84FF'), soft: rgb('--accent-soft', '#78BBFF'), pale: rgb('--accent-pale', '#A2D0FF'), white: rgb('--white', '#fff'),
    dot: str('--grid-dot', 'rgba(255,255,255,.045)'), dotFaint: str('--grid-dot-faint', 'rgba(255,255,255,.035)') };
})();
const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',');
const toHex = (c) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

// Live LED matrix: 4px cells, 2px gap; lit cells get denser toward the bottom and twinkle.
document.querySelectorAll('canvas.led').forEach((c) => { try {
  const ctx = c.getContext('2d'), CELL = 4, GAP = 2, STEP = CELL + GAP;
  const mono = c.classList.contains('mono'); // monochrome variant (testimonial card)
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
        ctx.fillStyle = mono ? `rgba(${TOK.white.join(',')},${0.12 + v * 0.6})` : `rgba(${mixRGB(TOK.accent, TOK.pale, 1 - v)},${0.25 + v * 0.75})`;
      } else ctx.fillStyle = TOK.dot;
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

// "Say hello": on hover, a line of text slithers around the button's border.
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  document.querySelectorAll('[data-snake]').forEach((btn, n) => {
    const wrap = btn.parentElement, msg = btn.dataset.snake;
    const svg = document.createElementNS(ns, 'svg'); svg.classList.add('snake'); svg.setAttribute('aria-hidden', 'true');
    const id = 'snk' + n;
    svg.innerHTML = `<path id="${id}" fill="none"/><path class="trail"/><text><textPath href="#${id}" startOffset="0"></textPath></text>`;
    wrap.appendChild(svg);
    const path = svg.querySelector('path'), trail = svg.querySelector('.trail'), tp = svg.querySelector('textPath');
    tp.textContent = msg;
    let loop = 0;
    const build = () => {
      const w = btn.offsetWidth, h = btn.offsetHeight, g = 13, r = Math.min(h / 2, 16) + g;
      const x0 = -g, y0 = -g, x1 = w + g, y1 = h + g;
      svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // one clockwise lap of a rounded rect around the button, starting bottom-centre
      const lap = `L${x0 + r} ${y1} A${r} ${r} 0 0 1 ${x0} ${y1 - r} L${x0} ${y0 + r} A${r} ${r} 0 0 1 ${x0 + r} ${y0} L${x1 - r} ${y0} A${r} ${r} 0 0 1 ${x1} ${y0 + r} L${x1} ${y1 - r} A${r} ${r} 0 0 1 ${x1 - r} ${y1} L${w / 2} ${y1}`;
      const d1 = `M${w / 2} ${y1} ${lap}`;
      trail.setAttribute('d', d1);
      path.setAttribute('d', `${d1} ${lap}`); // two laps so the text can wrap seamlessly
      loop = path.getTotalLength() / 2;
    };
    let raf = 0, off = 0, last = 0;
    const step = (t) => { const dt = last ? t - last : 16; last = t; off = (off + dt * 0.055) % loop; tp.setAttribute('startOffset', off); raf = requestAnimationFrame(step); };
    const start = () => { build(); if (!raf && !matchMedia('(prefers-reduced-motion: reduce)').matches) { last = 0; raf = requestAnimationFrame(step); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    wrap.addEventListener('pointerenter', start); wrap.addEventListener('pointerleave', stop);
    btn.addEventListener('focus', start); btn.addEventListener('blur', stop);
    build(); addEventListener('resize', build);
  });
})();

// Dock stays tucked away at the very top so it never covers the first fold.
(() => {
  const dock = document.querySelector('.dock'); if (!dock) return;
  const upd = () => dock.classList.toggle('dock-away', scrollY < 120 && !location.hash.match(/^#(quick-automations|quality-coach|gallery)$/));
  addEventListener('scroll', upd, { passive: true }); addEventListener('hashchange', upd); upd();
})();


// Intro: a Snake Xenzia-style pixel snake eats blocks that reveal greetings, ending on வணக்கம் at the centre.
(() => {
  const L = document.querySelector('.loader'); if (!L || L.classList.contains('skip')) return;
  const words = [...L.querySelectorAll('.words span')].map(s => [s.textContent, s.getAttribute('lang') || 'en']);
  const cv = document.createElement('canvas'); cv.className = 'snk-cv'; L.appendChild(cv);
  const ctx = cv.getContext('2d'); const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
  const S = W < 600 ? 24 : 32, G = 5, C = S - G, cols = Math.floor(W / S), rows = Math.floor(H / S);
  const ox = (W - cols * S) / 2 + G / 2, oy = (H - rows * S) / 2 + G / 2;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  // foods: random every run — one per random zone of a 3×3 (4×2 on phones) grid, visited nearest-first
  const zc = W < 600 ? 2 : 3, zr = W < 600 ? 5 : 3, zones = [];
  for (let zy = 0; zy < zr; zy++) for (let zx = 0; zx < zc; zx++) if (W < 600 ? zy !== 2 : !(zx === 1 && zy === 1)) zones.push([zx, zy]);  // keep the centre free for the finale
  for (let i = zones.length - 1; i > 0; i--) { const j = rnd(0, i); [zones[i], zones[j]] = [zones[j], zones[i]]; }
  const zw = cols / zc, zh = rows / zr, padX = W < 600 ? 1 : 2;
  const pts = zones.slice(0, words.length - 1).map(([zx, zy]) => [
    Math.round(zx * zw + padX + Math.random() * Math.max(1, zw * (W < 600 ? .45 : .55) - padX)),
    Math.round(zy * zh + 1 + Math.random() * Math.max(1, zh - 2))]);
  const edge = rnd(0, 3);
  let pos = edge === 0 ? [0, rnd(2, rows - 3)] : edge === 1 ? [cols - 1, rnd(2, rows - 3)] : edge === 2 ? [rnd(2, cols - 3), 0] : [rnd(2, cols - 3), rows - 1];
  const foods = []; let cur = pos.slice(), left = pts.slice();
  while (left.length) { left.sort((p, q) => (Math.abs(p[0] - cur[0]) + Math.abs(p[1] - cur[1])) - (Math.abs(q[0] - cur[0]) + Math.abs(q[1] - cur[1]))); cur = left.shift(); foods.push(cur); }
  const mid = [Math.floor(cols / 2), Math.floor(rows / 2) - 2]; foods.push(mid);  // last greeting always lands dead centre
  const segs = []; const start = pos.slice();
  foods.forEach((f, k) => {
    const cells = []; const axes = k % 2 ? [1, 0] : [0, 1];
    axes.forEach(ax => { while (pos[ax] !== f[ax]) { pos[ax] += Math.sign(f[ax] - pos[ax]); cells.push(pos.slice()); } });
    segs.push(cells);
  });
  const path = [start]; segs.forEach(c => path.push(...c));
  const T0 = performance.now() + 60, BUDGET = Math.max(1300, 2860 - T0), HOLD = 70, LEN = 7;          // finish by ~2.86s after page start
  const STEP = (BUDGET - HOLD * segs.length) / (path.length - 1);
  const eatT = []; let acc = 0; segs.forEach(c => { acc += c.length * STEP; eatT.push(acc); acc += HOLD; });
  const idxAt = (t) => { let i = 0, tt = 0; for (let k = 0; k < segs.length; k++) { const d = segs[k].length * STEP; if (t < tt + d) return i + Math.floor((t - tt) / STEP); i += segs[k].length; tt += d; if (t < tt + HOLD) return i; tt += HOLD; } return path.length - 1; };
  const sparks = new Map(); const labels = [];
  let ate = -1, t0 = T0;
  const cell = (x, y, fill) => { ctx.fillStyle = fill; ctx.fillRect(ox + x * S, oy + y * S, C, C); };
  const say = (k) => {
    const [txt, lang] = words[k], [fx, fy] = foods[k];
    labels.forEach(l => l.classList.add('gone'));
    const d = document.createElement('div'); d.className = 'snk-g'; d.lang = lang; d.textContent = txt;
    L.appendChild(d);
    const cx = ox + fx * S + C / 2, cy = oy + fy * S + C / 2;
    const last = k === words.length - 1;
    if (last) { d.classList.add('mid'); d.style.top = (H / 2) + 'px'; d.style.left = '50%'; requestAnimationFrame(() => d.classList.add('on')); }
    else {
      d.style.top = cy + 'px'; d.style.left = (cx + S) + 'px';
      requestAnimationFrame(() => { const r = d.getBoundingClientRect(); if (r.right > W - 16) d.style.left = (cx - S - r.width) + 'px'; d.classList.add('on'); });
    }
    labels.push(d);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) sparks.set((fx + dx) + ',' + (fy + dy), 1);
  };
  const frame = (now) => {
    const t = Math.max(0, now - t0), i = Math.min(path.length - 1, idxAt(t));
    while (ate + 1 < eatT.length && t >= eatT[ate + 1]) say(++ate);
    ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cell(x, y, TOK.dotFaint);
    if (Math.random() < .25) sparks.set(rnd(0, cols - 1) + ',' + rnd(0, rows - 1), .3 + Math.random() * .25);
    sparks.forEach((v, k) => { const [x, y] = k.split(',').map(Number); cell(x, y, `rgba(${TOK.accent.join(',')},${v})`); const n = v - .025; n > 0 ? sparks.set(k, n) : sparks.delete(k); });
    if (ate + 1 < foods.length) { const [fx, fy] = foods[ate + 1]; const blink = .55 + .45 * Math.sin(t / 70); ctx.shadowColor = toHex(TOK.soft); ctx.shadowBlur = 16; cell(fx, fy, `rgba(${TOK.pale.join(',')},${blink})`); ctx.shadowBlur = 0; }
    for (let j = 0; j < LEN; j++) { const p = path[i - j]; if (!p) break; const a = 1 - j / LEN; if (j === 0) { ctx.shadowColor = toHex(TOK.accent); ctx.shadowBlur = 18; } cell(p[0], p[1], `rgba(${mixRGB(TOK.accent, TOK.pale, 1 - a)},${.35 + a * .65})`); ctx.shadowBlur = 0; }
    if (t < acc + 600) requestAnimationFrame(frame);
  };
  window.__snakeEnd = T0 + acc;
  L.style.animationDelay = (Math.max(3000, T0 + acc + 140) / 1000) + 's';  // never wipe before the last greeting lands
  window.__snakeT0 = T0;
  document.documentElement.style.setProperty('--intro', '3.4s');
  requestAnimationFrame(frame);
})();

// Toolbar glass: an edge-refraction map shaped to the pill, like the cursor lens.
(() => {
  const dock = document.querySelector('.dock');
  if (!dock || !CSS.supports('backdrop-filter', 'url(#x)')) return;
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.style.position = 'absolute';
  document.body.appendChild(svg);
  let key = '';
  const build = () => {
    const W = Math.round(dock.offsetWidth), H = Math.round(dock.offsetHeight); if (!W || !H) return;
    const k = W + 'x' + H; if (k === key) return; key = k;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), r = H / 2, band = Math.min(18, r);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // signed distance to the pill edge and outward normal
      const cx = Math.min(Math.max(x + .5, r), W - r), dx = x + .5 - cx, dy = y + .5 - r, d = Math.hypot(dx, dy), inside = r - d;
      const t = inside > 0 && inside < band ? Math.pow(1 - inside / band, 2) : 0, nx = d ? dx / d : 0, ny = d ? dy / d : 0, i = (y * W + x) * 4;
      img.data[i] = 128 - nx * t * 127; img.data[i + 1] = 128 - ny * t * 127; img.data[i + 2] = 128; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    svg.innerHTML = `<filter id="glass-dock" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="${c.toDataURL()}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" result="m"/><feDisplacementMap in="SourceGraphic" in2="m" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    dock.classList.add('glass-ref');
  };
  build(); addEventListener('resize', build); addEventListener('load', build);
})();

/* Testimonials: pile of tilted cards that fans out into a 3-col grid on hover/focus/tap */
(() => {
  const root = document.querySelector('.tk'); if (!root) return;
  const cards = [...root.querySelectorAll('.tk-c')], GAP = 16;
  // pile: [x offset as share of width from centre, y px, rotation, stacking]
  const PILE = [[-.33, 70, -6, 1], [-.06, 0, -4, 6], [.2, 30, 11, 3], [-.24, 140, 0, 2], [0, 130, 9, 5], [.18, 150, 3, 4]];
  let open = false, grid = [], pile = [];
  const apply = () => cards.forEach((c, i) => {
    const p = open ? grid[i] : pile[i];
    c.style.setProperty('--x', p.x + 'px'); c.style.setProperty('--y', p.y + 'px'); c.style.setProperty('--r', p.r + 'deg');
    c.style.setProperty('--d', (open ? i : cards.length - 1 - i) * 0.035 + 's');
    c.style.zIndex = open ? 1 : PILE[i][3];
  });
  const layout = () => {
    if (innerWidth <= 760) { root.style.height = ''; cards.forEach((c) => { c.style.width = ''; }); return; }
    const W = root.clientWidth, cw = Math.floor((W - GAP * 2) / 3);
    cards.forEach((c) => { c.style.width = cw + 'px'; });
    const h = cards.map((c) => c.offsetHeight), colB = [0, 0, 0];
    grid = cards.map((c, i) => { const col = i % 3, y = colB[col]; colB[col] += h[i] + GAP; return { x: col * (cw + GAP), y, r: 0 }; });
    const gridH = Math.max(...colB) - GAP;
    pile = cards.map((c, i) => ({ x: W / 2 - cw / 2 + PILE[i][0] * W, y: 20 + PILE[i][1], r: PILE[i][2] }));
    const pileH = Math.max(...pile.map((p, i) => p.y + h[i])) + 30;
    root.style.height = Math.max(gridH, pileH) + 'px';
    apply();
  };
  const set = (v) => { if (open !== v) { open = v; root.classList.toggle('open', v); apply(); } };
  root.addEventListener('mouseenter', () => set(true));
  root.addEventListener('mouseleave', () => set(false));
  root.addEventListener('focusin', () => set(true));
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) set(false); });
  root.addEventListener('click', () => { if (matchMedia('(hover: none)').matches) set(!open); });
  addEventListener('resize', layout);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layout); layout();
})();

// Journey accordion: one company open at a time, with smooth height + fade
(() => {
  const rows = [...document.querySelectorAll('details.jr-row')];
  if (!rows.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const anims = new WeakMap();
  const settle = (d) => { d.style.height = ''; d.style.overflow = ''; anims.delete(d); };
  rows.forEach((d) => d.classList.toggle('is-open', d.open));

  const run = (d, from, to, done) => {
    anims.get(d)?.cancel();
    d.style.overflow = 'hidden';
    const a = d.animate({ height: [from + 'px', to + 'px'] }, { duration: reduce ? 0 : 420, easing: EASE });
    anims.set(d, a);
    a.onfinish = () => { done && done(); settle(d); };
    a.oncancel = () => { d.style.overflow = ''; };
  };
  const open = (d) => {
    const from = d.offsetHeight;
    d.open = true; d.classList.add('is-open');
    const to = d.scrollHeight;
    const body = d.querySelector('.jr-body');
    if (body && !reduce) body.animate({ opacity: [0, 1], transform: ['translateY(-6px)', 'none'] }, { duration: 360, delay: 80, easing: EASE, fill: 'backwards' });
    run(d, from, to);
  };
  const close = (d) => {
    const from = d.offsetHeight;
    const to = d.querySelector('summary').offsetHeight;
    d.classList.remove('is-open');
    run(d, from, to, () => { d.open = false; });
  };

  rows.forEach((d) => {
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (d.classList.contains('is-open')) { close(d); return; }
      rows.forEach((o) => { if (o !== d && o.classList.contains('is-open')) close(o); });
      open(d);
    });
  });
})();
