#!/usr/bin/env python3
"""Post-process generated Velora Saga assets:
- creatures: key out the bright-magenta backdrop -> transparent alpha, autocrop,
  downscale (NEAREST, pixel-art) to a 128x128 transparent canvas
- battle backgrounds: cover-crop + resize to the 480x320 game viewport
- ground tiles: resize to 64x64 (kept seamless) for world-anchored pattern fills

Run: python3 scripts/process_assets.py  (overwrites the files in place)
"""
import os, glob
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
CRE = os.path.join(ROOT, "assets", "creatures")
BG  = os.path.join(ROOT, "assets", "bg")
TIL = os.path.join(ROOT, "assets", "tiles")

def is_key(r, g, b):
    # bright magenta backdrop: high R, low G, high B
    return r > 175 and g < 95 and b > 175

def process_creature(path, box=128):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_key(r, g, b):
                px[x, y] = (0, 0, 0, 0)
            else:
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    if maxx <= minx or maxy <= miny:
        minx, miny, maxx, maxy = 0, 0, w - 1, h - 1
    # small padding
    pad = 8
    minx = max(0, minx - pad); miny = max(0, miny - pad)
    maxx = min(w - 1, maxx + pad); maxy = min(h - 1, maxy + pad)
    crop = im.crop((minx, miny, maxx + 1, maxy + 1))
    cw, ch = crop.size
    scale = box / max(cw, ch)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    crop = crop.resize((nw, nh), Image.NEAREST)
    canvas = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    canvas.paste(crop, ((box - nw) // 2, (box - nh) // 2), crop)
    canvas.save(path)
    return canvas.size

def cover_resize(im, tw, th):
    w, h = im.size
    scale = max(tw / w, th / h)
    nw, nh = round(w * scale), round(h * scale)
    im = im.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2; top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))

def process_bg(path, tw=480, th=320):
    im = Image.open(path).convert("RGB")
    cover_resize(im, tw, th).save(path)

def process_tile(path, sz=64):
    im = Image.open(path).convert("RGB")
    im.resize((sz, sz), Image.LANCZOS).save(path)

if __name__ == "__main__":
    for p in sorted(glob.glob(os.path.join(CRE, "*.png"))):
        sz = process_creature(p)
        print("creature", os.path.basename(p), sz)
    for p in sorted(glob.glob(os.path.join(BG, "*.png"))):
        process_bg(p); print("bg", os.path.basename(p))
    for p in sorted(glob.glob(os.path.join(TIL, "*.png"))):
        process_tile(p); print("tile", os.path.basename(p))
    print("done")
