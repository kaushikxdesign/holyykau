"""Bundle the multi-file site into one self-contained page for the claude.ai artifact viewer.

The viewer only allows inline CSS/JS and data: images, wraps the file in its own
<html>/<head>/<body>, and cannot follow links to other published HTML files. So this
inlines everything and turns the gallery and case studies into hash-routed views.
Run: python3 build_artifact.py  ->  dist/kaushik.html
"""
import base64, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()

def data_uri(path):
    ext = path.rsplit('.', 1)[1].lower()
    mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'}[ext]
    return f"data:{mime};base64," + base64.b64encode(open(os.path.join(ROOT, path), 'rb').read()).decode()

def between(html, start_pat, end_pat):
    m = re.search(start_pat + r'.*?' + end_pat, html, re.S)
    return m.group(0) if m else ''

index, gallery = rd('index.html'), rd('gallery.html')
cases = {'quick-automations': rd('work/quick-automations.html'), 'quality-coach': rd('work/quality-coach.html')}

nav = between(index, r'<header class="nav">', r'</header>')
home = between(index, r'<main>', r'</main>')
footer = between(index, r'<footer class="fphoto', r'</footer>') + '\n<p class="copy">© 2026 Kaushik Subramaniam</p>'
dock = between(index, r'<nav class="dock"', r'</nav>')
gal = between(gallery, r'<main>', r'</main>')
case_views = {k: between(v, r'<main class="cs">', r'</main>') for k, v in cases.items()}
fonts = re.search(r'<link href="https://fonts.googleapis.com[^>]+>', index).group(0)

body = f'''<div class="shell" id="top">
{nav}
<div data-view="home">{home}</div>
<div data-view="gallery" hidden>{gal}</div>
</div>
''' + ''.join(f'<div data-view="{k}" hidden>{v}</div>\n' for k, v in case_views.items()) + f'''<div class="shell">{footer}</div>
{dock}
<div class="lightbox"></div>'''

# links -> in-page routes
for a, b in [('../index.html#', '#'), ('index.html#', '#'), ('"../index.html"', '"#top"'), ('"index.html"', '"#top"'),
             ('"../gallery.html"', '"#gallery"'), ('"gallery.html"', '"#gallery"'),
             ('"work/quick-automations.html"', '"#quick-automations"'), ('"work/quality-coach.html"', '"#quality-coach"')]:
    body = body.replace(a, b)
# images -> data URIs
for path in sorted(set(re.findall(r'(?:\.\./)?(assets/[\w\-]+\.(?:jpg|jpeg|png))', body))):
    body = re.sub(r'(?:\.\./)?' + re.escape(path), data_uri(path), body)

router = r'''
(() => {
  const views = [...document.querySelectorAll('[data-view]')];
  const routes = views.map((v) => v.dataset.view).filter((v) => v !== 'home');
  const show = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    const name = routes.includes(h) ? h : 'home';
    views.forEach((v) => { v.hidden = v.dataset.view !== name; });
    document.querySelectorAll('.links a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + name));
    dispatchEvent(new Event('resize'));
    if (name !== 'home' || !h || h === 'top') scrollTo(0, 0);
    else { const el = document.getElementById(h); if (el) el.scrollIntoView(); }
  };
  addEventListener('hashchange', show); show();
})();
'''
css = rd('styles.css') + '''
/* artifact bundle: content is complete at rest, no hidden-until-scrolled states */
.rv,.js .rv{opacity:1!important;transform:none!important;filter:none!important}
:root{color-scheme:dark}
body{background:var(--bg);margin:0}
.nav{top:env(safe-area-inset-top,0px)}
'''
js = rd('data.js') + '\n' + rd('main.js').replace("document.addEventListener('DOMContentLoaded', () => {", "(() => {", 1)
# main.js's first block was a DOMContentLoaded handler; the script now runs at the end, so call it directly
js = js.replace("\n});\n\n// Live LED", "\n})();\n\n// Live LED", 1)

out = f'''<title>Kaushik Subramaniam</title>
<meta name="description" content="Kaushik Subramaniam, Senior Product Designer at Multiplier. I design for the better.">
{fonts}
<style>{css}</style>
{body}
<script>{js}
{router}</script>
'''
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'kaushik.html'), 'w', encoding='utf-8').write(out)
print('dist/kaushik.html', round(len(out) / 1024), 'KB')
