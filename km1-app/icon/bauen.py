#!/usr/bin/env python3
"""Baut das App-Symbol und die Markenbilder aus dem bestehenden KM1-Logo.

    python3 bauen.py                 # das gewaehlte Symbol und alles drumherum
    python3 bauen.py --entwuerfe     # zusaetzlich die drei Entwuerfe von der Auswahl

Gewaehlt ist: heller Grund, Figur in Schwarz. Das ist das gedruckte Logo
als Symbol. Dazu ein zweites Symbol fuer Abonnenten: die Flutlichtnacht
der Marke, Figur in Weiss. Beide liegen in der App, umgeschaltet wird zur
Laufzeit.

Der Weg in drei Schritten:
1. Die Spielerfigur aus dem Logo herausloesen. Sie ist der groesste
   zusammenhaengende dunkle Fleck, die Buchstaben sind kleiner.
2. Kanten glaetten. Die Vorlage ist nur 142 Pixel breit; hochskaliert
   waere sie eine Treppe. Weichzeichnen und schwellen macht daraus eine
   saubere Kurve.
3. Grundflaeche bauen, Figur daraufsetzen, Ableitungen rechnen.
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

S = 1024
HOEHE = .70                  # Hoehe der Figur im Verhaeltnis zur Kantenlaenge
HOEHE_ADAPTIV = .48          # Android schneidet aussen weg, also kleiner
SCHWARZ = (10, 20, 17)
ROT = (200, 30, 20)
WEISS = (255, 255, 255)
GRUND_INNEN = (252, 253, 251)
GRUND_AUSSEN = (224, 232, 222)
NACHT_INNEN = (26, 45, 37)
NACHT_AUSSEN = (4, 10, 8)
HELL = (244, 247, 243)


# ---------------------------------------------------------------- Grundlagen

def _teile(pfad):
    """Alle zusammenhaengenden dunklen Formen des Logos, groesste zuerst."""
    im = Image.open(pfad).convert('RGBA')
    w, h = im.size
    px = im.load()

    def ink(x, y):
        r, g, b, a = px[x, y]
        return a >= 40 and (r + g + b) / 3 < 128

    gesehen = [[False] * h for _ in range(w)]
    gefunden = []
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
                gefunden.append((pts, x0, y0, x1, y1))
    gefunden.sort(key=lambda t: len(t[0]), reverse=True)
    return gefunden, im


def silhouette(pfad):
    """Die Spielerfigur als Maske, mit geglaetteten Kanten."""
    gefunden, _ = _teile(pfad)
    pts, x0, y0, x1, y1 = gefunden[0]
    roh = Image.new('L', (x1 - x0 + 1, y1 - y0 + 1), 0)
    rp = roh.load()
    for cx, cy in pts:
        rp[cx - x0, cy - y0] = 255
    gross = roh.resize((roh.width * 10, roh.height * 10), Image.LANCZOS)
    gross = gross.filter(ImageFilter.GaussianBlur(9))
    gross = gross.point(lambda v: 255 if v > 132 else 0)
    return gross.filter(ImageFilter.GaussianBlur(2))


def wortmarke(pfad, faktor=3):
    """Das ganze Logo als Maske: Weiss wird durchsichtig gerechnet."""
    im = Image.open(pfad).convert('RGBA')
    w, h = im.size
    px = im.load()
    m = Image.new('L', (w, h), 0)
    mp = m.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            lum = (r + g + b) / 3
            mp[x, y] = int((255 - lum) * (a / 255))
    return m.resize((w * faktor, h * faktor), Image.LANCZOS)


# ---------------------------------------------------------------- Flaechen

def radial(groesse, innen, aussen, cx=.36, cy=.26, r=1.08):
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


def vignette(g, staerke=14):
    s = 128; v = Image.new('L', (s, s)); vp = v.load()
    for y in range(s):
        for x in range(s):
            dx = x / s - .5; dy = y / s - .5
            d = min(1.0, ((dx * dx + dy * dy) ** .5) / .74)
            vp[x, y] = int(staerke * (d * d * (3 - 2 * d)))
    g.paste(Image.new('RGB', g.size, (0, 0, 0)), (0, 0), v.resize(g.size, Image.LANCZOS))
    return g


def platziere(g, figur, farbe, hoehe=HOEHE, schatten=0, versatz=14, weich=26):
    kante = g.size[0]
    h = int(kante * hoehe); w = int(figur.width * h / figur.height)
    m = figur.resize((w, h), Image.LANCZOS)
    x = int(kante * .5 - w / 2); y = int(kante * .5 - h / 2)
    if schatten:
        sh = Image.new('L', g.size, 0)
        sh.paste(m, (x, y + versatz), m)
        sh = sh.filter(ImageFilter.GaussianBlur(weich)).point(lambda v: int(v * schatten / 255))
        g.paste(Image.new('RGB', g.size, (0, 0, 0)), (0, 0), sh)
    g.paste(farbe, (x, y), m)
    return g


# ---------------------------------------------------------------- Das Paket

def grundflaeche(groesse=S):
    return radial(groesse, GRUND_INNEN, GRUND_AUSSEN)


def nachtflaeche(groesse=S):
    g = radial(groesse, NACHT_INNEN, NACHT_AUSSEN, cx=.34, cy=.24, r=1.05)
    return schein(g, .22, .14, .85, (226, 240, 232), 30)


def paket(logo):
    figur = silhouette(logo)
    figur.save('spieler-glatt.png')

    # 1. Das Symbol selbst. Ohne Transparenz, ohne runde Ecken.
    sym = platziere(grundflaeche(), figur, SCHWARZ, schatten=34)
    sym = vignette(sym, 14)
    sym.save('km1-symbol-1024.png')
    sym.resize((512, 512), Image.LANCZOS).save('km1-symbol-512.png')
    sym.resize((48, 48), Image.LANCZOS).save('km1-symbol-48.png')

    # 2. Android, adaptiv: zwei Schichten. Die Figur bleibt in der Mitte,
    #    weil das System aussen wegschneidet.
    grundflaeche().save('android-hintergrund-1024.png')
    vorder = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    h = int(S * HOEHE_ADAPTIV); w = int(figur.width * h / figur.height)
    m = figur.resize((w, h), Image.LANCZOS)
    vorder.paste(Image.new('RGBA', (w, h), SCHWARZ + (255,)),
                 (int(S * .5 - w / 2), int(S * .5 - h / 2)), m)
    vorder.save('android-vordergrund-1024.png')

    # 3. Mitteilungen auf Android: einfarbig weiss auf durchsichtig.
    mit = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
    h = int(96 * .82); w = int(figur.width * h / figur.height)
    m = figur.resize((w, h), Image.LANCZOS)
    mit.paste(Image.new('RGBA', (w, h), WEISS + (255,)),
              (int(48 - w / 2), int(48 - h / 2)), m)
    mit.save('android-mitteilung-96.png')

    # 3b. Das zweite Symbol, nur fuer Abonnenten: die Flutlichtnacht.
    pro = platziere(nachtflaeche(), figur, HELL, schatten=120, versatz=18, weich=30)
    pro = vignette(pro, 44)
    pro.save('km1-symbol-pro-1024.png')
    pro.resize((512, 512), Image.LANCZOS).save('km1-symbol-pro-512.png')

    nachtflaeche().save('android-hintergrund-pro-1024.png')
    vorder_pro = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    h = int(S * HOEHE_ADAPTIV); w = int(figur.width * h / figur.height)
    m = figur.resize((w, h), Image.LANCZOS)
    vorder_pro.paste(Image.new('RGBA', (w, h), HELL + (255,)),
                     (int(S * .5 - w / 2), int(S * .5 - h / 2)), m)
    vorder_pro.save('android-vordergrund-pro-1024.png')

    # 4. Die Wortmarke freigestellt, schwarz und weiss.
    wm = wortmarke(logo)
    fuer_hell = Image.new('RGBA', wm.size, (0, 0, 0, 0))
    fuer_hell.paste(Image.new('RGBA', wm.size, SCHWARZ + (255,)), (0, 0), wm)
    fuer_hell.save('wortmarke-schwarz.png')
    fuer_dunkel = Image.new('RGBA', wm.size, (0, 0, 0, 0))
    fuer_dunkel.paste(Image.new('RGBA', wm.size, (242, 245, 241, 255)), (0, 0), wm)
    fuer_dunkel.save('wortmarke-weiss.png')

    # 5. Startbildschirm beim Oeffnen: Wortmarke ruhig auf dem Markengrund.
    for name, (bw, bh), grund, farbe in [
        ('startbildschirm-hell-1242x2688.png', (1242, 2688), GRUND_INNEN, SCHWARZ),
        ('startbildschirm-dunkel-1242x2688.png', (1242, 2688), (6, 12, 10), (242, 245, 241)),
    ]:
        sb = Image.new('RGB', (bw, bh), grund)
        breite = int(bw * .62); hoehe = int(wm.height * breite / wm.width)
        mm = wm.resize((breite, hoehe), Image.LANCZOS)
        sb.paste(farbe, (int(bw / 2 - breite / 2), int(bh / 2 - hoehe / 2)), mm)
        sb.save(name)

    print('Paket gebaut: zwei Symbole, Android-Schichten, Mitteilung,')
    print('Wortmarken und Startbildschirm.')


def entwuerfe(logo):
    """Die Entwuerfe, ueber die entschieden wurde. A ist inzwischen das
    PRO-Symbol, siehe paket()."""
    figur = silhouette(logo)
    b = diagonal(S, (219, 42, 30), (146, 16, 10))
    b = schein(b, .26, .18, .8, WEISS, 26)
    vignette(platziere(b, figur, WEISS, schatten=70, versatz=16, weich=26), 30).save('entwurf-b-koeln-1024.png')

    c = platziere(grundflaeche(), figur, ROT, schatten=34)
    vignette(c, 14).save('entwurf-c-kreide-rot-1024.png')
    print('Entwuerfe gebaut.')


if __name__ == '__main__':
    logo = '../prototyp/img/logo.png'
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if args:
        logo = args[0]
    paket(logo)
    if '--entwuerfe' in sys.argv:
        entwuerfe(logo)
