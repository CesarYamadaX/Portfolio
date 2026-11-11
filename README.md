# César Yamada — space portfolio

A single-page portfolio you travel through by scrolling: a hero planet, an orbiting
station (About), three project planets with moons, skill constellations, and a landing
scene (Contact).

Built with Vite, React, Three.js (React Three Fiber, drei, postprocessing) and GSAP
ScrollTrigger.

## Run it

Requires Node 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open the address Vite prints (normally http://localhost:5173).

To check the production build locally:

```bash
npm run build
```

```bash
npm run preview
```

If `npm install` fails with `407 Proxy Authentication Required`, your network proxy needs
credentials; configure them for npm (or install from a network without the proxy) and retry.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel choose **Add New → Project** and import the repository.
3. Vercel detects Vite on its own. The defaults are right: build command `npm run build`,
   output directory `dist`.
4. Deploy. Every later push to the main branch redeploys.

Or from a terminal, with the Vercel CLI installed (`npm i -g vercel`):

```bash
vercel --prod
```

## Add media to a project

Each project has a folder in `public/media/` and a `media.json` manifest in it:

| Project | Folder |
| --- | --- |
| Competitive Pricing Intelligence | `public/media/pricing/` |
| Honor WhatsApp AI Assistant | `public/media/whatsapp/` |
| Pfizer Clustering Project | `public/media/pfizer/` |

1. Copy your images and videos into the project's folder.
2. List them in that folder's `media.json`, in the order they should appear:

```json
{
  "items": [
    { "src": "demo.webm", "type": "video", "poster": "demo-poster.jpg", "caption": "Live price comparison" },
    { "src": "overview.jpg", "type": "image", "caption": "Dashboard overview" }
  ]
}
```

- `src` — file name inside the folder (or a full URL).
- `type` — `"image"` or `"video"`.
- `poster` — for videos: a still image shown before the video loads, on mobile, and as the thumbnail.
  Always provide one.
- `caption` — shown under the item; optional.

What happens with the list:

- The **first item** is mapped onto the planet's face. If it is a video, it plays muted and
  looping while the camera is near the planet (desktop only); otherwise its poster is shown.
- All items appear in the detail panel's gallery when the planet is opened. Videos start muted
  and looping, and show controls after a click; images open in a zoomable full-screen viewer.
- An empty list (`"items": []`) is fine: the planet shows its own surface and the panel says
  there is no media yet. The Pfizer project ships this way.

Recommendations: 16:10 or 16:9 media, videos as `.webm` or `.mp4` under about 5 MB and
10–20 seconds, posters as `.jpg` around 1280 px wide. The `placeholder-*.jpg` files are stand-ins;
delete them once real media is in place.

## Edit the content

All text, links, skills and scene positions are in `src/data/content.js`. You should not need
to touch scene code to change copy or add a skill.

## How it is organised

```
index.html              Meta tags, fonts, and a plain-HTML copy of the content (SEO / no-JS)
src/
  App.jsx               Chooses animated vs. reduced-motion mode; lazy-loads the 3D scene
  hooks.js              Device profile, media manifests, scroll journey (GSAP), ambient audio
  state.js              Small shared store (selected project, hover, audio, loading)
  data/content.js       All copy and layout data
  scene/
    Experience.jsx      Canvas, sky, stars, sun, camera rig, post-processing
    Bodies.jsx          Atmosphere shader, hero planet, station, moons, landing planet
    ProjectPlanet.jsx   Project planets and their lazy image/video face
    Constellations.jsx  Skill constellations
  ui/
    Overlay.jsx         Loading screen, navigation, the HTML sections, tooltip
    ProjectPanel.jsx    Detail panel, gallery and lightbox
  styles.css
public/
  textures/             Procedural planet maps and the star-field backdrop
  media/<project>/      Project media + media.json
tools/generate_textures.py   Regenerates the textures and placeholders (optional; numpy + Pillow)
```

## Behaviour notes

- **Scroll and camera** — page scroll drives one progress value through GSAP ScrollTrigger
  (`scrub`), and the camera eases toward a smooth curve through five stops, so there are no cuts.
- **Projects** — hover a planet for a tooltip, click to fly in and open its panel. The same
  panels open from the project buttons in the Projects section, which is the keyboard and
  touch path. `Esc` closes; arrow keys step through the gallery.
- **Mobile** — fewer stars, lower resolution, no depth of field or god rays, and static posters
  instead of video textures.
- **Performance** — the 3D code is a separate lazy chunk; media loads only near a planet or in
  an open panel; resolution drops automatically if the frame rate falls.
- **Reduced motion** — with `prefers-reduced-motion`, WebGL is not started at all. Visitors get
  a still backdrop and the same content as a normal scrolling page.
- **Sound** — ambient sound is synthesised in the browser, off by default, toggled from the
  top bar.
- **Textures** — all planet maps and the sky are generated by `tools/generate_textures.py`,
  so there is nothing to license.
