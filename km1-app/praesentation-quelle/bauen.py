#!/usr/bin/env python3
"""Baut die Präsentation von KM1 Training.

    python3 bauen.py                  schreibt ../praesentation/index.html
    python3 bauen.py --eine-datei X   schreibt zusätzlich eine einzelne Datei X,
                                      in der Bilder und Schriften stecken

Die Präsentation liegt auf GitHub Pages neben der App
(<pages>/km1-app/praesentation/). Schriften, Symbol und die App für die
Folie „Live“ kommen deshalb aus dem Ordner darüber (../).
"""
import base64, json, os, re, sys

HIER = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(HIER, '..', 'praesentation')
APP = os.path.join(HIER, '..', 'app')


def lies(n):
    with open(os.path.join(HIER, n), encoding='utf-8') as f:
        return f.read()


ICONS = json.loads(lies('icons.json'))

ROLLEN = [  # Schlüssel der App, Name, Farbe, Symbol
    ('spieler', 'Spieler', '#FF9500', 'tabStart'),
    ('eltern', 'Eltern', '#34C759', 'familie'),
    ('trainer', 'Trainer', '#2FA8A0', 'team'),
    ('akademie', 'Akademie', '#C77DEB', 'akademie'),
    ('verein', 'Verein', '#7C9AB5', 'wappen'),
    ('profi', 'Profi', '#E0AE2A', 'stern'),
    ('scout', 'Scout', '#8B89F0', 'fernglas'),
    ('km1', 'KM1', '#EE4A40', 'schild'),
]


def raster():
    h = ['<span></span>'] + ['<span class="wk">WOCHE %d</span>' % (w + 1) for w in range(6)]
    for e in range(3):
        h.append('<span class="ez">EINHEIT %d</span>' % (e + 1))
        for w in range(6):
            art = 'frei' if w == 0 else 'pro'
            icon = 'check' if w == 0 else 'stern'
            h.append('<span class="punkt %s" data-w="%d" data-e="%d">{{ICON:%s}}</span>' % (art, w, e, icon))
    return ''.join(h)


def orbs():
    return '\n    '.join(
        '<button type="button" class="orb" data-i="%d" aria-label="%s zeigen"><span class="symbol" style="background:%s">{{ICON:%s}}</span><span>%s</span></button>'
        % (i, n, c, ic, n) for i, (k, n, c, ic) in enumerate(ROLLEN))


def livechips():
    return ''.join(
        '<button type="button" data-rolle="%s" aria-pressed="%s"><span class="symbol" style="background:%s">{{ICON:%s}}</span>%s</button>'
        % (k, 'true' if i == 0 else 'false', c, ic, n) for i, (k, n, c, ic) in enumerate(ROLLEN))


