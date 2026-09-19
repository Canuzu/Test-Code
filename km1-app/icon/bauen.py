#!/usr/bin/env python3
"""Baut die App-Symbole aus dem bestehenden KM1-Logo.

    python3 bauen.py ../prototyp/img/logo.png

Der Weg in drei Schritten:
1. Die Spielerfigur aus dem Logo herausloesen. Sie ist der groesste
   zusammenhaengende dunkle Fleck, die Buchstaben sind kleiner.
2. Kanten glaetten. Die Vorlage ist nur 142 Pixel breit; hochskaliert
   waere sie eine Treppe. Weichzeichnen und schwellen macht daraus eine
   saubere Kurve.
3. Drei Grundflaechen bauen und die Figur daraufsetzen.

Ergebnis: drei PNG mit 1024 x 1024 Pixeln, ohne durchsichtige Flaechen
und ohne runde Ecken, genau wie App Store und Play Store es verlangen.
"""
import sys
from collections import deque
from PIL import Image, ImageFilter, ImageDraw

S = 1024
HOEHE = .70          # Hoehe der Figur im Verhaeltnis zur Kantenlaenge


def silhouette(pfad):
    """Groesste zusammenhaengende Form aus dem Logo, mit glatten Kanten."""
    im = Image.open(pfad).convert('RGBA')
    w, h = im.size
    px = im.load()

    def ink(x, y):
        r, g, b, a = px[x, y]
        return a >= 40 and (r + g + b) / 3 < 128

    gesehen = [[False] * h for _ in range(w)]
    groesste = None
    for x in range(w):
        for y in range(h):
            if ink(x, y) and not gesehen[x][y]:
                q = deque([(x, y)]); gesehen[x][y] = True; pts = []
                x0 = x1 = x; y0 = y1 = y
                while q:
                    cx, cy = q.popleft(); pts.append((cx, cy))
                    x0 = min(x0, cx); x1 = max(x1, cx)
                    y0 = min(y0, cy); y1 = max(y1, cy)
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < w and 0 <= ny < h and not gesehen[nx][ny] and ink(nx, ny):
                                gesehen[nx][ny] = True; q.append((nx, ny))
                if groesste is None or len(pts) > len(groesste[0]):
                    groesste = (pts, x0, y0, x1, y1)

    pts, x0, y0, x1, y1 = groesste
    roh = Image.new('L', (x1 - x0 + 1, y1 - y0 + 1), 0)
    rp = roh.load()
    for cx, cy in pts:
        rp[cx - x0, cy - y0] = 255

    gross = roh.resize((roh.width * 10, roh.height * 10), Image.LANCZOS)
    gross = gross.filter(ImageFilter.GaussianBlur(9))
    gross = gross.point(lambda v: 255 if v > 132 else 0)
    return gross.filter(ImageFilter.GaussianBlur(2))


def radial(groesse, innen, aussen, cx=.42, cy=.34, r=.95):
    s = 128; g = Image.new('RGB', (s, s)); gp = g.load()
    for y in range(s):
        for x in range(s):
            dx = x / s - cx; dy = y / s - cy
            d = min(1.0, ((dx * dx + dy * dy) ** .5) / r)
            t = d * d * (3 - 2 * d)
            gp[x, y] = tuple(int(innen[i] + (aussen[i] - innen[i]) * t) for i in range(3))
    return g.resize((groesse, groesse), Image.LANCZOS)


def diagonal(groesse, a, b):
    s = 128; g = Image.new('RGB', (s, s)); gp = g.load()
    for y in range(s):
        for x in range(s):
            t = (x / s) * .5 + (y / s) * .5; t = t * t * (3 - 2 * t)
            gp[x, y] = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
    return g.resize((groesse, groesse), Image.LANCZOS)


def schein(g, cx, cy, r, farbe, staerke):
    s = 128; m = Image.new('L', (s, s)); mp = m.load()
    for y in range(s):
        for x in range(s):
            dx = x / s - cx; dy = y / s - cy
            d = min(1.0, ((dx * dx + dy * dy) ** .5) / r)
            mp[x, y] = int(staerke * (1 - (d * d * (3 - 2 * d))))
    m = m.resize(g.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(24))
    g.paste(Image.new('RGB', g.size, farbe), (0, 0), m)
    return g


def vignette(g, staerke=34):
    s = 128; v = Image.new('L', (s, s)); vp = v.load()
    for y in range(s):
        for x in range(s):
            dx = x / s - .5; dy = y / s - .5
            d = min(1.0, ((dx * dx + dy * dy) ** .5) / .74)
            vp[x, y] = int(staerke * (d * d * (3 - 2 * d)))
    g.paste(Image.new('RGB', g.size, (0, 0, 0)), (0, 0), v.resize(g.size, Image.LANCZOS))
    return g


def platziere(g, figur, farbe, schatten=0, versatz=18, weich=30):
    h = int(S * HOEHE); w = int(figur.width * h / figur.height)
    m = figur.resize((w, h), Image.LANCZOS)
    x = int(S * .5 - w / 2); y = int(S * .5 - h / 2)
    if schatten:
        sh = Image.new('L', g.size, 0)
        sh.paste(m, (x, y + versatz), m)
        sh = sh.filter(ImageFilter.GaussianBlur(weich)).point(lambda v: int(v * schatten / 255))
        g.paste(Image.new('RGB', g.size, (0, 0, 0)), (0, 0), sh)
    g.paste(farbe, (x, y), m)
    return g


def main(logo='../prototyp/img/logo.png'):
    figur = silhouette(logo)
    figur.save('spieler-glatt.png')

    a = radial(S, (26, 45, 37), (4, 10, 8), cx=.34, cy=.24, r=1.05)
    a = schein(a, .22, .14, .85, (226, 240, 232), 30)
    a = platziere(a, figur, (244, 247, 243), 120)
    vignette(a, 44).save('a-flutlicht-1024.png')

    b = diagonal(S, (219, 42, 30), (146, 16, 10))
    b = schein(b, .26, .18, .8, (255, 255, 255), 26)
    b = platziere(b, figur, (255, 255, 255), 70, 16, 26)
    vignette(b, 30).save('b-koeln-1024.png')

    c = radial(S, (252, 253, 251), (224, 232, 222), cx=.36, cy=.26, r=1.08)
    c = platziere(c, figur, (200, 30, 20), 34, 14, 26)
    vignette(c, 14).save('c-kreide-1024.png')

    print('Drei Symbole gebaut, je 1024 x 1024.')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '../prototyp/img/logo.png')
