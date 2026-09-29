# Portfolio site

Static HTML/CSS/JS with no build step.

- Preview: `npx serve .`
- Single-file build: `python3 build_artifact.py` writes `dist/kaushik.html` (everything inlined)
- Deploy: import the repo on Vercel; the repo root is the site root
- Dribbble shots: save images to `assets/shots/` and fill `img` + `url` in `data.js`
- Photos: save images to `assets/photos/` and fill `src` in `data.js`
- Footer links (LinkedIn, email): edit in each HTML file
- `framer-thumbnails/`: sources for the project card thumbnails

History before this repo lived in `kaushikxdesign/cs-` (branch `claude/exciting-lovelace-uccn85`, under `site/`).
