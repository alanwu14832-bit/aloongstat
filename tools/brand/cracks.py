"""Run: python3 tools/brand/cracks.py web/public/cracks.png 1800 1200   (needs numpy and Pillow)

Cracked dry-ground texture like the 霸龍 brand artwork: irregular cells with wavy cracks of varying thickness,
plus short dead-end branches. Output: white lines on transparent (used as a CSS mask, tinted gold)."""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = int(sys.argv[2]), int(sys.argv[3])
out = sys.argv[1]
rng = random.Random(7); np.random.seed(7)
# seeds on a jittered grid: cells ~ 260px
cell = 260
seeds = []
for gy in range(-1, H // cell + 2):
    for gx in range(-1, W // cell + 2):
        seeds.append(((gx + 0.5 + rng.uniform(-0.42, 0.42)) * cell, (gy + 0.5 + rng.uniform(-0.42, 0.42)) * cell))
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
# domain warp: wavy, organic edges
def warp(a, b, k):
    return (26 * np.sin(b / 61 + 1.3 * k) + 13 * np.sin((a + b) / 33 + 2.1 * k) + 6 * np.sin(a / 14 + 0.7 * k) + 3 * np.sin(b / 7 + k))
wx = xx + warp(xx, yy, 1.0)
wy = yy + warp(yy, xx, 2.0)
d1 = np.full((H, W), 1e9, np.float32); d2 = np.full((H, W), 1e9, np.float32)
for sx, sy in seeds:
    d = np.sqrt((wx - sx) ** 2 + (wy - sy) ** 2)
    m = d < d1
    d2 = np.where(m, d1, np.minimum(d2, d))
    d1 = np.where(m, d, d1)
gap = d2 - d1
# thickness varies along the cracks
thick = 5.5 + 3.5 * np.sin(xx / 97 + 0.4) * np.cos(yy / 83 + 1.1) + 1.5 * np.sin((xx - yy) / 41)
mask = (gap < thick).astype(np.uint8) * 255
img = Image.fromarray(mask, 'L')
# dead-end branches off the cracks
draw = ImageDraw.Draw(img)
ys, xs = np.nonzero(mask[::7, ::7])
idx = list(range(len(xs))); rng.shuffle(idx)
for i in idx[: (W * H) // 26000]:
    x, y = xs[i] * 7, ys[i] * 7
    ang = rng.uniform(0, 2 * math.pi); width = rng.uniform(5, 9); steps = rng.randint(6, 16)
    for _ in range(steps):
        ang += rng.uniform(-0.55, 0.55)
        nx, ny = x + 9 * math.cos(ang), y + 9 * math.sin(ang)
        draw.line((x, y, nx, ny), fill=255, width=max(1, int(round(width))))
        draw.ellipse((nx - width / 2, ny - width / 2, nx + width / 2, ny + width / 2), fill=255)
        x, y = nx, ny; width *= 0.84
        if width < 1.2: break
img = img.filter(ImageFilter.GaussianBlur(0.9)).point(lambda v: 255 if v > 110 else int(v * 2.2))
rgba = Image.new('RGBA', (W, H), (255, 255, 255, 0)); rgba.putalpha(img)
rgba.save(out, optimize=True)
print('saved', out)
