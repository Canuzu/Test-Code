#!/usr/bin/env python3
"""Macht aus der Web-App die Fassung für die Vorschau auf claude.ai.

    python3 artefakt.py [zieldatei]          die Hauptfassung aus app/
    python3 artefakt.py apple [zieldatei]    die Designstudie aus apple/

Die Web-App ist ein vollständiges HTML-Dokument: eigener Kopf, Manifest,
Service Worker. Die Artefakt-Vorschau bekommt Kopf und Körper von der
Plattform, deshalb fällt hier alles weg, was drumherum steht.

Die Schriften stehen als @font-face im Stil und zeigen auf fonts/. Beim
Veröffentlichen gehen die Dateien aus fonts/ deshalb als Beiwerk mit, genau
wie die Bilder aus img/ — jeweils aus dem Ordner der Fassung.
"""
import sys

# In der Vorschau polstert die Plattform oben und unten die sicheren
# Ränder des Telefons schon selbst. Die Designstudie rechnet sie sonst ein
# zweites Mal ein und wäre mit 100dvh um genau diese Ränder zu hoch.
ZUSATZ_APPLE = (
    '<style>\n'
    '/* Nur in der Vorschau auf claude.ai: die Ränder polstert die Seite. */\n'
    'body{height:100%}\n'
    ':root{--oben:0px;--unten:0px}\n'
    '</style>\n'
)

FASSUNGEN = {
    'app':   ('app/index.html',   'artefakt.html',       'KM1 Training App', ''),
    'apple': ('apple/index.html', 'artefakt-apple.html', 'KM1 Apple-Stil',   ZUSATZ_APPLE),
}

argumente = sys.argv[1:]
fassung = argumente.pop(0) if argumente and argumente[0] in FASSUNGEN else 'app'
QUELLE, ZIEL, TITEL, ZUSATZ = FASSUNGEN[fassung]
if argumente:
    ZIEL = argumente[0]

s = open(QUELLE, encoding='utf-8').read()

stil = s[s.index('<style>'):s.index('</style>') + len('</style>')]
# Der Körper endet vor dem Service Worker. Die Designstudie hat keinen,
# dort endet er mit </body>.
anfang = s.index('<body>') + len('<body>')
sw = s.find('<script>\n/* Legt die App ins Regal')
koerper = s[anfang:sw if sw >= 0 else s.index('</body>')]

open(ZIEL, 'w', encoding='utf-8').write(
    '<title>' + TITEL + '</title>\n' + stil + '\n' + ZUSATZ + koerper.strip() + '\n'
)
print('geschrieben:', ZIEL)
