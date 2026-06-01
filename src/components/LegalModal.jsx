import { X } from 'lucide-react';
import { C } from '../lib/theme.js';

// Legal / info modal: Impressum (§5 DDG), Datenschutz (DSGVO) and a trademark
// disclaimer. The Impressum fields are PLACEHOLDERS — the operator must fill in
// their real name + address before going public (a German site legally requires
// a reachable Impressum). Kept as one self-contained screen, opened from the
// footer, so no routing is needed on this static site.
//
// Placeholders to replace before launch are wrapped in [[ ]] so they're easy to
// find (search the repo for "[[").
const OPERATOR = {
  name: '[[Dein Name]]',
  street: '[[Straße & Hausnummer]]',
  city: '[[PLZ Ort]]',
  email: '[[deine@email.de]]',
};

const Section = ({ title, children }) => (
  <section style={{ marginBottom: 22 }}>
    <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 8px', color: C.text }}>{title}</h3>
    <div style={{ fontSize: 12.5, color: C.textSoft, lineHeight: 1.65 }}>{children}</div>
  </section>
);

export default function LegalModal({ tab = 'imprint', onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(8px)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Rechtliches</div>

        <Section title="Impressum">
          <p style={{ margin: '0 0 6px' }}>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz):</p>
          <p style={{ margin: '0 0 10px' }}>
            {OPERATOR.name}<br />
            {OPERATOR.street}<br />
            {OPERATOR.city}<br />
            <br />
            <strong>Kontakt:</strong> {OPERATOR.email}
          </p>
          <p style={{ margin: 0, color: C.textFaint, fontSize: 11.5 }}>
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: {OPERATOR.name}, Anschrift wie oben.
          </p>
        </Section>

        <Section title="Haftungs- & Inhaltshinweis">
          Dies ist ein nicht-kommerzielles, privates Projekt zu Informationszwecken.
          <strong> Keine Anlage- oder Kaufberatung.</strong> Preisangaben sind teils
          echte Marktwerte (z. B. Cardmarket EU für Magic), teils transparent
          gekennzeichnete <strong>Schätzungen</strong> (One Piece, Yu-Gi-Oh!) – in
          jedem Fall ohne Gewähr auf Richtigkeit, Vollständigkeit oder Aktualität.
          Maßgeblich ist immer der tatsächliche Preis auf dem jeweiligen Marktplatz.
          Für externe Links wird keine Haftung übernommen; für deren Inhalte sind die
          jeweiligen Betreiber verantwortlich.
        </Section>

        <Section title="Markenrechtlicher Hinweis">
          Diese Seite ist ein <strong>inoffizielles Fan-Projekt</strong> und steht in
          keiner Verbindung zu, und wird nicht unterstützt von, The Pokémon Company /
          Nintendo, Bandai (One Piece Card Game), Konami (Yu-Gi-Oh!) oder Wizards of
          the Coast / Hasbro (Magic: The Gathering). Alle genannten Namen, Logos,
          Marken und Kartenabbildungen sind Eigentum der jeweiligen Rechteinhaber und
          werden hier ausschließlich zu Identifikations- und Informationszwecken
          verwendet. Kartenbilder werden von öffentlichen Quellen geladen
          (u. a. Scryfall, pokemontcg.io, ygoprodeck/yugipedia, offizielle
          One-Piece-CDN); das Urheberrecht daran liegt bei den jeweiligen Inhabern.
        </Section>

        <Section title="Datenschutzerklärung">
          <p style={{ margin: '0 0 8px' }}>
            <strong>Verantwortlicher:</strong> {OPERATOR.name}, {OPERATOR.email}.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Hosting:</strong> Die Seite wird über <em>GitHub Pages</em>
            (GitHub Inc., USA) bereitgestellt. Beim Aufruf verarbeitet GitHub
            technisch notwendige Server-Logdaten inkl. IP-Adresse (Rechtsgrundlage
            Art. 6 Abs. 1 lit. f DSGVO – sicherer, störungsfreier Betrieb). Details:
            GitHub Privacy Statement.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Kartenbilder von Drittanbietern:</strong> Zur Anzeige der
            Kartenmotive werden Bilder direkt von externen Servern geladen
            (Scryfall, pokemontcg.io, images.ygoprodeck.com / yugipedia,
            en.onepiece-cardgame.com sowie der Bild-Proxy wsrv.nl). Dabei wird deine
            IP-Adresse technisch an diese Anbieter übertragen. Rechtsgrundlage ist
            Art. 6 Abs. 1 lit. f DSGVO (ansprechende Darstellung der Inhalte).
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Lokale Speicherung & Cookies:</strong> Deine Sammlung, Watchlist,
            Alerts, Konten und Einstellungen werden ausschließlich <strong>lokal in
            deinem Browser</strong> (localStorage) gespeichert – sie verlassen dein
            Gerät nicht und werden nicht an uns übertragen. <strong>Diese Website
            setzt keine Cookies</strong> – weder eigene noch von Dritten – und es
            findet <strong>kein Tracking, keine Analyse und keine Werbung</strong>
            statt. Ein Cookie-Banner ist daher nicht erforderlich; die lokale
            Speicherung ist für den Betrieb technisch notwendig und einwilligungsfrei.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong>Konto & Zahlung (optional):</strong> Falls Konten aktiviert sind,
            verarbeitet <em>Supabase</em> (Auth/Datenbank) deine E-Mail und die
            synchronisierten Sammlungsdaten als Auftragsverarbeiter; bei einem
            kostenpflichtigen Abo wickelt <em>Stripe</em> die Zahlung ab – es werden
            keine Kartendaten auf dieser Seite gespeichert. Rechtsgrundlage:
            Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
          </p>
          <p style={{ margin: 0 }}>
            <strong>Deine Rechte:</strong> Auskunft, Berichtigung, Löschung,
            Einschränkung, Widerspruch und Datenübertragbarkeit (Art. 15–21 DSGVO)
            sowie Beschwerde bei einer Aufsichtsbehörde. Lokal gespeicherte Daten
            kannst du jederzeit selbst löschen (Browserdaten dieser Seite leeren).
          </p>
        </Section>

        <div style={{ fontSize: 10.5, color: C.textGhost, borderTop: `1px solid ${C.lineStrong}`, paddingTop: 12, lineHeight: 1.6 }}>
          Stand: Juni 2026 · ⚠️ Vorlage ohne Rechtsberatung. Vor der Veröffentlichung
          die [[Platzhalter]] mit echten Angaben ersetzen; im Zweifel rechtlich
          prüfen lassen.
        </div>
      </div>
    </div>
  );
}
