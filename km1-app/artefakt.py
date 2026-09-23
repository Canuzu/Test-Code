#!/usr/bin/env python3
"""Macht aus der Web-App die Fassung für die Vorschau auf claude.ai.

    python3 artefakt.py [zieldatei]

Die Web-App in app/ ist ein vollständiges HTML-Dokument: eigener Kopf,
Manifest, Service Worker. Die Artefakt-Vorschau bekommt Kopf und Körper von
der Plattform, deshalb fällt hier alles weg, was drumherum steht.

Die Schriften stehen als @font-face im Stil und zeigen auf fonts/. Beim
Veröffentlichen gehen die Dateien aus app/fonts/ deshalb als Beiwerk mit,
genau wie die Bilder aus app/img/.
"""
import sys

QUELLE = 'app/index.html'
ZIEL = sys.argv[1] if len(sys.argv) > 1 else 'artefakt.html'

s = open(QUELLE, encoding='utf-8').read()

stil = s[s.index('<style>'):s.index('</style>') + len('</style>')]
koerper = s[s.index('<body>') + len('<body>'):s.index('<script>\n/* Legt die App ins Regal')]

open(ZIEL, 'w', encoding='utf-8').write(
    '<title>KM1 Training App</title>\n' + stil + '\n' + koerper.strip() + '\n'
)
print('geschrieben:', ZIEL)
