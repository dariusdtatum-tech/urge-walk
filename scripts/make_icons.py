"""Generates the Urge Walk PWA icons into public/ from the Light A icon (scripts/icon/light-a.svg).
Run: python3 scripts/make_icons.py   (needs rsvg-convert and Pillow)

Writes:
  apple-touch-icon.png  180, opaque (iOS shows transparency as black)
  pwa-192x192.png       192
  pwa-512x512.png       512
  pwa-maskable-512.png  512, opaque; the mark is re-centred and scaled to sit inside the
                        maskable safe zone (circle of radius 40% of the size)
  favicon.svg           the source SVG
  favicon-64.png, favicon-32.png, favicon.ico (16/32/48)
"""
import io, math, os, re, shutil, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "icon", "light-a.svg")
OUT = os.path.join(HERE, "..", "public")
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


full = {s: opaque(render(SVG, s)) for s in (16, 32, 48, 64, 180, 192, 512)}
save(full[180], "apple-touch-icon.png")
save(full[192], "pwa-192x192.png")
save(full[512], "pwa-512x512.png")
save(full[64], "favicon-64.png")
save(full[32], "favicon-32.png")
full[48].save(os.path.join(OUT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[full[16], full[32]])
print("wrote favicon.ico")
shutil.copyfile(SRC, os.path.join(OUT, "favicon.svg")); print("wrote favicon.svg")

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
save(masked, "pwa-maskable-512.png")
print(f"maskable: mark scale {k:.3f}, farthest point {far * k / 1024:.3f} of size from centre (limit 0.400)")
