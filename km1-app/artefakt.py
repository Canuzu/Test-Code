#!/usr/bin/env python3
"""Macht aus der Web-App die Fassung für die Vorschau auf claude.ai.

    python3 artefakt.py [zieldatei]

Die Web-App in app/ ist ein vollständiges HTML-Dokument: eigener Kopf,
Manifest, Service Worker. Die Artefakt-Vorschau bekommt Kopf und Körper von
der Plattform, deshalb fällt hier alles weg, was drumherum steht.
"""
import sys

QUELLE = 'app/index.html'
ZIEL = sys.argv[1] if len(sys.argv) > 1 else 'artefakt.html'

s = open(QUELLE, encoding='utf-8').read()

stil = s[s.index('<style>'):s.index('</style>') + len('</style>')]
koerper = s[s.index('<body>') + len('<body>'):s.index('<script>\n/* Legt die App ins Regal')]

schriften = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?family=Anton&family=Chivo:wght@400;500;700;900'
    '&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">'
)

open(ZIEL, 'w', encoding='utf-8').write(
    '<title>KM1 Training App</title>\n' + schriften + '\n' + stil + '\n' + koerper.strip() + '\n'
)
print('geschrieben:', ZIEL)
