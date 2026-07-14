# KM1 Training – Website-Redesign

Kompletter Neuentwurf für **km1-training.de** als eine einzige, in sich geschlossene
`index.html` – keine externen Abhängigkeiten, keine Frameworks, Schriften sind
eingebettet. Die Datei kann direkt bei jedem Hoster (oder im bestehenden
WordPress als Theme-Basis) verwendet werden.

## Vor dem Livegang anpassen

Alle Stellen sind im Code mit `TODO:` markiert:

1. **Original-Logodatei** – die Seite zeigt eine SVG-Wortmarke nach Vorlage
   des KM1-Logos (KM1 · Spieler-Piktogramm · TRAINING). Für das pixelgenaue
   Original einfach die Logodatei als `logo.png` neben die `index.html`
   legen – sie ersetzt die Wortmarke automatisch in Header, Footer und als
   Browser-Icon (getestet).
2. **Trainer-Foto** – als Datei `trainer.jpg` neben die `index.html` legen,
   es erscheint automatisch im Porträt-Rahmen des Vision-Abschnitts
   (bis dahin zeigt der Rahmen ein KM1-Monogramm).
3. **Partner-Logos** – die Partner-Leiste unter dem Hero zeigt aktuell
   Text-Wortmarken (Puma, 3H). Offizielle Logo-Dateien einsetzen und
   weitere Partner ergänzen.
4. **E-Mail-Adresse** – im Kontaktbereich und im Skript unten
   (`EMPFAENGER = "info@km1-training.de"`) die tatsächliche Adresse eintragen.
5. **Impressum & Datenschutz** – die beiden Footer-Links auf die echten
   Pflichtseiten zeigen lassen (aktuell Platzhalter `#`).
6. **Standort/Trainingsort** – bewusst noch nicht genannt; bei Bedarf im
   Vision- oder FAQ-Abschnitt ergänzen.

## Was drinsteckt

- **Design:** Monochrom-Editorial nach der Marke – das KM1-Logo ist
  schwarz-weiß, die Seite auch: helles Papier, große schwarze Condensed-
  Typografie, schwarze Kontrastflächen (Hero-Panel, Athletik, Video-Stills,
  Footer) und Grün ausschließlich als Akzent (Marker-Unterstreichung,
  Buttons, Details). Automatischer Dunkelmodus mit sauber invertierten
  Kontrastflächen. Eingesetzte Fotos werden per CSS automatisch
  schwarz-weiß dargestellt – so bleibt jedes Bild markenkonform.
- **Typografie:** Barlow / Barlow Condensed + Signaturschrift
  (eingebettet, DSGVO-freundlich – kein Google-Fonts-Request).
- **Inhalte:** Programme (U6–U13, U8–U15, U17–U19, Profi), Partner-Leiste
  (Puma, 3H), 4-Schritte-Methode, Athletik, Camps & „Schlag den Coach“,
  Einblicke-Sektion mit echten YouTube-Videos, „Meine Vision“ mit den
  Original-Texten von K. Maouel inkl. Unterschrift und Trainer-Porträt,
  FAQ, Kontaktformular (öffnet fertige E-Mail, kein Server nötig), echte
  Social-Links (Instagram, TikTok, YouTube).
- **Technik:** responsiv (Desktop/Tablet/Mobil), mobile Navigation,
  Scroll-Animationen mit `prefers-reduced-motion`-Unterstützung,
  Tastatur-Fokus-Stile, semantisches HTML.
