# KM1 Training – Website-Redesign

Kompletter Neuentwurf für **km1-training.de** als eine einzige, in sich geschlossene
`index.html` – keine externen Abhängigkeiten, keine Frameworks, Schriften sind
eingebettet. Die Datei kann direkt bei jedem Hoster (oder im bestehenden
WordPress als Theme-Basis) verwendet werden.

## Vor dem Livegang anpassen

Alle Stellen sind im Code mit `TODO:` markiert:

1. **E-Mail-Adresse** – im Kontaktbereich und im Skript unten
   (`EMPFAENGER = "info@km1-training.de"`) die tatsächliche Adresse eintragen.
2. **Impressum & Datenschutz** – die beiden Footer-Links auf die echten
   Pflichtseiten zeigen lassen (aktuell Platzhalter `#`).
3. **Über-KM1-Abschnitt** – Name und Foto des Inhabers ergänzen.
4. **Standort/Trainingsort** – bewusst noch nicht genannt; bei Bedarf im
   Über- oder FAQ-Abschnitt ergänzen.
5. **Fotos** – die Seite funktioniert komplett ohne Fotos; echte Trainings-
   fotos werten sie aber weiter auf (z. B. im Hero und im Über-Abschnitt).

## Was drinsteckt

- **Design:** Flutlicht-Look (dunkel) mit Rasengrün und Gold für die
  „Key Moments“, Kreidelinien-Grafiken als rote Faden. Automatischer heller
  Modus („Auswärtstrikot“) je nach Systemeinstellung.
- **Typografie:** Barlow / Barlow Condensed (eingebettet, DSGVO-freundlich –
  kein Google-Fonts-Request).
- **Inhalte:** Programme (U6–U13, U8–U15, U17–U19, Profi), 4-Schritte-Methode,
  Athletik, Camps & „Schlag den Coach“, Über KM1, FAQ, Kontaktformular
  (öffnet fertige E-Mail, kein Server nötig), echte Social-Links
  (Instagram, TikTok, YouTube).
- **Technik:** responsiv (Desktop/Tablet/Mobil), mobile Navigation,
  Scroll-Animationen mit `prefers-reduced-motion`-Unterstützung,
  Tastatur-Fokus-Stile, semantisches HTML.
