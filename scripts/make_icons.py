"""Generates the Urge Walk app icons into public/.
Run: python3 scripts/make_icons.py  (needs Pillow)"""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
S = 1024  # draw big, then shrink for smooth edges
BG_TOP, BG_BOTTOM = (20, 33, 46), (11, 18, 26)
MINT = (125, 211, 192)

img = Image.new("RGB", (S, S))
d = ImageDraw.Draw(img)
for y in range(S):  # vertical gradient background
    t = y / S
    d.line([(0, y), (S, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOTTOM)))

# Rising sun: a filled half-circle sitting on a horizon line
HY = S*0.52  # horizon height
d.pieslice([S*0.30, HY-S*0.20, S*0.70, HY+S*0.20], 180, 360, fill=MINT)
d.rounded_rectangle([S*0.16, HY+S*0.035, S*0.84, HY+S*0.065], radius=S*0.015, fill=MINT)

# A winding path from the bottom edge toward the horizon (tapers as it gets far away)
def bez(p0, p1, p2, p3, t):
    return tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*e
                 for a, b, c, e in zip(p0, p1, p2, p3))
pts = [(S*0.42, S*1.02), (S*0.78, S*0.86), (S*0.30, S*0.74), (S*0.52, S*0.64)]
r0, r1 = S*0.06, S*0.012
steps = 600
for i in range(steps + 1):
    t = i / steps
    x, y = bez(*pts, t)
    r = r0 + (r1 - r0) * t
    d.ellipse([x-r, y-r, x+r, y+r], fill=MINT)

for name, size in [("pwa-192x192.png", 192), ("pwa-512x512.png", 512),
                   ("apple-touch-icon.png", 180), ("favicon-64.png", 64)]:
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name))
    print("wrote", name)
