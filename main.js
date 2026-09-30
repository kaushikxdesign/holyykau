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
  return { accent: rgb('--accent', '#2457ff'), soft: rgb('--accent-soft', '#788dff'), pale: rgb('--accent-pale', '#9fb5ff'), white: rgb('--white', '#fff'),
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
    if (ate + 1 < foods.length) { const [fx, fy] = foods[ate + 1]; const blink = .55 + .45 * Math.sin(t / 70); ctx.shadowColor = toHex(TOK.accent); ctx.shadowBlur = 16; cell(fx, fy, `rgba(${TOK.accent.join(',')},${blink})`); ctx.shadowBlur = 0; }
    for (let j = 0; j < LEN; j++) { const p = path[i - j]; if (!p) break; const a = 1 - .8 * j / (LEN - 1); /* pure brand blue; only the opacity fades, 100% to 20% */ if (j === 0) { ctx.shadowColor = toHex(TOK.accent); ctx.shadowBlur = 18; } cell(p[0], p[1], `rgba(${TOK.accent.join(',')},${a})`); ctx.shadowBlur = 0; }
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

// Case-study reading progress: bar under the sticky top bar + percentage
(() => {
  const nav = document.querySelector('header.nav');
  if (!nav) return;
  const bar = document.createElement('div');
  bar.className = 'rprog'; bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i></i><div class="rp-tip"><div class="rp-run" aria-hidden="true"></div></div>';
  nav.appendChild(bar);
  const runEl = bar.querySelector('.rp-run');
  let run = null, lastY = scrollY, idle = 0;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.lottie && window.RUNNER_ANIM) {
    run = lottie.loadAnimation({ container: runEl, renderer: 'svg', loop: true, autoplay: false, animationData: window.RUNNER_ANIM });
    // crop the square frame to the fox's bounds across every frame, so it fills the box
    run.addEventListener('DOMLoaded', () => {
      const svg = runEl.querySelector('svg'), g = svg && svg.querySelector('g');
      if (g) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let f = 0; f < run.totalFrames; f += 2) {
          run.goToAndStop(f, true);
          const b = g.getBBox();
          if (b.width && b.height) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
        }
        if (isFinite(x0)) { const pad = 4; svg.setAttribute('viewBox', `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`); svg.setAttribute('preserveAspectRatio', 'xMidYMax meet'); }
      }
      run.goToAndStop(0, true);
    });
  }

  const target = () => {
    const v = document.querySelector('[data-view]:not([hidden])');
    if (v) return (v.dataset.view === 'home' || v.dataset.view === 'gallery') ? null : v;
    return document.querySelector('main.cs');
  };
  let raf = 0;
  const update = () => {
    raf = 0;
    const el = target();
    if (!el) { bar.classList.remove('on'); return; }
    const top = el.getBoundingClientRect().top + scrollY;
    const span = Math.max(1, el.offsetHeight - innerHeight);
    const p = Math.min(1, Math.max(0, (scrollY - top) / span));
    bar.style.setProperty('--p', p.toFixed(4));
    if (run && !still && scrollY !== lastY) {
      bar.classList.toggle('back', scrollY < lastY);
      // the fox only runs while the page is scrolling, and pauses mid-stride when it stops
      run.setSpeed(1.4); run.play(); clearTimeout(idle);
      idle = setTimeout(() => run.pause(), 160);
    }
    lastY = scrollY;
    bar.classList.toggle('on', scrollY > top + 40);
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  addEventListener('hashchange', () => setTimeout(update, 50));
  update();
})();

// Toolkit: logo spins smoothly while hovered, then finishes its current turn instead of snapping back
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.tool').forEach((tool) => {
    const img = tool.querySelector('.tl-ic img');
    if (!img || !img.animate) return;
    let spin = null;
    tool.addEventListener('mouseenter', () => {
      if (spin && spin.playState === 'running') { spin.effect.updateTiming({ iterations: Infinity }); return; }
      spin = img.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }], { duration: 700, iterations: Infinity, easing: 'linear' });
    });
    tool.addEventListener('mouseleave', () => {
      if (!spin) return;
      const t = spin.effect.getComputedTiming();
      spin.effect.updateTiming({ iterations: (t.currentIteration || 0) + 1 });
    });
  });
})();

