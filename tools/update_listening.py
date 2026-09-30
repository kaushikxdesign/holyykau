#!/usr/bin/env python3
"""Refresh the "What I'm currently listening to" records from Last.fm + Spotify.

Two steps, run by the weekly update:

  python3 tools/update_listening.py candidates
      Needs LASTFM_API_KEY. Prints my top tracks of the last 7 days (most played first) as JSON:
      [{"artist", "track", "plays", "album"}]. The weekly run finds each one's Spotify track id.

  python3 tools/update_listening.py apply picks.json
      picks.json: 5 items in play order, [{"id": "<spotify track id>", "album": "<album name>"}].
      For each track it reads Spotify's public embed data (title, artists, length, release year,
      30-second preview, cover), saves the cover to assets/music/, picks a light tint from the cover,
      and rewrites window.TRACKS in data.js. Covers no longer used are deleted. A track without a
      preview is an error, so the run can pick the next candidate instead.
"""
import colorsys, io, json, os, re, sys, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USER = 'kaushikkk'
UA = {'User-Agent': 'Mozilla/5.0 (holyykau listening updater)'}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def lastfm(method, **params):
    key = os.environ.get('LASTFM_API_KEY')
    if not key:
        sys.exit('LASTFM_API_KEY is not set')
    q = urllib.parse.urlencode({'method': method, 'api_key': key, 'format': 'json', **params})
    return json.loads(get('https://ws.audioscrobbler.com/2.0/?' + q))


def candidates():
    top = lastfm('user.gettoptracks', user=USER, period='7day', limit=20).get('toptracks', {}).get('track', [])
    out = []
    for t in top:
        artist, track = t['artist']['name'], t['name']
        album = ''
        try:
            info = lastfm('track.getInfo', artist=artist, track=track, username=USER).get('track', {})
            album = (info.get('album') or {}).get('title', '')
        except Exception:
            pass
        out.append({'artist': artist, 'track': track, 'plays': int(t.get('playcount', 0)), 'album': album})
    print(json.dumps(out, ensure_ascii=False, indent=1))


def embed(tid):
    s = get(f'https://open.spotify.com/embed/track/{tid}').decode('utf-8')
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', s, re.S)
    return json.loads(m.group(1))['props']['pageProps']['state']['data']['entity']


def clean_title(name):
    t = re.split(r' - ', name)[0]                       # "Magale - From "Baththa"" -> "Magale"
    t = re.sub(r'\s*\((feat\.|with|From)[^)]*\)', '', t, flags=re.I)
    return t.strip()


def tint(img):
    """A light colour from the cover: its most vivid common colour, lifted to 80% lightness."""
    from PIL import Image
    im = img.convert('RGB').resize((96, 96)).quantize(12, method=Image.Quantize.MEDIANCUT)
    pal, best = im.getpalette(), None
    for n, i in sorted(im.getcolors(), reverse=True):
        r, g, b = [c / 255 for c in pal[i * 3:i * 3 + 3]]
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        score = n * (s ** 1.5) * (0.3 + min(l, 1 - l))
        if best is None or score > best[0]:
            best = (score, h, s)
    _, h, s = best
    r, g, b = colorsys.hls_to_rgb(h, 0.8, min(max(s, .45), .85))
    return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:40] or 'track'


def js(s):
    return json.dumps(s, ensure_ascii=False)


def apply(path):
    from PIL import Image
    picks = json.load(open(path))
    if len(picks) != 5:
        sys.exit(f'need exactly 5 picks, got {len(picks)}')
    music = os.path.join(ROOT, 'assets', 'music')
    rows, keep = [], set()
    for p in picks:
        e = embed(p['id'])
        preview = (e.get('audioPreview') or {}).get('url')
        if not preview:
            sys.exit(f'NO_PREVIEW {p["id"]} {e.get("name")}')
        title = clean_title(e['name'])
        artists = [a['name'] for a in e.get('artists', [])][:2]
        year = (e.get('releaseDate') or {}).get('isoString', '')[:4]
        album = (p.get('album') or '').strip()
        m = re.search(r'From "([^"]+)"', e['name'])
        if m and (not album or album.lower().startswith(title.lower())):
            album = m.group(1)                          # film songs: show the film, not the single
        album = album or title
        imgs = sorted(e['visualIdentity']['image'], key=lambda i: i.get('maxWidth', 0))
        big = imgs[-1]['url'].split('/image/')[-1]
        img = Image.open(io.BytesIO(get('https://i.scdn.co/image/' + big))).convert('RGB').resize((480, 480), Image.LANCZOS)
        name = slug(title) + '.jpg'
        img.save(os.path.join(music, name), quality=86, optimize=True)
        keep.add(name)
        rows.append(f"  {{ id: '{p['id']}', title: {js(title)}, artist: {js(', '.join(artists))}, meta: {js(album + ' · ' + year if year else album)}, "
                    f"dur: {round(e['duration'] / 1000)}, tint: '{tint(img)}',\n    cover: 'assets/music/{name}', preview: '{preview}' }},")
        print(f'{title} — {", ".join(artists)} ({album} · {year})')
    dpath = os.path.join(ROOT, 'data.js')
    d = open(dpath, encoding='utf-8').read()
    block = 'window.TRACKS = [\n' + '\n'.join(rows) + '\n];'
    d, n = re.subn(r'window\.TRACKS = \[.*?\n\];', lambda _: block, d, flags=re.S)
    if n != 1:
        sys.exit('could not find window.TRACKS in data.js')
    open(dpath, 'w', encoding='utf-8').write(d)
    for f in os.listdir(music):                         # drop covers of records that left the wall
        if f.endswith('.jpg') and f not in keep:
            os.remove(os.path.join(music, f))


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'candidates':
        candidates()
    elif len(sys.argv) >= 3 and sys.argv[1] == 'apply':
        apply(sys.argv[2])
    else:
        sys.exit(__doc__)
