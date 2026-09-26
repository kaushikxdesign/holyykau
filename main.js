// Theme: follows system until the visitor picks one.
(function () {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved) root.dataset.theme = saved;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme')) return;
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const io = new IntersectionObserver((es) => es.forEach((x) => {
    if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach((el) => io.observe(el));

  // Dribbble shots — drop images in assets/shots and list them here.
  const shots = window.SHOTS || [];
  const sEl = document.getElementById('shots-grid');
  if (sEl) sEl.innerHTML = shots.map((s) => s.img
    ? `<a class="shot rv" href="${s.url}" target="_blank" rel="noopener"><img src="${s.img}" alt="${s.title}" loading="lazy"><span class="cap">${s.title}</span></a>`
    : `<a class="shot rv" href="${s.url}" target="_blank" rel="noopener">${s.title}</a>`).join('');

  // Photography
  const photos = window.PHOTOS || [];
  const pEl = document.getElementById('photos-grid');
  if (pEl) pEl.innerHTML = photos.map((p) => p.src
    ? `<figure class="photo rv"><img src="${p.src}" alt="${p.alt || ''}" loading="lazy"></figure>`
    : `<figure class="photo rv" style="aspect-ratio:${p.ratio || '4/5'}">${p.alt || 'Add photo'}</figure>`).join('');
  const lb = document.querySelector('.lightbox');
  if (pEl && lb) {
    pEl.addEventListener('click', (e) => {
      const img = e.target.closest('.photo img'); if (!img) return;
      lb.innerHTML = `<img src="${img.src}" alt="${img.alt}">`; lb.classList.add('on');
    });
    lb.addEventListener('click', () => lb.classList.remove('on'));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && lb.classList.remove('on'));
  }
  pEl && pEl.querySelectorAll('.rv').forEach((el) => io.observe(el));
  sEl && sEl.querySelectorAll('.rv').forEach((el) => io.observe(el));
});
