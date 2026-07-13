# KM1 Training – Website-Redesign

Kompletter Neuentwurf für **km1-training.de** als eine einzige, in sich geschlossene
`index.html` – keine externen Abhängigkeiten, keine Frameworks, Schriften sind
eingebettet. Die Datei kann direkt bei jedem Hoster (oder im bestehenden
WordPress als Theme-Basis) verwendet werden.

## Vor dem Livegang anpassen

Alle Stellen sind im Code mit `TODO:` markiert:

1. **Marken-Logo** – das offizielle KM1-Logo als Datei `logo.png` neben die
   `index.html` legen. Es erscheint dann automatisch im Seitenkopf, im Footer
   und als Browser-Icon (getestet). Bis dahin zeigt die Seite eine neutrale
   KM1-Wortmarke – das eingetragene Markenzeichen wurde bewusst nicht
   nachgebaut.
2. **Trainer-Foto** – einfach als Datei `trainer.jpg` neben die `index.html`
   legen, es erscheint automatisch im Porträt-Rahmen des Über-Abschnitts
   (bis dahin zeigt der Rahmen ein KM1-Monogramm).
3. **Partner-Logos** – die Partner-Leiste unter dem Hero zeigt aktuell
   Text-Wortmarken (Puma, 3H). Offizielle Logo-Dateien einsetzen und
   weitere Partner ergänzen.
4. **E-Mail-Adresse** – im Kontaktbereich und im Skript unten
   (`EMPFAENGER = "info@km1-training.de"`) die tatsächliche Adresse eintragen.
5. **Impressum & Datenschutz** – die beiden Footer-Links auf die echten
   Pflichtseiten zeigen lassen (aktuell Platzhalter `#`).
6. **Name des Inhabers** – im Über-KM1-Abschnitt ergänzen.
7. **Standort/Trainingsort** – bewusst noch nicht genannt; bei Bedarf im
   Über- oder FAQ-Abschnitt ergänzen.

## Was drinsteckt

- **Design:** Flutlicht-Look (dunkel) mit Rasengrün und Gold für die
  „Key Moments“, Kreidelinien-Grafiken als rote Faden. Automatischer heller
  Modus („Auswärtstrikot“) je nach Systemeinstellung.
- **Typografie:** Barlow / Barlow Condensed (eingebettet, DSGVO-freundlich –
  kein Google-Fonts-Request).
- **Inhalte:** Programme (U6–U13, U8–U15, U17–U19, Profi), Partner-Leiste
  (Puma, 3H), 4-Schritte-Methode, Athletik, Camps & „Schlag den Coach“,
  Einblicke-Sektion mit echten YouTube-Videos, Über KM1 mit Trainer-Porträt,
  FAQ, Kontaktformular (öffnet fertige E-Mail, kein Server nötig), echte
  Social-Links (Instagram, TikTok, YouTube).
- **Technik:** responsiv (Desktop/Tablet/Mobil), mobile Navigation,
  Scroll-Animationen mit `prefers-reduced-motion`-Unterstützung,
  Tastatur-Fokus-Stile, semantisches HTML.