// Homepage gallery board: prints start in a crowded scatter; visitors can drag them anywhere.
// "Mischief managed" glides every print back. Clicking a photo (without dragging) enlarges it.
(() => {
  const board = document.querySelector('[data-board]');
  if (!board) return;
  const cards = [...board.querySelectorAll('.jf')];
  const lb = document.querySelector('.lightbox');
  const open = (card) => {
    const img = card.querySelector('img');
    if (!lb || !img) return;
    lb.innerHTML = `<img src="${img.currentSrc || img.src}" alt="${img.alt}">`;
    lb.classList.add('on');
  };
  if (lb && !lb.dataset.wired) {
    lb.dataset.wired = '1';
    lb.addEventListener('click', () => lb.classList.remove('on'));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && lb.classList.remove('on'));
  }
  let dragged = false;
  cards.forEach((c) => {
    if (!c.classList.contains('jf-photo')) return;
    c.addEventListener('click', () => { if (!dragged) open(c); dragged = false; });
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); } });
  });
  // every print hangs crooked (1.5 to 4.5 degrees, fixed seed, directions mixed); the film tilts least
  // a fresh seed on every visit, so the board is arranged differently each time; within a visit it stays put
  // (Mischief managed returns to this visit's arrangement)
  const visit = Math.floor(Math.random() * 100000);
  const tiltSeed = (n) => { const x = Math.sin((n + visit) * 7919 + 104729) * 43758.5453; return x - Math.floor(x); };
  const tiltOf = new Map();
  cards.forEach((c, k) => {
    const mag = (1.5 + tiltSeed(k + 11) * 3) * (c.classList.contains('jf-film') ? 0.45 : 1);
    const deg = Math.round(mag * (tiltSeed(k + 3) < 0.5 ? -1 : 1) * 10) / 10;
    tiltOf.set(c, deg); c.style.setProperty('--tilt', deg + 'deg');
  });
  if (!matchMedia('(pointer:fine) and (min-width:901px)').matches) return;
  board.classList.add('is-live');
  // entry state: three tidy zones, no tilts. Top left holds the Dribbble shots side by side,
  // bottom left the short film at full zone width, and the photos fill the rest as an even masonry grid.
  let home = [], touched = false;
  const shots = cards.filter((c) => c.tagName === 'A' && !c.classList.contains('jf-film'));
  const film = cards.find((c) => c.classList.contains('jf-film'));
  const photos = cards.filter((c) => c.classList.contains('jf-photo'));
  const ratio = (c) => {
    const box = c.querySelector('.jf-img');
    if (box && !box.dataset.ar) box.dataset.ar = box.style.aspectRatio || '3/2';
    const r = (box ? box.dataset.ar : '3/2').split('/').map(Number); return r[1] / r[0];
  };
  // jumbled board, no zones: three loose rows across the full width. Rows are justified to the board width
  // (every print in a row shares an image height, the film is drawn 15% larger), then each row drifts up or down
  // and every print gets a small nudge and tilt. A new seed each visit, so the jumble changes every time.
  const frame = 9 * 2, capH = 34 - 9;
  const rows = (() => {
    const tall = photos.filter((c) => ratio(c) > 1.1), rest = photos.filter((c) => ratio(c) <= 1.1);
    const unit = (c) => (c === film ? 1.15 : 1) / ratio(c);           // width per unit of image height
    const R = [[], [], []], sum = [0, 0, 0];
    const put = (r, c) => { R[r].push(c); sum[r] += unit(c); };
    // anchors: one shot top, one bottom; film in the middle; the two portraits in the top and bottom rows
    // which outer row gets which shot / portrait flips from visit to visit
    const top = visit % 2 ? 2 : 0, bottom = 2 - top;
    if (shots[0]) put(top, shots[0]); if (shots[1]) put(bottom, shots[1]); if (film) put(1, film);
    tall.forEach((c, n) => put(n % 2 ? top : bottom, c));
    // the rest go to whichever row is shortest, so rows come out close in length
    [...rest].sort((x, y) => unit(y) - unit(x)).forEach((c) => put(sum.indexOf(Math.min(...sum)), c));
    // seeded shuffle inside each row, then keep portraits at opposite ends and the film off-centre
    R.forEach((row, r) => row.sort((x, y) => tiltSeed(cards.indexOf(x) * 3 + r) - tiltSeed(cards.indexOf(y) * 3 + r)));
    const moveTo = (row, c, i) => { row.splice(row.indexOf(c), 1); row.splice(i, 0, c); };
    tall.forEach((c, n) => { const row = R[n % 2 ? top : bottom]; moveTo(row, c, n % 2 ? 1 : row.length - 2); });
    if (film) moveTo(R[1], film, 1 + Math.floor(tiltSeed(97) * Math.max(1, R[1].length - 2)));
    return R;
  })();
  const layout = () => {
    const BW = board.clientWidth, W = Math.min(BW - 2 * Math.max(40, BW * 0.045), 1760), x0 = (BW - W) / 2;
    const gapMin = 28, rowGap = 22, padY = 30, pos = new Map();
    // size budget: the heading and the whole board fit one screen below the top bar
    const lab = board.previousElementSibling, nav = document.querySelector('header.nav');
    const labH = lab ? lab.getBoundingClientRect().height + parseFloat(getComputedStyle(lab).marginBottom || 0) : 90;
    const budget = Math.max(400, innerHeight - (nav ? nav.offsetHeight : 72) - labH - 30);
    const ihFit = (budget - padY * 2 - rowGap * 2) / 3 - frame - capH;
    // prints share one image height: 88% of what would fill the width, or less if the screen is short,
    // so the leftover space between prints shows the pegboard
    const units = (row) => row.reduce((t, c) => t + (c === film ? 1.15 : 1) / ratio(c), 0);
    const ihJust = Math.min(...rows.map((row) => (W - gapMin * (row.length - 1) - frame * row.length) / units(row)));
    const ih = Math.max(80, Math.min(ihJust * 0.88, ihFit));
    const rowH = ih + frame + capH;
    let y = padY;
    rows.forEach((row, r) => {
      // never narrower than the caption needs: a narrow print keeps its height and crops a little wider instead
      const minW = (c) => (c === film ? 250 : shots.includes(c) ? 170 : 140);
      const dims = row.map((c) => {
        const s = c === film ? 1.15 : 1, iw = ih * s / ratio(c), imgH = iw * ratio(c);
        const w = Math.max(iw + frame, minW(c));
        return { c, w, h: imgH + frame + capH, crop: w > iw + frame ? (w - frame) + ' / ' + imgH : null };
      });
      const free = W - dims.reduce((t, d) => t + d.w, 0), space = free / row.length;
      const shiftY = (tiltSeed(r + 71) - 0.5) * 18, shiftX = (tiltSeed(r + 83) - 0.5) * Math.min(space, 40);
      let x = x0 + space / 2 + shiftX;
      dims.forEach(({ c, w, h, crop }) => {
        const k = cards.indexOf(c);
        const dx = (tiltSeed(k + 23) - 0.5) * Math.min(space * 0.6, 36), dy = (tiltSeed(k + 37) - 0.5) * 16;
        c.style.width = Math.round(w) + 'px';
        const box = c.querySelector('.jf-img'); if (box) box.style.aspectRatio = crop || box.dataset.ar;
        const left = Math.round(Math.min(Math.max(x + dx, 8), BW - w - 8));
        const top = Math.round(Math.max(y + (rowH - h) / 2 + shiftY + dy, 12));
        pos.set(c, { left, top, tilt: tiltOf.get(c) || 0, z: 2 + Math.floor(tiltSeed(k + 51) * 8), slot: { left: Math.round(x), top: Math.round(y + (rowH - h) / 2) } });
        x += w + space;
      });
      y += rowH + rowGap;
    });
    const H = y - rowGap + padY;
    // captions stay readable: where one print's caption strip runs under a neighbour, lift that print above it;
    // if both captions would be covered, the later print goes back to its unshifted spot
    const boxOf = (c) => { const p = pos.get(c); return { l: p.left - 6, t: p.top - 6, r: p.left + c.offsetWidth + 6, b: p.top + c.offsetHeight + 6 }; };
    const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
    const capOf = (x) => ({ l: x.l, r: x.r, t: x.b - 44, b: x.b });
    for (let pass = 0, changed = true; changed && pass < 8; pass++) {
      changed = false;
      for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
        const A = boxOf(cards[i]), B = boxOf(cards[j]); if (!hit(A, B)) continue;
        const pa = pos.get(cards[i]), pb = pos.get(cards[j]), aUnder = hit(capOf(A), B), bUnder = hit(capOf(B), A);
        const aOnTop = pa.z > pb.z;
        if (aUnder && bUnder) { if (pb.slot) { pb.left = pb.slot.left; pb.top = pb.slot.top; delete pb.slot; changed = true; } }
        else if (aUnder && !aOnTop) { pa.z = Math.min(pb.z + 1, 20); changed = true; }
        else if (bUnder && aOnTop) { pb.z = Math.min(pa.z + 1, 20); changed = true; }
      }
    }
    board.style.height = Math.round(Math.max(H, ...cards.map((c) => pos.get(c).top + c.offsetHeight + 24))) + 'px';
    home = cards.map((c) => pos.get(c));
  };
  const place = (animate) => {
    cards.forEach((c, k) => {
      const h = home[k];
      c.classList.toggle('returning', !!animate);
      c.style.left = h.left + 'px'; c.style.top = h.top + 'px';
      c.style.transform = `rotate(${h.tilt}deg)`; c.style.zIndex = h.z;
    });
    if (animate) setTimeout(() => cards.forEach((c) => c.classList.remove('returning')), 750);
  };
  layout(); place(false);
  addEventListener('resize', () => { if (!touched) { layout(); place(false); } });
  const spell = document.createElement('button');
  spell.type = 'button'; spell.className = 'jb-spell'; spell.hidden = true;
  spell.innerHTML = '<span aria-hidden="true">🪄</span> i solemnly swear that i am up to no good';
  spell.title = 'Put every print back where it was';
  (board.previousElementSibling || board).appendChild(spell);
  let z = 30;
  // the button crumbles away like a snap: it breaks into pixels left to right, and they drift off turning gold
  const snap = (btn) => {
    const r = btn.getBoundingClientRect();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !r.width) { btn.hidden = true; return; }
    const cs = getComputedStyle(btn), dpr = Math.min(devicePixelRatio || 1, 2), mX = 40, mY = 70, mR = 140;
    const cw = r.width + mX + mR, ch = r.height + mY * 2;
    const cv = document.createElement('canvas');
    cv.width = cw * dpr; cv.height = ch * dpr;
    Object.assign(cv.style, { position: 'absolute', left: (r.left + scrollX - mX) + 'px', top: (r.top + scrollY - mY) + 'px', width: cw + 'px', height: ch + 'px', pointerEvents: 'none', zIndex: 60 });
    document.body.appendChild(cv);
    const g = cv.getContext('2d', { willReadFrequently: true }); g.scale(dpr, dpr);
    const icon = btn.querySelector('span'), ir = icon.getBoundingClientRect();
    const label = btn.lastChild, lr = document.createRange(); lr.selectNodeContents(label);
    const tr = lr.getBoundingClientRect();
    g.textBaseline = 'middle'; g.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; g.fillStyle = cs.color;
    const cy = mY + r.height / 2;
    g.fillText('🪄', mX + (ir.left - r.left), cy);
    g.fillText(label.textContent, mX + (tr.left - r.left), cy);
    const img = g.getImageData(0, 0, cv.width, cv.height).data, step = 1.5, parts = [];
    for (let y = 0; y < ch; y += step) for (let x = 0; x < cw; x += step) {
      const i = (Math.floor(y * dpr) * cv.width + Math.floor(x * dpr)) * 4;
      if (img[i + 3] > 60) parts.push({ x, y, r0: img[i], g0: img[i + 1], b0: img[i + 2], a0: img[i + 3] / 255,
        d: ((x - mX) / r.width) * 420 + Math.random() * 260, vx: .25 + Math.random() * 1.1, vy: -(.15 + Math.random() * .9),
        w: Math.random() * 6.28, gold: [[232, 182, 74], [245, 201, 92], [201, 150, 46], [255, 222, 140]][Math.floor(Math.random() * 4)] });
    }
    btn.style.visibility = 'hidden';
    const t0 = performance.now(), life = 760;
    const tick = (now) => {
      const t = now - t0; let alive = false;
      g.clearRect(0, 0, cw, ch);
      for (const p of parts) {
        const k = (t - p.d) / life;
        if (k >= 1) continue;
        alive = true;
        if (k <= 0) { g.fillStyle = `rgba(${p.r0},${p.g0},${p.b0},${p.a0})`; g.fillRect(p.x, p.y, step, step); continue; }
        const e = k * k, f = Math.min(1, k * 2.4), px = p.x + p.vx * t * .09 * k + Math.sin(p.w + k * 5) * 3 * k, py = p.y + p.vy * t * .07 * k;
        const c = p.gold.map((v, j) => Math.round([p.r0, p.g0, p.b0][j] * (1 - f) + v * f));
        g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(1 - e) * p.a0})`;
        g.fillRect(px, py, step * (1 - k * .4), step * (1 - k * .4));
      }
      if (alive) requestAnimationFrame(tick); else { cv.remove(); btn.hidden = true; btn.style.visibility = ''; }
    };
    requestAnimationFrame(tick);
  };
  // after the snap, the map closes: "mischief managed" inks in where the button was, a trail of faint
  // footprints walks off toward the right edge of the screen, and the words fade away behind them
  const mischief = (r) => {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const box = document.createElement('div');
    box.className = 'jb-mm'; box.setAttribute('role', 'status');
    Object.assign(box.style, { left: (r.right + scrollX) + 'px', top: (r.top + scrollY + r.height / 2) + 'px' });
    const words = document.createElement('span');
    words.className = 'jb-mm-words';
    [...'mischief managed'].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.animationDelay = (i * 45) + 'ms'; words.appendChild(s); });
    box.appendChild(words);
    document.body.appendChild(box);
    if (calm) { setTimeout(() => box.remove(), 1800); return; }
    // footprints: alternating left and right prints, walking right and a little upward to the screen edge,
    // each fading as the next lands
    setTimeout(() => {
      let x = 16, y = 2, ang = -0.1;
      const steps = Math.max(5, Math.min(12, Math.floor((innerWidth - r.right - 20) / 21)));
      for (let n = 0; n < steps; n++) {
        const side = n % 2 ? 1 : -1, px = x + Math.cos(ang + Math.PI / 2) * 5.5 * side, py = y + Math.sin(ang + Math.PI / 2) * 5.5 * side;
        const f = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        f.setAttribute('viewBox', '0 0 7 13'); f.setAttribute('class', 'jb-foot');
        f.innerHTML = '<ellipse cx="3.5" cy="4" rx="3" ry="4"/><ellipse cx="3.5" cy="10.6" rx="2.2" ry="2.3"/>';
        Object.assign(f.style, { left: px + 'px', top: py + 'px', transform: `translate(-50%,-50%) rotate(${ang * 180 / Math.PI - 90}deg)`, animationDelay: (n * 300) + 'ms' });
        box.appendChild(f);
        x += Math.cos(ang) * 21; y += Math.sin(ang) * 21; ang -= 0.02;
      }
    }, 900);
    setTimeout(() => box.classList.add('out'), 2100);
    setTimeout(() => box.remove(), 900 + 12 * 300 + 2000);  // outlasts the longest trail
  };
  spell.addEventListener('click', () => {
    const r = spell.getBoundingClientRect();
    layout(); place(true); snap(spell); touched = false;
    setTimeout(() => mischief(r), 650);
  });
  cards.forEach((card) => {
    let sx, sy, ox, oy, moved = false, id = null;
    card.setAttribute('draggable', 'false');
    card.addEventListener('dragstart', (e) => e.preventDefault());
    card.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      id = e.pointerId; moved = false; dragged = false; sx = e.clientX; sy = e.clientY;
      ox = card.offsetLeft; oy = card.offsetTop;
      card.setPointerCapture(id);
      card.style.zIndex = ++z;
    });
    card.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!moved) {
        moved = true; card.classList.add('dragging'); spell.hidden = false; spell.style.visibility = ''; touched = true;
        if (card.hasAttribute('href')) { card.dataset.href = card.getAttribute('href'); card.removeAttribute('href'); }
      }
      const maxX = board.clientWidth - card.offsetWidth, maxY = board.clientHeight - card.offsetHeight;
      card.style.left = Math.min(Math.max(ox + dx, -20), maxX + 20) + 'px';
      card.style.top = Math.min(Math.max(oy + dy, -20), maxY + 20) + 'px';
      card.style.transform = 'scale(1.04)';
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      if (moved) {
        dragged = true;
        card.classList.remove('dragging');
        card.style.transform = tiltOf.has(card) ? `rotate(${tiltOf.get(card)}deg)` : 'none';
        if (card.dataset.href) setTimeout(() => { card.setAttribute('href', card.dataset.href); delete card.dataset.href; }, 80);
      }
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
    card.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } });
  });
})();

// Hero photo tile: scroll to About ourselves (a plain #about jump can be swallowed by the page's host)
(() => {
  const link = document.querySelector('.me-link'), about = document.getElementById('about');
  if (!link || !about) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    about.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
})();

// Hero name slot: once per visit, after the intro, each letter of "Kaushik" spins like a slot reel and lands on
// "h0lyykau" (the domain), holds, then spins back. Left to right, each reel stops a beat after the one before.
(() => {
  const slot = document.querySelector('.art h1 .slot');
  if (!slot || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const A = slot.textContent.trim(), B = slot.dataset.alt, N = Math.max(A.length, B.length);
  const ZW = '​', ch = (s, i) => s[i] || ZW, POOL = 'abcdefghijklmnopqrstuvwxyz0123456789';
  slot.textContent = '';
  const sr = document.createElement('x-sr'); sr.textContent = A; slot.append(sr);
  const box = document.createElement('x-reels'); box.setAttribute('aria-hidden', 'true'); slot.append(box);
  const cols = [...Array(N)].map((_, i) => {
    const col = document.createElement('x-col'), size = document.createElement('x-size'), win = document.createElement('x-win'), strip = document.createElement('x-strip');
    size.textContent = ch(A, i); win.append(strip); col.append(size, win); box.append(col);
    return { col, size, strip };
  });
  const width = (c) => { const m = document.createElement('x-size'); m.textContent = c; m.style.position = 'absolute'; m.style.visibility = 'hidden'; box.append(m); const w = m.getBoundingClientRect().width; m.remove(); return w; };

  const spin = (from, to) => new Promise((done) => {
    let left = N;
    cols.forEach(({ col, size, strip }, i) => {
      const a = ch(from, i), b = ch(to, i), turns = 7 + i * 2;
      const cells = [a, ...Array.from({ length: turns }, () => POOL[Math.floor(Math.random() * POOL.length)]), b];
      strip.innerHTML = cells.map((c) => '<x-cell>' + c + '</x-cell>').join('');
      col.style.transition = 'none'; col.style.width = width(a) + 'px';
      col.classList.add('on');
      void col.offsetWidth;
      // fast spin that eases out, overshoots by a fixed nudge (not a share of the distance), then settles
      const dur = 1000 + i * 140, end = `calc(${-(cells.length - 1)} * var(--cell))`;
      strip.animate([
        { transform: 'translateY(0)', easing: 'cubic-bezier(.5,0,.15,1)' },
        { transform: `translateY(calc(${end} - .1em))`, offset: .86, easing: 'cubic-bezier(.3,0,.3,1)' },
        { transform: `translateY(${end})` },
      ], { duration: dur, fill: 'forwards' });
      col.style.transition = `width ${dur * .5}ms cubic-bezier(.4,0,.2,1) ${dur * .4}ms`;
      col.style.width = width(b) + 'px';
      setTimeout(() => { size.textContent = b; col.classList.remove('on'); col.style.width = ''; strip.getAnimations().forEach((x) => x.cancel()); strip.innerHTML = ''; if (!--left) done(); }, dur + 30);
    });
  });

  let started = false;
  const go = async () => {
    if (started) return; started = true;
    await document.fonts.ready;
    await spin(A, B);
    await new Promise((r) => setTimeout(r, 2000));
    await spin(B, A);
  };
  // start once the hero has finished drawing in (the loop around "better." is the last thing to land) and is on screen
  const loop = document.querySelector('.art h1 em svg.loop .lp');
  let drawn = false, seen = false;
  const tryGo = () => { if (drawn && seen) setTimeout(go, 350); };
  if (loop) loop.addEventListener('animationend', () => { drawn = true; tryGo(); }, { once: true });
  setTimeout(() => { drawn = true; tryGo(); }, 7500);  // fallback if the loop never animates
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { seen = true; io.disconnect(); tryGo(); } }, { threshold: .6 }).observe(slot);
})();

// Project cards: over a card, the glass cursor hands over to a "View project" button that follows the pointer.
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const b = document.createElement('span'); b.className = 'btn primary sm vcur'; b.setAttribute('aria-hidden', 'true');
  b.innerHTML = 'View project<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4"/></svg>';
  document.body.appendChild(b);
  let x = -200, y = -200, tx = x, ty = y, raf = 0, on = false;
  const move = () => { x += (tx - x) * .35; y += (ty - y) * .35; b.style.setProperty('--x', x + 'px'); b.style.setProperty('--y', y + 'px'); raf = on && Math.abs(tx - x) + Math.abs(ty - y) > .1 ? requestAnimationFrame(move) : 0; };
  addEventListener('pointermove', (e) => {
    const over = !!e.target.closest('.pc');
    tx = e.clientX; ty = e.clientY;
    if (over && !on) { x = tx; y = ty; }  // appear right at the pointer, then follow
    on = over; b.classList.toggle('on', over);
    const g = document.querySelector('.gcur'); if (g) g.classList.toggle('off', over);
    if (over && !raf) raf = requestAnimationFrame(move);
  }, { passive: true });
  addEventListener('pointerdown', () => b.classList.add('down')); addEventListener('pointerup', () => b.classList.remove('down'));
  addEventListener('scroll', () => { if (on && !document.elementFromPoint(tx, ty)?.closest('.pc')) { on = false; b.classList.remove('on'); const g = document.querySelector('.gcur'); if (g) g.classList.remove('off'); } }, { passive: true });
})();

// What I'm currently listening to: a turntable and a crate of five records (the list lives in data.js as
// window.TRACKS). Drag a record (or tap it) onto the deck and it swaps in: the arm lifts, the old record goes
// back to its sleeve, the new one drops, the arm swings on and Spotify's 30-second preview of the song plays.
// 33/45 and the pitch fader change the speed like a real deck (the pitch of the music follows), Stop winds
// the record down like a tape stop, and a little vinyl crackle sits underneath.
(() => {
  const root = document.getElementById('listening');
  const TRACKS = window.TRACKS || [];
  if (!root || !TRACKS.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const asset = (p) => (window.__A && window.__A[p]) || p;
  const cover = (i) => `<img src="${asset(TRACKS[i].cover)}" alt="" draggable="false">`;
  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const $ = (s) => root.querySelector(s);
  const deck = $('.deck'), tt = $('.tt'), platter = $('.tt-platter'), rec = $('.tt-rec'), spin = $('.tt-spin'), label = $('.tt-label'), arm = $('.tt-arm');
  const startBtn = $('.tt-start'), np = $('.np'), npTxt = $('.np-txt'), npTitle = $('.np-title'), npArtist = $('.np-artist'), npMeta = $('.np-meta');
  const npT = $('.np-t'), npD = $('.np-d'), npBar = $('.np-track i'), npLink = $('.np-link'), npNote = $('.np-note'), crate = $('.crate'), npCover = $('.np-cover');

  crate.innerHTML = TRACKS.map((t, i) => `<li><button class="vr" type="button" data-i="${i}" aria-label="Play ${t.title} by ${t.artist}"${t.tint ? ` style="--tint:${t.tint}"` : ''}>
    <span class="vr-art"><span class="vr-disc"><span class="vr-label">${cover(i)}</span></span><span class="vr-sleeve">${cover(i)}</span></span>
    <span class="vr-txt"><span class="vr-title">${t.title}<span class="eq vr-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span><span class="vr-artist">${t.artist}</span></span>
    <span class="vr-meta mono">${fmt(t.dur)}</span></button></li>`).join('');
  const rows = [...crate.querySelectorAll('.vr')];

  // ---- sound ----
  // the music: Spotify's official 30-second preview, played straight from Spotify. With preservesPitch off,
  // changing the speed changes the pitch too, like a real record.
  const au = new Audio(); au.preload = 'none';
  au.preservesPitch = au.mozPreservesPitch = au.webkitPreservesPitch = false;
  let soundOn = true, unlocked = false, broken = false, inView = false, fading = 0;
  // the crackle and the needle drop: a tiny Web Audio synth
  const fx = (() => {
    let ctx = null, crk, noise;
    const init = () => {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const nd = noise.getChannelData(0); for (let k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
      const cb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), cd = cb.getChannelData(0);
      for (let k = 0; k < cd.length; k++) { cd[k] = (Math.random() * 2 - 1) * .01; if (Math.random() < .0003) { const a = (Math.random() * .5 + .2) * (Math.random() < .5 ? -1 : 1); for (let j = 0; j < 40 && k + j < cd.length; j++) cd[k + j] += a * Math.exp(-j / 6); } }
      const src = ctx.createBufferSource(); src.buffer = cb; src.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      crk = ctx.createGain(); crk.gain.value = 0; src.connect(hp); hp.connect(crk); crk.connect(ctx.destination); src.start();
    };
    return {
      unlock() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
      crackle(v) { if (ctx) crk.gain.setTargetAtTime(v ? .5 : 0, ctx.currentTime, .15); },
      needle() {
        if (!ctx) return;
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
        s.buffer = noise; f.type = 'lowpass'; f.frequency.value = 380; s.connect(f); f.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .12); s.start(t); s.stop(t + .15);
      },
    };
  })();

  // ---- deck state ----
  let cur = -1, on = false, rpm = 33.33, pitch = 0, angle = 0, vel = 0, elapsed = 0, last = 0, raf = 0, busy = false;
  const speed = () => rpm / 33.33 * (1 + pitch / 100);
  const clip = () => (au.duration && isFinite(au.duration) ? au.duration : 30);
  const live = () => soundOn && unlocked && !broken;
  const ARM_REST = 0;
  // each deck design sets its arm sweep; CSS (--arm-in / --arm-out) can override it per screen size
  const sweep = (k, fb) => parseFloat(getComputedStyle(tt).getPropertyValue('--arm-' + k)) || +tt.dataset['arm' + (k === 'in' ? 'In' : 'Out')] || fb;
  const setArm = () => { const a = sweep('in', 24.5), b = sweep('out', 36); arm.style.transform = `rotate(${on && cur >= 0 ? a + (b - a) * Math.min(1, elapsed / clip()) : ARM_REST}deg)`; };
  const paint = () => {
    tt.classList.toggle('on', on); np.classList.toggle('playing', on && cur >= 0); root.classList.toggle('playing', on && cur >= 0);
    startBtn.setAttribute('aria-pressed', String(on)); startBtn.firstElementChild.textContent = on ? 'Stop' : 'Start';
    rows.forEach((r, i) => { r.classList.toggle('on', i === cur); r.setAttribute('aria-pressed', String(i === cur)); });
    platter.classList.toggle('empty', cur < 0);
    npT.textContent = fmt(elapsed); npD.textContent = fmt(clip()); npBar.style.width = Math.min(100, elapsed / clip() * 100) + '%';
  };
  // the audio follows the deck: plays while the deck is on, the sound is on and the section is on screen
  const syncAudio = (tape) => {
    const want = on && cur >= 0 && live() && inView;
    cancelAnimationFrame(fading); fading = 0;
    if (want) {
      au.playbackRate = speed(); au.volume = 1;
      if (au.paused) { if (Math.abs(au.currentTime - elapsed) > .3) au.currentTime = elapsed; au.play().catch(() => {}); }
      fx.crackle(true);
    } else {
      fx.crackle(false);
      if (au.paused) return;
      if (!tape || reduce) { au.pause(); return; }
      // tape stop: the record slows and drops in pitch as it winds down
      const r0 = au.playbackRate, t0 = performance.now();
      const step = (now) => {
        const k = Math.max(0, Math.min(1, (now - t0) / 700));
        au.playbackRate = Math.max(.25, r0 * (1 - .7 * k)); au.volume = 1 - k;
        if (k < 1) fading = requestAnimationFrame(step); else { au.pause(); au.playbackRate = speed(); au.volume = 1; fading = 0; }
      };
      fading = requestAnimationFrame(step);
    }
  };
  const tick = (now) => {
    const dt = last ? Math.min(64, now - last) : 16; last = now;
    const target = on && cur >= 0 ? rpm * (1 + pitch / 100) * 360 / 60000 : 0;
    vel += (target - vel) * Math.min(1, dt / (target > vel ? 420 : 700));  // spin up quicker than it winds down
    if (!reduce) { angle = (angle + vel * dt) % 360; spin.style.transform = `rotate(${angle}deg)`; }
    if (on && cur >= 0) {
      const before = Math.floor(elapsed);
      elapsed = !au.paused && !fading ? au.currentTime : elapsed + dt / 1000 * speed();
      if (elapsed >= clip() - .05) { elapsed = 0; au.currentTime = 0; paint(); setArm(); }  // end of the preview: back to the lead-in, play again
      else if (Math.floor(elapsed) !== before) { paint(); setArm(); }
    }
    if (on || Math.abs(vel) > .0005) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
  };
  const run = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
  function setOn(v, tape = true) { on = v && cur >= 0; paint(); setArm(); run(); syncAudio(tape); }

  const showTrack = (i) => {
    const t = TRACKS[i];
    npTitle.textContent = t.title; npArtist.textContent = t.artist; npMeta.textContent = t.meta;
    npLink.href = 'https://open.spotify.com/track/' + t.id;
    if (npCover) npCover.innerHTML = cover(i);
    np.style.setProperty('--np-art', `url("${asset(t.cover)}")`);
    if (t.tint) np.style.setProperty('--np-tint', t.tint);
    npTxt.classList.remove('swap'); void npTxt.offsetWidth; npTxt.classList.add('swap');
    au.preload = unlocked ? 'auto' : 'none'; au.src = t.preview;  // nothing downloads until the visitor interacts
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  // swap in record i: lift the arm, send the old record back, drop the new one, swing the arm on
  const load = async (i, fromGhost) => {
    if (busy || i === cur) { if (i === cur && !on) setOn(true); if (fromGhost) fromGhost.remove(); return; }
    busy = true;
    if (cur >= 0) { setOn(false, false); await wait(380); rec.classList.add('off'); await wait(320); }
    if (fromGhost) await (fromGhost._fly ? fromGhost._fly() : flyTo(fromGhost));
    cur = i; elapsed = 0; angle = fromGhost && fromGhost._angle != null ? fromGhost._angle : Math.random() * 360;
    spin.style.transform = `rotate(${angle}deg)`;
    label.innerHTML = cover(i);
    rec.classList.remove('off', 'in'); void rec.offsetWidth; rec.classList.add('in');
    showTrack(i); paint();
    await wait(380);
    busy = false;
    if (live()) fx.needle();
    setOn(true);
  };

  // ---- the record in your hand ----
  const ghostFor = (row, x, y) => {
    const d = row.querySelector('.vr-disc').getBoundingClientRect();
    const g = document.createElement('div'); g.className = 'ghost';
    g.innerHTML = `<div class="ghost-disc"></div><div class="ghost-label">${cover(+row.dataset.i)}</div>`;
    g.style.width = g.style.height = d.width + 'px';
    document.body.append(g);
    g._off = { x: x - d.left, y: y - d.top }; g._size = d.width;
    return g;
  };
  const place = (g, x, y, rot, scale) => { g.style.transform = `translate(${x - g._off.x}px,${y - g._off.y}px) rotate(${rot}deg) scale(${scale})`; };
  const flyTo = (g) => new Promise((res) => {
    const r = rec.getBoundingClientRect(), s = r.width / g._size;
    const m = /translate\(([-\d.]+)px,([-\d.]+)px\)/.exec(g.style.transform) || [0, 0, 0];
    g.style.transformOrigin = '0 0';
    const a = g.animate([{ transform: `translate(${m[1]}px,${m[2]}px) scale(1.1)` }, { transform: `translate(${r.left}px,${r.top}px) scale(${s})` }],
      { duration: reduce ? 0 : 420, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
    a.onfinish = () => { res(); requestAnimationFrame(() => g.remove()); };
  });
  // a tap: the record slides out of the side of its sleeve, arcs over and drops onto the platter
  const pick = (row) => {
    const i = +row.dataset.i;
    if (reduce || busy || i === cur) { load(i); return; }
    const disc = row.querySelector('.vr-disc'), d = disc.getBoundingClientRect(), size = disc.offsetWidth;
    const m = new DOMMatrix(getComputedStyle(disc).transform), a0 = Math.atan2(m.b, m.a) * 180 / Math.PI;
    const cx = d.left + d.width / 2, cy = d.top + d.height / 2, upX = cx + size * .6;
    const g = document.createElement('div'); g.className = 'ghost';
    g.innerHTML = `<div class="ghost-disc"></div><div class="ghost-label">${cover(i)}</div>`;
    g.style.width = g.style.height = size + 'px'; document.body.append(g); row.classList.add('lifted');
    const T = (x, y, a, k) => `translate(${x - size / 2}px,${y - size / 2}px) rotate(${a}deg) scale(${k})`;
    const lift = g.animate([{ transform: T(cx, cy, a0, 1) }, { transform: T(upX, cy, a0 + 50, 1.08) }],
      { duration: 340, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' }).finished;
    g._fly = async () => {
      await lift;
      const r = rec.getBoundingClientRect(), ex = r.left + r.width / 2, ey = r.top + r.height / 2, k = rec.offsetWidth / size;
      const a1 = a0 + 50 + 330;
      await g.animate([
        { transform: T(upX, cy, a0 + 50, 1.08), easing: 'cubic-bezier(.25,.6,.45,1)' },
        { transform: T(upX + (ex - upX) * .55, Math.min(cy, ey) - 40, a0 + 220, (1.08 + k) / 2 * 1.12), offset: .42, easing: 'cubic-bezier(.55,0,.85,.55)' },
        { transform: T(ex, ey, a1, k * 1.07) },
      ], { duration: 720, fill: 'forwards' }).finished;
      g._angle = ((a1 % 360) + 360) % 360;
      requestAnimationFrame(() => g.remove());
    };
    load(i, g).then(() => row.classList.remove('lifted'));
  };
  const overDeck = (x, y) => { const r = platter.getBoundingClientRect(); return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < r.width * .62; };

  rows.forEach((row) => {
    let sx = 0, sy = 0, g = null, pid = null, moved = false, lx = 0;
    row.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; sx = e.clientX; sy = e.clientY; lx = sx; moved = false; pid = e.pointerId; });
    row.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      if (!g && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) {
        if (e.pointerType === 'touch' && Math.abs(e.clientY - sy) > Math.abs(e.clientX - sx)) { pid = null; return; }  // vertical swipe on touch = scroll
        moved = true; row.setPointerCapture(pid);
        g = ghostFor(row, sx, sy); row.classList.add('lifted'); deck.classList.add('dragging');
        document.documentElement.style.cursor = 'grabbing';
      }
      if (g) {
        const tilt = Math.max(-18, Math.min(18, (e.clientX - lx) * 1.5)); lx = e.clientX;
        const over = overDeck(e.clientX, e.clientY);
        place(g, e.clientX, e.clientY, tilt, over ? 1.9 : 1.1);  // grows over the deck, like it's about to drop on
        deck.classList.toggle('over', over);
      }
    });
    const end = (e) => {
      if (e.pointerId !== pid) return; pid = null;
      document.documentElement.style.cursor = '';
      if (!g) return;
      const hit = overDeck(e.clientX, e.clientY), gg = g; g = null;
      deck.classList.remove('dragging', 'over');
      if (hit) { row.classList.remove('lifted'); load(+row.dataset.i, gg); return; }
      // missed the deck: the record slides back into its sleeve
      const d = row.querySelector('.vr-sleeve').getBoundingClientRect();
      gg.animate([{ transform: gg.style.transform }, { transform: `translate(${d.left}px,${d.top}px) scale(1)` }], { duration: reduce ? 0 : 380, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' })
        .onfinish = () => { gg.remove(); row.classList.remove('lifted'); };
    };
    row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
    row.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; return; } pick(row); });
  });

  startBtn.addEventListener('click', () => { if (cur < 0) load(0); else { if (!on && live()) fx.needle(); setOn(!on); } });
  root.querySelectorAll('.tt-rpm button').forEach((b) => b.addEventListener('click', () => {
    rpm = b.dataset.rpm === '45' ? 45 : 33.33; if (!fading) au.playbackRate = speed();
    root.querySelectorAll('.tt-rpm button').forEach((x) => x.classList.toggle('on', x === b));
  }));

  // pitch fader: ±8%, up is faster, snaps to 0 near the middle; drag, arrow keys, or double-click to reset
  const fader = $('.tt-pitch'), knob = fader.firstElementChild, pv = $('.tt-pv');
  const setPitch = (v) => {
    pitch = Math.max(-8, Math.min(8, Math.round(v * 10) / 10)); if (Math.abs(pitch) < .4) pitch = 0;
    knob.style.top = `calc(${(1 - (pitch + 8) / 16) * 100}% - 5px)`; fader.style.setProperty('--pv', pitch);
    const txt = (pitch > 0 ? '+' : pitch < 0 ? '−' : '±') + Math.abs(pitch).toFixed(pitch % 1 ? 1 : 0) + '%';
    pv.textContent = txt; pv.classList.toggle('moved', pitch !== 0);
    fader.setAttribute('aria-valuenow', String(pitch)); fader.setAttribute('aria-valuetext', txt);
    if (!fading) au.playbackRate = speed();
  };
  const fromY = (y) => { const r = fader.getBoundingClientRect(); return 8 - Math.max(0, Math.min(1, (y - r.top) / r.height)) * 16; };
  // a fader jumps to where you press; a knob turns with a relative drag (up = faster)
  const isKnob = fader.classList.contains('knob'); let y0 = 0, p0 = 0;
  fader.addEventListener('pointerdown', (e) => { fader.setPointerCapture(e.pointerId); fader.classList.add('drag'); y0 = e.clientY; p0 = pitch; if (!isKnob) setPitch(fromY(e.clientY)); });
  fader.addEventListener('pointermove', (e) => { if (fader.hasPointerCapture(e.pointerId)) setPitch(isKnob ? p0 + (y0 - e.clientY) / 8 : fromY(e.clientY)); });
  fader.addEventListener('pointerup', () => fader.classList.remove('drag'));
  fader.addEventListener('dblclick', () => setPitch(0));
  fader.addEventListener('keydown', (e) => {
    const k = { ArrowUp: .5, ArrowRight: .5, ArrowDown: -.5, ArrowLeft: -.5 }[e.key];
    if (k) { e.preventDefault(); setPitch(pitch + k); } else if (e.key === 'Home' || e.key === '0') setPitch(0);
  });

  // ---- sound on/off. Browsers only allow sound after a click or tap, so the first press anywhere in the
  // section unlocks it (the audio element is primed inside that same press, which iOS needs) ----
  const sndBtn = $('.snd');
  const paintSnd = () => {
    sndBtn.setAttribute('aria-pressed', String(live())); sndBtn.lastElementChild.textContent = live() ? 'Sound on' : 'Sound off';
    np.classList.toggle('no-audio', broken);
  };
  const unlock = () => {
    if (unlocked) return;
    unlocked = true; fx.unlock();
    if (!on) { const m = au.muted; au.muted = true; au.play().then(() => { au.pause(); au.muted = m; }).catch(() => { au.muted = m; }); }
  };
  root.addEventListener('pointerdown', (e) => { if (e.target.closest('.snd') || !soundOn) return; const was = unlocked; unlock(); if (!was) setTimeout(() => { paintSnd(); syncAudio(false); }, 30); }, true);
  root.addEventListener('keydown', () => { if (!soundOn) return; const was = unlocked; unlock(); if (!was) setTimeout(() => { paintSnd(); syncAudio(false); }, 30); }, true);
  sndBtn.addEventListener('click', () => {
    if (live()) soundOn = false; else { soundOn = true; unlock(); }
    paintSnd(); syncAudio(false);
  });
  // if the preview can't load (no network, or a page that blocks outside audio), the deck carries on silently
  au.addEventListener('error', () => { if (!au.src) return; broken = true; paintSnd(); fx.crackle(false); });
  au.addEventListener('playing', () => { if (broken) { broken = false; paintSnd(); } });
  new IntersectionObserver(([e]) => { inView = e.intersectionRatio > .15; syncAudio(false); }, { threshold: [0, .15, .3] }).observe(deck);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { inView = false; syncAudio(false); } });
  paintSnd();

  // ---- the tonearm: drag it onto the record to drop the needle there (the song cues to that point), or off the
  // record to park it and stop ----
  {
    const base = $('.tt-armbase');
    // the arm's pivot on screen, and the stylus direction at rest (from the drawing: pivot 60,78 → stylus 39,334)
    const pivot = () => { const r = base.getBoundingClientRect(); return { x: r.left + r.width * .5, y: r.top + r.height * 0.2167 }; };
    const REST_DIR = Math.atan2(256, -21);
    let drag = null;
    const angleAt = (e) => { const c = pivot(); return (Math.atan2(e.clientY - c.y, e.clientX - c.x) - REST_DIR) * 180 / Math.PI; };
    // a click does nothing: the arm is only picked up once the pointer has moved a few pixels
    arm.addEventListener('pointerdown', (e) => {
      if (busy || cur < 0 || e.button !== 0) return;
      e.preventDefault(); arm.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, live: false };
    });
    arm.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.live) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4) return;
        // pick it up exactly where it is (mid-sweep or at rest), then stop the record
        const now = new DOMMatrix(getComputedStyle(arm).transform), a0 = Math.atan2(now.b, now.a) * 180 / Math.PI;
        arm.style.transition = 'none'; arm.style.transform = `rotate(${a0}deg)`;
        if (on) { setOn(false, false); arm.style.transform = `rotate(${a0}deg)`; }  // setOn parks the arm; keep it in hand
        drag.live = true; drag.off = a0 - angleAt({ clientX: drag.x, clientY: drag.y }); drag.a = a0;
        arm.classList.add('lifted'); document.documentElement.style.cursor = 'grabbing';
      }
      drag.a = Math.max(0, Math.min(sweep('out', 36) + 3, angleAt(e) + drag.off));
      arm.style.transform = `rotate(${drag.a}deg)`;
    });
    const drop = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.live) { drag = null; return; }  // just a click: leave everything as it is
      const a = drag.a, lo = sweep('in', 24.5), hi = sweep('out', 36); drag = null;
      arm.classList.remove('lifted'); document.documentElement.style.cursor = '';
      requestAnimationFrame(() => {
        arm.style.transition = '';
        if (a >= lo - 3) {  // over the record: cue to that point and play
          elapsed = Math.max(0, Math.min(.9, (a - lo) / (hi - lo))) * clip();  // always leave a few seconds to play
          if (au.src && isFinite(au.duration)) au.currentTime = elapsed;
          if (live()) fx.needle();
          setOn(true);
        } else setArm();    // off the record: back to the rest
      });
    };
    arm.addEventListener('pointerup', drop); arm.addEventListener('pointercancel', drop);
  }

  // first record sits on the deck; the arm swings on the first time the section comes into view
  cur = 0; label.innerHTML = cover(0); showTrack(0); paint(); setArm();
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); setTimeout(() => { if (!on) setOn(true); }, 500); } }, { threshold: .45 }).observe(deck);
})();

// Tilt on hover: cards lean toward the pointer (the corner under it pressing away), grow to 1.02 and lift a little.
// Angle, scale and lift each ride a spring, stepped every frame, so the motion keeps its momentum and settles with
// a slight overshoot. The pointer is tracked against the element's resting outline (measured when the hover
// starts), not its tilted shape, so the tilt keeps working right up to the edges.
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // [selector, max angle, lift px]
  const CFG = [['.pc', 4, -4], ['.portrait', 4, 0], ['#listening .np', 4, 0], ['.tk-c', 4, 0], ['.jr-award', 4, -1]];
  const SEL = CFG.map((c) => c[0]).join(',');
  const TILT = { k: 500, c: 20 }, POP = { k: 400, c: 12 };  // stiffness / damping, from the reference
  const live = new Map();  // element -> spring state
  let hover = null, box = null, raf = 0, last = 0;
  const state = (el) => {
    let s = live.get(el);
    if (!s) { const c = CFG.find((c) => el.matches(c[0])); s = { max: c[1], lift: c[2], x: 0, y: 0, s: 1, l: 0, vx: 0, vy: 0, vs: 0, vl: 0, tx: 0, ty: 0, ts: 1, tl: 0 }; live.set(el, s); el.classList.add('tilt'); }
    return s;
  };
  const step = (s, key, vkey, target, sp, dt) => { const a = sp.k * (target - s[key]) - sp.c * s[vkey]; s[vkey] += a * dt; s[key] += s[vkey] * dt; };
  const tick = (now) => {
    const dt = Math.min(.05, last ? (now - last) / 1000 : 1 / 60); last = now;
    live.forEach((s, el) => {
      for (let t = 0; t < dt; t += 1 / 240) {  // small substeps keep the stiff spring stable
        const h = Math.min(1 / 240, dt - t);
        step(s, 'x', 'vx', s.tx, TILT, h); step(s, 'y', 'vy', s.ty, TILT, h); step(s, 's', 'vs', s.ts, POP, h); step(s, 'l', 'vl', s.tl, POP, h);
      }
      const rest = el !== hover && Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.s - 1) * 50 + Math.abs(s.l) < .03 && Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vs) + Math.abs(s.vl) < .05;
      if (rest) { ['--tilt-x', '--tilt-y', '--tilt-s', '--tilt-l'].forEach((p) => el.style.removeProperty(p)); el.classList.remove('tilt'); live.delete(el); return; }
      el.style.setProperty('--tilt-x', s.x.toFixed(3) + 'deg'); el.style.setProperty('--tilt-y', s.y.toFixed(3) + 'deg');
      el.style.setProperty('--tilt-s', s.s.toFixed(4)); el.style.setProperty('--tilt-l', s.l.toFixed(2) + 'px');
    });
    raf = live.size ? requestAnimationFrame(tick) : 0; if (!raf) last = 0;
  };
  const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const release = () => { if (!hover) return; hover.classList.remove('tilt-hot'); const s = live.get(hover); if (s) { s.tx = 0; s.ty = 0; s.ts = 1; s.tl = 0; } hover = null; box = null; run(); };
  const inside = (x, y) => x >= box.left - 2 && x <= box.right + 2 && y >= box.top - scrollY - 2 && y <= box.bottom - scrollY + 2;
  addEventListener('pointermove', (e) => {
    if (hover && !inside(e.clientX, e.clientY)) release();
    if (!hover) {
      const t = e.target.closest && e.target.closest(SEL);
      if (!t || (t.matches('.tk-c') && !t.closest('.tk.open'))) return;
      const r = t.getBoundingClientRect(), s0 = live.get(t);
      // if it is still springing back, take out the current scale/lift so the outline is the resting one
      const k = s0 ? s0.s : 1, dy = s0 ? s0.l : 0, cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2 - dy, w = r.width / k / 2, hh = r.height / k / 2;
      hover = t; t.classList.add('tilt-hot'); box = { left: cx - w, right: cx + w, top: cy - hh + scrollY, bottom: cy + hh + scrollY };  // page coords, so scrolling keeps it valid
    }
    const s = state(hover);
    const x = Math.max(-1, Math.min(1, (e.clientX - box.left) / (box.right - box.left) * 2 - 1)), y = Math.max(-1, Math.min(1, (e.clientY + scrollY - box.top) / (box.bottom - box.top) * 2 - 1));
    s.tx = -y * s.max; s.ty = x * s.max; s.ts = 1.02; s.tl = s.lift;
    run();
  }, { passive: true });
  document.addEventListener('pointerleave', release);
  addEventListener('blur', release);
  addEventListener('scroll', () => { if (hover && hover.matches('.tk-c') && !hover.closest('.tk.open')) release(); }, { passive: true });
})();

// Project covers: live product screens scaled to the card, each playing its flow on a loop while on screen.
(() => {
  const covers = [...document.querySelectorAll('.cv')];
  if (!covers.length) return;
  const fit = (el) => el.style.setProperty('--cvs', el.clientWidth / 1600);
  const ro = new ResizeObserver((es) => es.forEach((e) => fit(e.target)));
  covers.forEach((el) => { fit(el); ro.observe(el); });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // keep the finished frame

  // the Quality Coach reply types in word by word
  document.querySelectorAll('.cv-qc .cv-txt').forEach((t) => {
    let n = 0;
    const walk = (node) => [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.append(w); else { const s = document.createElement('span'); s.className = 'cv-w'; s.style.setProperty('--i', n++); s.textContent = w; f.append(s); } });
        c.replaceWith(f);
      } else if (!(c.classList && c.classList.contains('new'))) walk(c);
    });
    walk(t);
  });
  const ring = (el, from, to, ms) => {
    const r = el.querySelector('.cv-ring'), b = r && r.querySelector('b'); if (!r) return;
    const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3), v = Math.round(from + (to - from) * e);
      r.style.setProperty('--p', v); b.textContent = v; if (k < 1 && el._run) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const PLANS = {
    qa: { total: 9000, steps: [[250, 's1'], [1300, 's2'], [2100, 's3'], [3100, 's4'], [3700, 's5'], [4300, 's6']] },
    qc: { total: 11500, steps: [[300, 's1'], [2600, 's2'], [3200, 's3', (el) => ring(el, 0, 82, 900)], [4300, 's4'], [5900, 's5'],
      [6300, 's6', (el) => { ring(el, 82, 94, 700); el.querySelector('.cv-score strong').textContent = 'Great · 2 suggestions'; }]] },
  };
  const S = ['s1', 's2', 's3', 's4', 's5', 's6'];
  covers.forEach((el) => {
    const plan = PLANS[el.classList.contains('cv-qa') ? 'qa' : 'qc'];
    let timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    const reset = () => {
      el.classList.add('rs'); el.classList.remove(...S);
      const r = el.querySelector('.cv-ring'); if (r) { r.style.setProperty('--p', 0); r.querySelector('b').textContent = 0; }
      const st = el.querySelector('.cv-score strong'); if (st) st.textContent = 'Good · 3 suggestions';
      void el.offsetWidth; el.classList.remove('rs');
    };
    const cycle = () => {
      reset(); el.classList.remove('out');
      plan.steps.forEach(([t, c, fn]) => later(t, () => { el.classList.add(c); if (fn) fn(el); }));
      later(plan.total - 700, () => el.classList.add('out'));
      later(plan.total, cycle);
    };
    const start = () => { if (el._run) return; el._run = true; el.classList.add('anim'); cycle(); };
    const stop = () => { el._run = false; timers.forEach(clearTimeout); timers = []; el.classList.remove('anim', 'out', ...S); };
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: .25 }).observe(el);
  });
})();

// Case study lightbox: every product screenshot on a case study opens large. Arrows, arrow keys or a swipe move
// through that page's screenshots in reading order; Esc, the close button or a click on the backdrop closes it.
(() => {
  const key = (img) => img.dataset.asset || img.getAttribute('src') || '';
  const isShot = (img) => /screens\//.test(key(img)) && !img.closest('a');
  const ico = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  let lb, im, cap, num, set = [], at = 0, back = null;
  const build = () => {
    lb = document.createElement('div');
    lb.className = 'clb'; lb.tabIndex = -1; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Screenshot viewer');
    lb.innerHTML = `<div class="clb-top"><span class="clb-n" aria-live="polite"></span><span class="clb-r"><kbd class="clb-esc" aria-hidden="true">Esc</kbd><button type="button" class="clb-x" aria-label="Close (Esc)">${ico('M6 6l12 12M18 6L6 18')}</button></span></div>
      <div class="clb-stage"><button type="button" class="clb-prev" aria-label="Previous screenshot">${ico('M15 6l-6 6 6 6')}</button><img class="clb-img" alt=""><button type="button" class="clb-next" aria-label="Next screenshot">${ico('M9 6l6 6-6 6')}</button></div>
      <p class="clb-cap"></p>`;
    document.body.append(lb);
    im = lb.querySelector('.clb-img'); cap = lb.querySelector('.clb-cap'); num = lb.querySelector('.clb-n');
    lb.querySelector('.clb-x').addEventListener('click', close);
    lb.querySelector('.clb-prev').addEventListener('click', () => go(-1));
    lb.querySelector('.clb-next').addEventListener('click', () => go(1));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('clb-stage')) close(); });
    let x0 = null;
    lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1); });
  };
  const label = (img) => {
    const fig = img.closest('figure'), fc = fig && fig.querySelector('figcaption');
    const t = fc ? [...fc.childNodes].filter((n) => !(n.nodeType === 1 && n.tagName === 'SPAN')).map((n) => n.textContent).join('').trim() : '';
    return t || img.alt.replace(/^[^:]+:\s*/, '');
  };
  const show = (i, anim) => {
    at = (i + set.length) % set.length;
    const s = set[at], pad = (n) => String(n).padStart(2, '0');
    const put = () => { im.src = s.img.currentSrc || s.img.src; im.alt = s.alt; cap.textContent = s.cap; im.classList.remove('swap'); };
    num.innerHTML = `<b>${pad(at + 1)}</b> / ${pad(set.length)}`;
    if (anim) { im.classList.add('swap'); setTimeout(put, 160); } else put();
  };
  const go = (d) => set.length > 1 && show(at + d, true);
  const open = (img) => {
    if (!lb) build();
    const root = img.closest('section') || img.closest('main') || document;  // only this section's screenshots
    const seen = new Map();
    root.querySelectorAll('img').forEach((el) => {
      if (!isShot(el)) return;
      const k = key(el), ok = el.alt && !el.closest('[aria-hidden="true"]');
      if (!seen.has(k)) seen.set(k, { img: el, alt: el.alt, cap: label(el) });
      else if (ok && !seen.get(k).cap) Object.assign(seen.get(k), { alt: el.alt, cap: label(el) });
    });
    set = [...seen.values()];
    back = document.activeElement;
    lb.classList.toggle('one', set.length < 2);
    show(Math.max(0, set.findIndex((s) => key(s.img) === key(img))), false);
    lb.classList.add('on'); document.documentElement.style.overflow = 'hidden';
    lb.focus({ preventScroll: true });
  };
  function close() {
    if (!lb || !lb.classList.contains('on')) return;
    lb.classList.remove('on'); document.documentElement.style.overflow = '';
    if (back && back.focus) back.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    const img = e.target.closest && e.target.closest('.cs img');
    if (!img || !isShot(img)) return;
    e.preventDefault(); open(img);
  });
  document.addEventListener('keydown', (e) => {
    if (!lb || !lb.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') { const f = [...lb.querySelectorAll('button')].filter((b) => getComputedStyle(b).display !== 'none'); const i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });
  addEventListener('hashchange', close);
})();
