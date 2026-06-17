import { X } from 'lucide-react';
import { C } from '../lib/theme.js';

// Help / FAQ / About — a self-contained screen opened from the footer (and the
// landing page), so new visitors understand what the app is, where prices come
// from, and how to reach support. No routing needed on this static site.
//
// The support address is a PLACEHOLDER until launch (search the repo for "[[").
const SUPPORT_EMAIL = '[[deine@email.de]]';

const Q = ({ q, children }) => (
  <section style={{ marginBottom: 18 }}>
    <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px', color: C.text }}>{q}</h3>
    <div style={{ fontSize: 12.5, color: C.textSoft, lineHeight: 1.65 }}>{children}</div>
  </section>
);

export default function FaqModal({ onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(8px)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24, position: 'relative' }}>
        <button onClick={onClose} aria-label="Schließen" style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Hilfe & FAQ</div>
        <div style={{ fontSize: 12.5, color: C.textFaint, marginBottom: 18 }}>Alles Wichtige in Kürze – und wie du uns erreichst.</div>

        <Q q="Was ist Cartograph?">
          Ein <strong>Live-Preistracker für Sammelkarten</strong> (Pokémon, Magic, One Piece,
          Yu-Gi-Oh!) mit Fokus auf den europäischen Markt (Cardmarket EU). Du kannst
          Karten suchen, Preisentwicklungen und Charts ansehen, eine Watchlist führen,
          deine Sammlung samt Wert verwalten und Preis-Alarme setzen.
        </Q>

        <Q q="Woher kommen die Preise?">
          Für <strong>Pokémon</strong> und <strong>Magic</strong> sind es echte
          Cardmarket-EU-Marktdaten (über pokemontcg.io bzw. Scryfall), täglich
          aktualisiert. Für <strong>Yu-Gi-Oh!</strong> und <strong>One Piece</strong> sind
          die Preise – wo keine Live-Daten vorliegen – <strong>transparente Schätzungen</strong>
          (basierend auf Rarität/Alter); der echte Tagespreis steht je Karte direkt auf
          Cardmarket und ist verlinkt. Schätzungen sind als solche gekennzeichnet.
        </Q>

        <Q q="Was bedeutet der Investment-Score?">
          Eine berechnete Heuristik (0–100) aus Preisniveau, Trend, Marge und Beliebtheit –
          als schnelle Orientierung gedacht, <strong>keine garantierte Prognose und keine
          Anlageberatung</strong>. TCG-Investments sind volatil; investiere nur, was du
          entbehren kannst.
        </Q>

        <Q q="Ist die Seite offiziell?">
          Nein. Cartograph ist ein <strong>inoffizielles Fan-Projekt</strong>. Alle Marken,
          Namen, Logos und Kartenbilder gehören ihren jeweiligen Rechteinhabern
          (z. B. Nintendo/TPCi, Konami, Bandai, Wizards of the Coast/Hasbro).
        </Q>

        <Q q="Kostet das etwas?">
          Die Nutzung ist kostenlos. Optionale Pro-Funktionen können später dazukommen –
          falls aktiv, sind sie klar gekennzeichnet.
        </Q>

        <Q q="Werden meine Daten gespeichert?">
          Standardmäßig bleibt alles <strong>lokal in deinem Browser</strong> (Sammlung,
          Watchlist, Einstellungen). Ein Konto mit geräteübergreifender Synchronisierung
          ist optional. Details in der Datenschutzerklärung (Footer).
        </Q>

        <Q q="Support & Kontakt">
          Fragen, Fehler oder Feedback? Schreib uns an{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.gold }}>{SUPPORT_EMAIL}</a>.
          Rechtliche Angaben findest du im Impressum (Footer).
        </Q>
      </div>
    </div>
  );
}
