"""Generate premium backgrounds for the RoyalCards pitch deck.

Light cream backgrounds (match the live site) + a deep-violet statement
background (the brand's dark theme) for high-impact slides.
"""
import os
import numpy as np
from PIL import Image

W, H = 2400, 1350
ASSETS = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS, exist_ok=True)

# Palette
CREAM = (250, 246, 239)      # #FAF6EF
GOLD = (201, 169, 97)        # #C9A961
GOLD_L = (228, 208, 162)
VIOLET = (91, 44, 145)        # #5B2C91
VIOLET_L = (124, 58, 237)
VIOLET_DEEP = (28, 17, 48)    # base for dark statement
WHITE = (255, 253, 248)


def grid():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    return xx, yy


def radial(xx, yy, cx, cy, radius, power=2.2):
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    f = np.clip(1.0 - d / radius, 0.0, 1.0)
    return f ** power


def make_light(path, glows, base=CREAM, vignette=0.05, grain=1.4):
    """Light bg: tint toward glow colors, very gentle warm edge falloff."""
    xx, yy = grid()
    img = np.zeros((H, W, 3), dtype=np.float64)
    img[:] = base
    for (cx, cy, radius, color, intensity, power) in glows:
        f = radial(xx, yy, cx, cy, radius, power)
        for i in range(3):
            img[:, :, i] += (color[i] - base[i]) * intensity * f
    # gentle warm vignette (toward a soft warm tone, not gray)
    cx, cy = W / 2.0, H / 2.0
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    dmax = np.sqrt(cx ** 2 + cy ** 2)
    v = 1.0 - vignette * (d / dmax) ** 2.0
    img *= v[:, :, None]
    if grain:
        img += np.random.normal(0.0, grain, (H, W, 3))
    img = np.clip(img, 0, 255).astype(np.uint8)
    Image.fromarray(img, "RGB").save(path, quality=95)
    return path


def make_dark(path, glows, base=VIOLET_DEEP, vignette=0.55, grain=2.4):
    xx, yy = grid()
    img = np.zeros((H, W, 3), dtype=np.float64)
    img[:] = base
    for (cx, cy, radius, color, intensity, power) in glows:
        f = radial(xx, yy, cx, cy, radius, power)
        for i in range(3):
            img[:, :, i] += color[i] * intensity * f
    cx, cy = W / 2.0, H / 2.0
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    dmax = np.sqrt(cx ** 2 + cy ** 2)
    v = 1.0 - vignette * (d / dmax) ** 2.0
    img *= v[:, :, None]
    if grain:
        img += np.random.normal(0.0, grain, (H, W, 3))
    img = np.clip(img, 0, 255).astype(np.uint8)
    Image.fromarray(img, "RGB").save(path, quality=95)
    return path


# COVER (cream) — soft warm glow, whisper of violet
make_light(
    os.path.join(ASSETS, "bg_cream_cover.png"),
    glows=[
        (W * 0.78, H * 0.30, W * 0.62, GOLD_L, 0.26, 2.2),    # warm gold on the right
        (W * 0.74, H * 0.34, W * 0.30, WHITE, 0.30, 2.4),     # soft highlight
        (W * 0.06, H * 0.10, W * 0.42, VIOLET_L, 0.05, 2.4),  # faint violet top-left
        (W * 0.10, H * 0.95, W * 0.40, GOLD, 0.05, 2.4),
    ],
    vignette=0.05,
)

# CONTENT (cream) — almost flat, faint warm corner
make_light(
    os.path.join(ASSETS, "bg_cream_content.png"),
    glows=[
        (W * 0.95, H * 0.04, W * 0.50, GOLD_L, 0.14, 2.4),
        (W * 0.03, H * 0.98, W * 0.42, VIOLET_L, 0.045, 2.6),
        (W * 0.50, H * 0.50, W * 0.65, WHITE, 0.06, 2.0),
    ],
    vignette=0.055,
)

# STATEMENT (deep violet) — royal dark theme for impact slides
make_dark(
    os.path.join(ASSETS, "bg_violet.png"),
    glows=[
        (W * 0.50, H * -0.04, W * 0.78, VIOLET_L, 0.34, 2.0),  # violet halo top
        (W * 0.50, H * 0.74, W * 0.55, GOLD, 0.26, 2.4),        # gold glow lower
        (W * 0.50, H * 0.82, W * 0.28, GOLD_L, 0.14, 2.6),
        (W * 0.92, H * 0.92, W * 0.34, VIOLET, 0.16, 2.2),
    ],
    base=VIOLET_DEEP,
    vignette=0.60,
)

print("backgrounds written:")
for f in sorted(os.listdir(ASSETS)):
    if f.startswith("bg_"):
        print(" -", f)
