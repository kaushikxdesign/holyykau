document.addEventListener('DOMContentLoaded', () => {
  const io = new IntersectionObserver((es) => es.forEach((x) => {
    if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
  }), { threshold: 0.1 });
  const shots = window.SHOTS || [], sEl = document.getElementById('shots-grid');
  if (sEl) sEl.innerHTML = shots.map((s) => `<a class="shot rv" href="${s.url}" target="_blank" rel="noopener">${s.img ? `<img src="${s.img}" alt="${s.title}" loading="lazy">` : s.title}</a>`).join('');
  const photos = window.PHOTOS || [], pEl = document.getElementById('photos-grid');
  if (pEl) pEl.innerHTML = photos.map((p) => p.src
    ? `<figure class="photo rv"><img src="${p.src}" alt="${p.alt || ''}" loading="lazy"></figure>`
    : `<figure class="photo rv" style="aspect-ratio:${p.ratio || '4/5'}">${p.alt || 'Add photo'}</figure>`).join('');
  document.querySelectorAll('.rv').forEach((el) => io.observe(el));
  const lb = document.querySelector('.lightbox');
  if (pEl && lb) {
    pEl.addEventListener('click', (e) => { const img = e.target.closest('.photo img'); if (!img) return; lb.innerHTML = `<img src="${img.src}" alt="${img.alt}">`; lb.classList.add('on'); });
    lb.addEventListener('click', () => lb.classList.remove('on'));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && lb.classList.remove('on'));
  }
});
