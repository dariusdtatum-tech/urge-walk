"""File names carry the icon version (-b): iOS and browsers cache home-screen icons by URL,
so a new icon needs a new name. Bump the suffix (and index.html / vite.config.js) on the next change.

Generates the Urge Walk PWA icons into public/ from the Light B icon (scripts/icon/light-b.svg).
Run: python3 scripts/make_icons.py   (needs rsvg-convert and Pillow)

Writes:
  apple-touch-icon-b.png  180, opaque (iOS shows transparency as black)
  pwa-192-b.png       192
  pwa-512-b.png       512
  pwa-maskable-512-b.png  512, opaque; the mark is re-centred and scaled to sit inside the
                        maskable safe zone (circle of radius 40% of the size)
  favicon-b.svg           the source SVG
  favicon-64-b.png, favicon-32-b.png, favicon-b.ico (16/32/48)
"""
import io, math, os, re, shutil, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "icon", "light-b.svg")
OUT = os.path.join(HERE, "..", "public")
os.makedirs(OUT, exist_ok=True)
SVG = open(SRC).read()


def render(svg_text, size):
    png = subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size)], input=svg_text.encode(),
                         capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert("RGBA")


def opaque(img):
    bg = Image.new("RGB", img.size, (250, 247, 241))
    bg.paste(img, mask=img.getchannel("A"))
    return bg


def save(img, name):
    img.save(os.path.join(OUT, name))
    print("wrote", name, img.size, img.mode)


full = {s: opaque(render(SVG, s)) for s in (16, 32, 48, 64, 120, 152, 167, 180, 192, 512)}
save(full[180], "apple-touch-icon-b.png")
for s in (120, 152, 167):
    save(full[s], f"apple-touch-icon-{s}-b.png")
# iOS also probes the conventional names next to the page; serve the current icon there too.
save(full[180], "apple-touch-icon.png")
save(full[180], "apple-touch-icon-precomposed.png")
save(full[192], "pwa-192-b.png")
save(full[512], "pwa-512-b.png")
save(full[64], "favicon-64-b.png")
save(full[32], "favicon-32-b.png")
full[48].save(os.path.join(OUT, "favicon-b.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[full[16], full[32]])
print("wrote favicon-b.ico")
shutil.copyfile(SRC, os.path.join(OUT, "favicon-b.svg")); print("wrote favicon-b.svg")

# Maskable: find the mark (everything but the background rect), centre it and fit it in the safe circle.
m = re.match(r'(.*?<rect width="1024" height="1024" fill="url\(#g\)"/>)(.*)(</svg>\s*)$', SVG, re.S)
head, mark, tail = m.groups()
mark_only = render(head.replace('fill="url(#g)"', 'fill="none"') + mark + tail, 1024)
alpha = mark_only.getchannel("A")
px = alpha.load()
pts = [(x, y) for y in range(0, 1024, 2) for x in range(0, 1024, 2) if px[x, y] > 8]
x0, y0, x1, y1 = alpha.getbbox()
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
far = max(math.hypot(x - cx, y - cy) for x, y in pts)
k = (0.40 * 1024 * 0.94) / far  # a little margin inside the 80% safe zone
inner = f'<g transform="translate(512 512) scale({k:.4f}) translate({-cx:.1f} {-cy:.1f})">{mark}'
masked = opaque(render(head + inner + "</g>" + tail, 512))
save(masked, "pwa-maskable-512-b.png")
print(f"maskable: mark scale {k:.3f}, farthest point {far * k / 1024:.3f} of size from centre (limit 0.400)")
