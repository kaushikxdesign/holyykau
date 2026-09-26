document.addEventListener('DOMContentLoaded', () => {
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