def catmull(pts, n=16):
    """Glatter Pfad durch alle Punkte, als kubische Bézier-Segmente."""
    d = 'M%.1f %.1f' % pts[0]
    for i in range(len(pts) - 1):
        p0 = pts[max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(len(pts) - 1, i + 2)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += ' C%.1f %.1f %.1f %.1f %.1f %.1f' % (c1 + c2 + p2)
    return d


def weg():
    pts = [(60, 400), (250, 318), (440, 372), (630, 262), (820, 330), (1010, 232), (1200, 312), (1390, 214), (1540, 262), (1630, 196)]
    d = catmull(pts)
    linie = 'stroke="rgba(242,245,241,.08)" stroke-width="3" fill="none"'
    feld = ('<g class="grund">'
            '<rect x="0" y="20" width="1680" height="520" rx="6" %s/>'
            '<path d="M840 20V540" %s/><circle cx="840" cy="280" r="92" %s/>'
            '<path d="M0 150H150V410H0M1680 150H1530V410H1680" %s/>'
            '<path id="weg-grund" d="%s" fill="none" stroke="rgba(242,245,241,.35)" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>'
            '</g>') % (linie, linie, linie, linie, d)
    pfad = '<path id="weg-pfad" d="%s" fill="none" stroke="#EE4A40" stroke-width="7" stroke-linecap="round"/>' % d
    ball = ('<g id="weg-ball"><circle r="17" fill="#F2F5F1"/>'
            '<path d="M0 -6.8l6.5 4.7-2.5 7.6H-4l-2.5-7.6z" fill="#0B1511"/>'
            '<path d="M0 -6.8V-16.5M6.5 -2.1l9.6-3.1M4 5.5l5.9 8.1M-4 5.5l-5.9 8.1M-6.5 -2.1l-9.6-3.1" stroke="#0B1511" stroke-width="2" fill="none"/></g>')
    svg = '<svg viewBox="0 0 1680 560" aria-hidden="true">%s%s%s</svg>' % (feld, pfad, ball)
    punkte = [
        (.03, 'erledigt', 'App im Browser'),
        (.135, 'erledigt', 'Handy-App für iPhone und Android'),
        (.235, 'erledigt', 'Server mit Regeln und 36 Tests'),
        (.335, 'erledigt', 'Pläne, Vergleich, Camp'),
        (.535, 'offen', 'Acht Videos drehen'),
        (.625, 'offen', 'Server einspielen, Store-Konten, Abo'),
        (.715, 'offen', 'Rechtstexte und Einwilligungen'),
        (.805, 'offen', 'Moderation und Prüfung organisieren'),
        (.895, 'offen', 'Rollen in der Handy-App'),
    ]
    h = [svg]
    n = 0
    for i, (f, art, text) in enumerate(punkte):
        seite = ' oben' if i % 2 else ''
        if art == 'erledigt':
            inner = '{{ICON:check}}'
        else:
            n += 1
            inner = str(n)
        h.append('<div class="wegpunkt %s%s" data-f="%s"><i>%s</i><span>%s</span></div>' % (art, seite, f, inner, text))
    h.append('<div class="wegpunkt ziel oben" data-f="1"><i>{{ICON:pokal}}</i><span><b>Anpfiff</b>Testphase aus, Start in den Stores</span></div>')
    h.append('<div class="heute" id="weg-heute">HEUTE</div>')
    return ''.join(h)


def qr():
    roh = open(os.path.join(HIER, 'qr-pfad.txt')).read().strip()
    n, d = roh.split('|', 1)
    return '<svg viewBox="0 0 %s %s" shape-rendering="crispEdges" aria-hidden="true"><path d="%s" fill="#0B1511"/></svg>' % (n, n, d)


def stile_zusammen(html):
    """Ein Tag darf nur ein style-Attribut haben: doppelte zusammenführen."""
    def tag(m):
        t = m.group(0)
        stile = re.findall(r'\sstyle="([^"]*)"', t)
        if len(stile) < 2:
            return t
        ohne = re.sub(r'\sstyle="[^"]*"', '', t)
        zus = ';'.join(s.strip().rstrip(';') for s in stile)
        return re.sub(r'^<(\w+)', lambda mm: '<%s style="%s"' % (mm.group(1), zus), ohne, count=1)
    return re.sub(r'<\w+\s[^<>]*>', tag, html)


def body():
    b = lies('body.html')
    b = b.replace('{{RASTER}}', raster()).replace('{{ORBS}}', orbs()).replace('{{WEG}}', weg())
    b = b.replace('{{LIVECHIPS}}', livechips()).replace('{{QR}}', qr())
    b = re.sub(r'\{\{ICON:(\w+)\}\}', lambda m: ICONS[m.group(1)], b)
    assert '{{' not in b, re.findall(r'\{\{[^}]*\}\}', b)
    return stile_zusammen(b)


SCHRIFTEN = [('Anton', '400', 'anton'), ('Inter', '100 900', 'inter'), ('JetBrains Mono', '100 800', 'jetbrains-mono')]
TITEL = '<title>KM1 Training · Präsentation</title>'


def schriften(url):
    return ''.join(
        "@font-face{font-family:'%s';font-weight:%s;font-display:block;src:url(%s) format('woff2')}" % (f, w, url(n))
        for f, w, n in SCHRIFTEN)


def seite(kopf, css, b, js):
    return ('<!doctype html>\n<html lang="de"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            + TITEL + '<meta name="description" content="Die App der KM1 Fußballschule, vorgestellt in 22 Folien.">'
            '<meta name="theme-color" content="#050907">' + kopf + '\n<style>\n' + css + '\n</style></head><body>\n'
            + b + '\n' + js + '</body></html>\n')


def daten(pfad, typ):
    with open(pfad, 'rb') as f:
        return 'data:%s;base64,%s' % (typ, base64.b64encode(f.read()).decode())


def main():
    css = lies('style.css')
    b = body()
    js = '<script>\n' + lies('szenen.js') + '\n</script>\n<script>\n' + lies('kern.js') + '\n</script>\n'
    # 1. Neben der App auf GitHub Pages
    kopf = ('<link rel="icon" href="../icons/favicon-32.png" sizes="32x32">'
            '<style>' + schriften(lambda n: '../fonts/%s-latin.woff2' % n) + '</style>'
            "<script>window.KM1_APP_URL='../index.html';</script>")
    html = seite(kopf, css, b, js)
    with open(os.path.join(ZIEL, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    print('praesentation/index.html', len(html.encode()), 'Bytes')
    # 2. Auf Wunsch eine einzige Datei, die ohne Netz aufgeht
    if '--eine-datei' in sys.argv:
        ziel = sys.argv[sys.argv.index('--eine-datei') + 1]
        bilder = {}
        for n in sorted(os.listdir(os.path.join(ZIEL, 'img'))):
            bilder[n[:-5]] = daten(os.path.join(ZIEL, 'img', n), 'image/webp')
        b2, css2 = b, css
        for name, url in bilder.items():
            b2 = b2.replace('img/%s.webp' % name, url)
            css2 = css2.replace('img/%s.webp' % name, url)
        kopf2 = ('<style>' + schriften(lambda n: daten(os.path.join(APP, 'fonts', n + '-latin.woff2'), 'font/woff2')) + '</style>'
                 '<script>window.KM1_OHNE_LIVE=true;window.KM1BILDER='
                 + json.dumps({k: v for k, v in bilder.items() if k.startswith('s-')}) + ';</script>')
        html2 = seite(kopf2, css2, b2, js)
        with open(ziel, 'w', encoding='utf-8') as f:
            f.write(html2)
        print(ziel, len(html2.encode()), 'Bytes')


if __name__ == '__main__':
    main()
