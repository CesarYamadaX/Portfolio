"""Generate the procedural textures and placeholder media used by the site.

    python tools/generate_textures.py

Writes equirectangular planet maps to public/textures/ and placeholder posters to
public/media/<project>/. Everything is made from noise, so there is nothing to license.
Requires numpy and Pillow. You only need to re-run this if you want different planets.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
TEX = os.path.join(ROOT, 'textures')
os.makedirs(TEX, exist_ok=True)


def vnoise(x, y, z, seed):
    xi = np.floor(x).astype(np.int64); yi = np.floor(y).astype(np.int64); zi = np.floor(z).astype(np.int64)
    xf = x - xi; yf = y - yi; zf = z - zi
    u = xf * xf * (3 - 2 * xf); v = yf * yf * (3 - 2 * yf); w = zf * zf * (3 - 2 * zf)

    def h(a, b, c):
        n = (a * 374761393 + b * 668265263 + c * 1274126177 + seed * 974634221) & 0xFFFFFFFF
        n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
        n = n ^ (n >> 16)
        return n / 4294967296.0

    x00 = h(xi, yi, zi) * (1 - u) + h(xi + 1, yi, zi) * u
    x10 = h(xi, yi + 1, zi) * (1 - u) + h(xi + 1, yi + 1, zi) * u
    x01 = h(xi, yi, zi + 1) * (1 - u) + h(xi + 1, yi, zi + 1) * u
    x11 = h(xi, yi + 1, zi + 1) * (1 - u) + h(xi + 1, yi + 1, zi + 1) * u
    return (x00 * (1 - v) + x10 * v) * (1 - w) + (x01 * (1 - v) + x11 * v) * w


def fbm(x, y, z, seed, octaves=6):
    s = 0.0; a = 0.5; f = 1.0
    for o in range(octaves):
        s = s + a * vnoise(x * f, y * f, z * f, seed + o * 17)
        f *= 2.03; a *= 0.5
    return s


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def col(c):
    return np.array(c, dtype=np.float64)


def equirect(w, kind, seed, name, quality=86):
    """Sample noise on the unit sphere so the map wraps without a seam."""
    h = w // 2
    lat = (0.5 - (np.arange(h) + 0.5) / h) * np.pi
    lon = ((np.arange(w) + 0.5) / w) * 2 * np.pi
    lon, lat = np.meshgrid(lon, lat)
    x = np.cos(lat) * np.cos(lon); y = np.sin(lat); z = np.cos(lat) * np.sin(lon)

    if kind in ('gas', 'violet'):
        warp = fbm(x * 1.6, y * 1.6, z * 1.6, seed, 5)
        v = y * 7.0 + (warp - 0.5) * 2.2
        bands = 0.5 + 0.5 * np.sin(v * 2.6)
        streak = fbm(x * 1.2, y * 14.0, z * 1.2, seed + 3, 6)
        fine = fbm(x * 6, y * 40.0, z * 6, seed + 5, 4)
        t = np.clip(bands * 0.6 + streak * 0.5 + (fine - 0.5) * 0.15 - 0.1, 0, 1)
        if kind == 'gas':
            c1, c2, c3 = col((0.03, 0.10, 0.24)), col((0.12, 0.38, 0.56)), col((0.66, 0.82, 0.88))
        else:
            c1, c2, c3 = col((0.06, 0.05, 0.22)), col((0.28, 0.26, 0.62)), col((0.76, 0.74, 0.92))
        rgb = np.where(t[..., None] < 0.5, lerp(c1, c2, (t * 2)[..., None]), lerp(c2, c3, (t * 2 - 1)[..., None]))
    elif kind == 'terra':
        hgt = fbm(x * 2.1, y * 2.1, z * 2.1, seed, 9)
        land = smooth(0.50, 0.52, hgt)
        ocean = lerp(col((0.01, 0.05, 0.16)), col((0.04, 0.20, 0.36)), smooth(0.36, 0.5, hgt)[..., None])
        ground = lerp(col((0.17, 0.22, 0.13)), col((0.46, 0.40, 0.30)), smooth(0.52, 0.68, hgt)[..., None])
        ice = smooth(0.82, 0.92, np.abs(y) + (hgt - 0.5) * 0.3)
        rgb = lerp(ocean, ground, land[..., None])
        rgb = lerp(rgb, col((0.90, 0.93, 0.96)), ice[..., None])
        cl = fbm(x * 3.3 + 9, y * 4.4, z * 3.3, seed + 40, 8)
        clouds = smooth(0.50, 0.68, cl)
        rgb = lerp(rgb, col((0.95, 0.97, 1.0)), (clouds * 0.92)[..., None])
    else:  # 'ice' and 'moon'
        k = 3.0 if kind == 'ice' else 4.0
        hgt = fbm(x * k, y * k, z * k, seed, 9)
        e = 0.01
        shade = np.clip(1 + (hgt - fbm((x + e) * k, (y + e) * k, z * k, seed, 9)) * 30, 0.55, 1.45)
        if kind == 'ice':
            rgb = lerp(col((0.22, 0.26, 0.32)), col((0.78, 0.83, 0.88)), smooth(0.25, 0.75, hgt)[..., None])
        else:
            rgb = lerp(col((0.17, 0.16, 0.15)), col((0.62, 0.60, 0.56)), smooth(0.25, 0.75, hgt)[..., None])
        rgb = rgb * shade[..., None]

    img = (np.clip(rgb, 0, 1) ** (1 / 2.2) * 255 + 0.5).astype(np.uint8)
    path = os.path.join(TEX, name)
    Image.fromarray(img, 'RGB').save(path, 'JPEG', quality=quality)
    print(name, os.path.getsize(path) // 1024, 'KB')


def poster(folder, label, tint, index):
    """A clearly-labelled 16:10 placeholder so the layout can be judged before real media exists."""
    w, h = 1280, 800
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    n = fbm(xx / 320, yy / 320, index * 3.1, 90 + index, 5)
    base = col(tint)[None, None, :] * (0.55 + 0.6 * n[..., None])
    grid = ((xx % 80 < 1.5) | (yy % 80 < 1.5))[..., None] * 0.10
    img = Image.fromarray((np.clip(base + grid, 0, 1) * 255).astype(np.uint8), 'RGB')
    d = ImageDraw.Draw(img)
    try:
        big = ImageFont.truetype('arial.ttf', 54); small = ImageFont.truetype('arial.ttf', 28)
    except OSError:
        big = small = ImageFont.load_default()
    d.text((w / 2, h / 2 - 30), label, font=big, fill=(232, 238, 248), anchor='mm')
    d.text((w / 2, h / 2 + 40), f'Placeholder {index} - replace in public/media/{folder}/', font=small, fill=(184, 196, 216), anchor='mm')
    out = os.path.join(ROOT, 'media', folder)
    os.makedirs(out, exist_ok=True)
    img.save(os.path.join(out, f'placeholder-{index}.jpg'), 'JPEG', quality=84)
    print(folder, f'placeholder-{index}.jpg')


if __name__ == '__main__':
    equirect(2048, 'gas', 11, 'planet-hero.jpg')
    equirect(2048, 'terra', 21, 'planet-pricing.jpg')
    equirect(2048, 'violet', 31, 'planet-whatsapp.jpg')
    equirect(2048, 'ice', 41, 'planet-pfizer.jpg')
    equirect(1024, 'moon', 51, 'moon.jpg')
    equirect(4096, 'terra', 61, 'planet-landing.jpg', quality=80)
    poster('pricing', 'Pricing dashboard', (0.07, 0.16, 0.30), 1)
    poster('pricing', 'Market scraping suite', (0.05, 0.20, 0.26), 2)
    poster('whatsapp', 'WhatsApp AI assistant', (0.12, 0.11, 0.30), 1)
