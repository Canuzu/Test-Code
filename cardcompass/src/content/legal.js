// Rechtstexte von CardCompass als Daten. (Titel enthalten weiche Trennstriche
// \u00AD, damit lange Wörter auf dem Smartphone sauber umbrechen.)
//
// Die Texte entsprechen wortgleich den Dokumenten der bisherigen Website
// (cardcompass.de, Stand November 2026). Nur die persönlichen Angaben des
// Betreibers werden aus src/content/operator.js eingesetzt – solange dort noch
// [[Platzhalter]] stehen, werden sie auf der Seite gelb markiert.
//
// Aufbau eines Dokuments:
//   { title, updated, intro?: [block], cta?, sections: [{ h, id?, draft?, blocks: [block] }] }
// Blöcke:
//   { p: 'Text' }                 Absatz
//   { ul: ['…', '…'] }            Aufzählung
//   { lines: ['…', '…'] }         Zeilen ohne Abstand (Anschrift)
//   { form: ['…', '…'] }          umrahmtes Formular (Muster-Widerrufsformular)
//   { note: '…' }                 zentrierte Randnotiz
//   { table: { head: [], rows: [[]] } }
// Inline-Auszeichnung in Texten:
//   [Linktext](/pfad | https://… | mailto:… | tel:…)   **fett**   [[Platzhalter]]
import { OPERATOR, isPlaceholder } from './operator.js';
import { R } from '../lib/routes.js';

export const LEGAL_UPDATED = 'Stand: November 2026';

// E-Mail / Telefon als Link – oder als sichtbarer Platzhalter, solange leer.
const mail = (o) => (isPlaceholder(o.email) ? o.email : `[${o.email}](mailto:${o.email})`);
const tel = (o) => (isPlaceholder(o.phone) ? o.phone : `[${o.phone}](tel:${o.phone.replace(/[^\d+]/g, '')})`);

const agb = (o) => ({
  title: 'Allgemeine Geschäfts\u00ADbedingungen',
  short: 'AGB',
  updated: LEGAL_UPDATED,
  sections: [
    {
      h: '§ 1 Geltungsbereich und Anbieter',
      blocks: [
        { p: `Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen über den Online-Shop unter cardcompass.de. Vertragspartner ist ${o.name}, ${o.business}, ${o.street}, ${o.city} (im Folgenden „wir“). Weitere Angaben stehen im [Impressum](${R.impressum}).` },
        { p: 'Der Shop richtet sich an Verbraucher und Unternehmer. Abweichende Bedingungen des Kunden gelten nicht, auch wenn wir ihnen nicht ausdrücklich widersprechen.' },
      ],
    },
    {
      h: '§ 2 Vertragsschluss',
      blocks: [
        { p: 'Die Darstellung der Produkte im Shop ist kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung.' },
        { p: 'Du legst Produkte in den Warenkorb, gehst zur Kasse und gibst deine Daten ein. Vor dem Absenden siehst du alle Angaben noch einmal und kannst Eingabefehler korrigieren oder den Vorgang abbrechen. Mit dem Klick auf den Bestellbutton gibst du ein verbindliches Angebot zum Kauf der Waren im Warenkorb ab.' },
        { p: 'Wir bestätigen den Eingang der Bestellung unverzüglich per E-Mail. Diese Eingangsbestätigung ist noch keine Annahme. Der Kaufvertrag kommt zustande, wenn wir die Bestellung per E-Mail annehmen (Auftragsbestätigung) oder die Ware versenden, spätestens innerhalb von zwei Werktagen nach der Bestellung. Nehmen wir innerhalb dieser Frist nicht an, bist du nicht mehr an deine Bestellung gebunden; bereits geleistete Zahlungen erstatten wir unverzüglich.' },
      ],
    },
    {
      h: '§ 3 Vertragstext und Sprache',
      blocks: [
        { p: 'Wir speichern den Vertragstext. Die Bestelldaten und diese AGB schicken wir dir mit der Auftragsbestätigung per E-Mail. Die AGB kannst du jederzeit auf dieser Seite ansehen und ausdrucken. Vertragssprache ist Deutsch.' },
      ],
    },
    {
      h: '§ 4 Preise und Versandkosten',
      blocks: [
        { p: o.smallBusiness
          ? 'Alle Preise sind Endpreise in Euro. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und ausgewiesen (Kleinunternehmer).'
          : 'Alle Preise sind Endpreise in Euro und enthalten die gesetzliche Umsatzsteuer.' },
        { p: 'Zusätzlich fallen Versandkosten an. Sie werden im Bestellprozess vor dem Absenden der Bestellung angezeigt.' },
      ],
    },
    {
      h: '§ 5 Zahlung',
      blocks: [
        { p: 'Dir stehen die Zahlungsarten zur Verfügung, die im Bestellprozess angezeigt werden. Der Kaufpreis ist mit der Bestellung fällig. Bei Zahlung über einen Zahlungsdienstleister gelten zusätzlich dessen Bedingungen.' },
      ],
    },
    {
      h: '§ 6 Lieferung',
      blocks: [
        { p: 'Wir liefern derzeit nur innerhalb Deutschlands. Die Lieferzeit beträgt 2–4 Werktage nach Zahlungseingang, sofern beim Produkt nichts anderes angegeben ist.' },
        { p: 'Ist ein bestelltes Produkt nicht verfügbar, weil wir selbst ohne eigenes Verschulden nicht beliefert werden, informieren wir dich unverzüglich und erstatten bereits gezahlte Beträge sofort.' },
      ],
    },
    {
      h: '§ 7 Eigentumsvorbehalt',
      blocks: [{ p: 'Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.' }],
    },
    {
      h: '§ 8 Transportschäden',
      blocks: [
        { p: 'Kommt Ware mit offensichtlichen Transportschäden an, reklamiere sie bitte möglichst sofort beim Zusteller und gib uns Bescheid. Das hilft uns, Ansprüche gegenüber dem Versandunternehmen durchzusetzen. Deine gesetzlichen Rechte bleiben davon unberührt, auch wenn du das nicht tust.' },
      ],
    },
    {
      h: '§ 9 Gewährleistung',
      blocks: [
        { p: `Es gilt das gesetzliche Mängelhaftungsrecht. Garantien geben wir nicht. Herstellergarantien bleiben unberührt. Bei Mängeln erreichst du uns unter ${mail(o)}.` },
      ],
    },
    {
      h: '§ 10 Haftung',
      blocks: [
        { p: 'Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht (einer Pflicht, deren Erfüllung den Vertrag erst möglich macht und auf die du vertrauen darfst) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.' },
      ],
    },
    {
      h: '§ 11 Widerrufsrecht',
      blocks: [
        { p: `Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten stehen in der [Widerrufsbelehrung](${R.widerrufsbelehrung}). Den Widerruf kannst du auch online über [„Vertrag widerrufen“](${R.widerruf}) erklären.` },
      ],
    },
    {
      h: '§ 12 Streitbeilegung',
      blocks: [
        { p: 'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.' },
      ],
    },
    {
      h: '§ 13 Schlussbestimmungen',
      blocks: [
        { p: 'Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bist du Verbraucher, gilt diese Rechtswahl nur, soweit dir dadurch nicht der Schutz zwingender Vorschriften des Staates entzogen wird, in dem du deinen gewöhnlichen Aufenthalt hast.' },
        { p: 'Sind einzelne Bestimmungen dieser AGB unwirksam, bleibt der Vertrag im Übrigen wirksam. An die Stelle der unwirksamen Bestimmung tritt die gesetzliche Regelung.' },
      ],
    },
  ],
});

const widerrufsbelehrung = (o) => ({
  title: 'Widerrufs\u00ADbelehrung',
  short: 'Widerrufsbelehrung',
  updated: LEGAL_UPDATED,
  intro: [
    { p: 'Verbraucher haben ein Widerrufsrecht nach Maßgabe der folgenden Bestimmungen. Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB).' },
  ],
  cta: { to: R.widerruf, label: 'Vertrag widerrufen', text: 'Du möchtest widerrufen? Das geht online in wenigen Schritten – mit sofortiger Eingangsbestätigung.' },
  sections: [
    {
      h: 'Widerrufsrecht',
      blocks: [
        { p: 'Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.' },
        { p: 'Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat.' },
        { p: `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${o.name}, ${o.business}, ${o.street}, ${o.city}, E-Mail: ${mail(o)}, Telefon: ${tel(o)}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.` },
        { p: `Sie können Ihr Widerrufsrecht auch online unter [www.cardcompass.de/widerruf](${R.widerruf}) über die Schaltfläche „Vertrag widerrufen“ ausüben, die auf jeder Seite unseres Shops unten verlinkt ist. Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger (z. B. per E-Mail) unverzüglich eine Bestätigung über den Eingang des Widerrufs mit dem Inhalt der Widerrufserklärung sowie Datum und Uhrzeit ihres Eingangs.` },
        { p: 'Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.' },
      ],
    },
    {
      h: 'Folgen des Widerrufs',
      blocks: [
        { p: 'Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.' },
        { p: 'Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.' },
        { p: 'Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.' },
        { p: 'Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.' },
        { p: 'Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.' },
        { note: '– Ende der Widerrufsbelehrung –' },
      ],
    },
    {
      h: 'Muster-Widerrufsformular',
      blocks: [
        { p: '(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)' },
        {
          form: [
            `– An ${o.name}, ${o.business}, ${o.street}, ${o.city}, E-Mail: ${mail(o)}:`,
            '– Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)',
            '– Bestellt am (*)/erhalten am (*)',
            '– Name des/der Verbraucher(s)',
            '– Anschrift des/der Verbraucher(s)',
            '– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)',
            '– Datum',
          ],
        },
        { p: '(*) Unzutreffendes streichen.' },
      ],
    },
  ],
});

const impressum = (o) => ({
  title: 'Impressum',
  short: 'Impressum',
  updated: LEGAL_UPDATED,
  sections: [
    {
      h: 'Angaben gemäß § 5 DDG',
      blocks: [{ lines: [o.name, o.business, o.street, o.city, o.country] }],
    },
    {
      h: 'Kontakt',
      blocks: [
        { lines: [`E-Mail: ${mail(o)}`, `Telefon: ${tel(o)}`] },
        { p: `Weitere Wege findest du auf der [Kontaktseite](${R.contact}).` },
      ],
    },
    {
      h: 'Umsatzsteuer',
      blocks: [{
        p: o.smallBusiness
          ? 'Kleinunternehmer im Sinne von § 19 UStG. Es wird keine Umsatzsteuer berechnet und ausgewiesen. Eine Umsatzsteuer-Identifikationsnummer ist nicht vorhanden.'
          : `Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${o.vatId || '[[USt-IdNr.]]'}`,
      }],
    },
    {
      h: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
      blocks: [{ p: `${o.name}, ${o.street}, ${o.city}` }],
    },
    {
      h: 'Verbraucherstreitbeilegung',
      blocks: [
        { p: 'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). Bei Fragen oder Problemen mit einer Bestellung schreib uns einfach eine E-Mail, wir finden gemeinsam eine Lösung.' },
      ],
    },
    {
      h: 'Haftung für Links',
      blocks: [
        { p: 'Diese Seiten können Links zu Websites Dritter enthalten. Für deren Inhalte ist der jeweilige Anbieter verantwortlich. Werden uns Rechtsverletzungen bekannt, entfernen wir solche Links umgehend.' },
      ],
    },
    {
      h: 'Marken',
      blocks: [
        { p: 'Pokémon, One Piece, Digimon, Naruto und alle weiteren genannten Spiele und Marken gehören ihren jeweiligen Rechteinhabern. CardCompass ist ein unabhängiger Händler und steht in keiner Verbindung zu den Herstellern.' },
      ],
    },
  ],
});

const datenschutz = (o) => ({
  title: 'Datenschutz\u00ADerklärung',
  short: 'Datenschutz',
  updated: LEGAL_UPDATED,
  sections: [
    {
      h: '1. Verantwortlicher',
      blocks: [
        { p: 'Verantwortlich für die Datenverarbeitung auf dieser Website ist:' },
        { lines: [o.name, o.business, o.street, o.city, o.country] },
        { p: `E-Mail: ${mail(o)}` },
        { p: 'Ein Datenschutzbeauftragter ist nicht bestellt, weil keine gesetzliche Pflicht dazu besteht.' },
      ],
    },
    {
      h: '2. Grundsätze',
      blocks: [
        { p: 'Wir verarbeiten personenbezogene Daten nur, soweit es für den Betrieb des Shops, die Abwicklung von Bestellungen oder die Beantwortung deiner Anfragen nötig ist. Wir verkaufen keine Daten, nutzen kein Tracking, keine Analyse-Tools, keine Werbenetzwerke und keine Social-Media-Plugins. Schriftarten werden von unserem eigenen Server geladen, nicht von Google oder anderen Drittanbietern.' },
        { p: 'Die Verbindung zu dieser Website ist per TLS (HTTPS) verschlüsselt.' },
      ],
    },
    {
      h: '3. Hosting und Auslieferung der Website (Cloudflare)',
      blocks: [
        { p: 'Die Website wird über Cloudflare ausgeliefert (Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA). Cloudflare stellt die Dateien des Shops über ein weltweites Netz von Rechenzentren bereit, verwaltet die Domain (DNS) und schützt die Seite vor Angriffen und Überlastung.' },
        { p: `Beim Aufruf der Seite verarbeitet Cloudflare technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Browser- und Geräteinformationen sowie die zuvor besuchte Seite (Referrer). Ohne diese Daten kann die Seite nicht ausgeliefert werden. Zur Erkennung von Bots kann Cloudflare das Cookie __cf_bm setzen (siehe [Cookies](${R.cookies})).` },
        { p: 'Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in einer sicheren, schnellen und zuverlässigen Bereitstellung des Shops. Mit Cloudflare besteht ein Vertrag zur Auftragsverarbeitung. Eine Übermittlung in die USA ist möglich. Sie stützt sich auf den Angemessenheitsbeschluss der EU-Kommission zum EU-U.S. Data Privacy Framework sowie auf EU-Standardvertragsklauseln.' },
      ],
    },
    {
      h: '4. Shop-Datenbank, Produktbilder und Anmeldung (Supabase)',
      blocks: [
        { p: 'Produktdaten, Bestände, Bestellungen und Produktbilder speichern wir bei Supabase (Supabase Pte. Ltd., Singapur). Die Datenbank und der Dateispeicher liegen in einem Rechenzentrum in der EU (Irland). Beim Laden des Shops und der Produktbilder wird deine IP-Adresse an Supabase übermittelt, weil dein Browser die Daten direkt von dort abruft.' },
        { p: 'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bestellungen) und Art. 6 Abs. 1 lit. f DSGVO (Betrieb des Shops). Mit Supabase besteht ein Vertrag zur Auftragsverarbeitung. Für Zugriffe aus Drittländern, etwa für Support oder durch Unterauftragnehmer, sind EU-Standardvertragsklauseln vereinbart.' },
      ],
    },
    {
      h: '5. Bestellungen',
      blocks: [
        { p: 'Wenn du bestellst, verarbeiten wir die Daten, die du im Bestellformular angibst: Name, E-Mail-Adresse, Liefer- und Rechnungsanschrift, freiwillig deine Telefonnummer sowie die bestellten Artikel, Preise und den Zahlungs- und Versandstatus. Wir brauchen diese Daten, um den Kaufvertrag zu erfüllen, dir Bestätigungen zu senden und die Ware zu liefern (Art. 6 Abs. 1 lit. b DSGVO).' },
        { p: 'Für den Versand geben wir Name und Lieferanschrift an das beauftragte Versandunternehmen weiter. Für die Bezahlung erhält der jeweilige Zahlungsdienstleister die dafür nötigen Daten. Welche Versand- und Zahlungsdienstleister das sind, ergänzen wir hier, sobald sie im Shop freigeschaltet sind.' },
        { p: 'Nach Abschluss der Bestellung bewahren wir die Daten so lange auf, wie es das Gesetz verlangt (Art. 6 Abs. 1 lit. c DSGVO): Rechnungen und Buchungsbelege 8 Jahre, Handels- und Geschäftsbriefe 6 Jahre (§ 147 AO, § 257 HGB). Danach werden sie gelöscht.' },
        { p: 'Erklärst du einen Widerruf über unsere Online-Funktion „Vertrag widerrufen“, speichern wir deinen Namen, die Bestellnummer, die betroffenen Artikel, deine E-Mail-Adresse und den Zeitpunkt des Eingangs und schicken dir eine Eingangsbestätigung (Art. 6 Abs. 1 lit. c DSGVO, § 356a BGB).' },
      ],
    },
    // NEU – vor Livegang rechtlich prüfen lassen.
    // Dieser Abschnitt ist neu (nicht Teil der bisherigen Datenschutzerklärung)
    // und beschreibt die Zahlungsabwicklung über Stripe. Nach der Prüfung
    // `draft: true` entfernen – dann verschwindet der Prüf-Hinweis auf der Seite.
    // Durch das Einfügen haben sich die folgenden Abschnittsnummern um 1 erhöht
    // (Verweise im Text beziehen sich nur auf die Abschnitte 4 und 5).
    {
      h: '6. Zahlungsabwicklung (Stripe)',
      draft: true,
      blocks: [
        { p: 'Zahlungen im Shop wickeln wir über den Zahlungsdienstleister Stripe ab (Stripe Payments Europe, Ltd., Dublin, Irland). Wenn du an der Kasse bezahlst, gibst du deine Zahlungsdaten (zum Beispiel Kartendaten) direkt bei Stripe ein; wir erhalten sie nicht. Stripe erhält dafür die zur Zahlung nötigen Daten: deinen Namen, deine E-Mail-Adresse, die Rechnungsanschrift, den Bestellbetrag und die Bestellnummer sowie technische Daten wie IP-Adresse und Geräteinformationen, die Stripe zur Betrugsvermeidung nutzt.' },
        { p: 'Wählst du eine Zahlungsart wie PayPal oder Klarna, gibt Stripe die dafür nötigen Daten an den jeweiligen Anbieter weiter. Für dessen Verarbeitung gelten zusätzlich die Datenschutzhinweise dieses Anbieters.' },
        { p: 'Zweck ist die Abwicklung der Zahlung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Stripe kann Daten auch in den USA verarbeiten; die Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission zum EU-U.S. Data Privacy Framework sowie auf EU-Standardvertragsklauseln. Mehr dazu in der Datenschutzerklärung von Stripe: [stripe.com/de/privacy](https://stripe.com/de/privacy).' },
      ],
    },
    {
      h: '7. Kundenkonto',
      blocks: [
        { p: 'Du kannst freiwillig ein Kundenkonto anlegen. Dafür speichern wir deine E-Mail-Adresse, deinen Namen und dein Passwort (nur als verschlüsselter Hash, wir können es nicht lesen), außerdem die Adressen und die Telefonnummer, die du im Konto hinterlegst, sowie deine Bestellungen. Damit kannst du schneller bestellen und deine Bestellungen einsehen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.' },
        { p: `Die Anmeldung läuft über Supabase (siehe Abschnitt 4). Solange du angemeldet bist, speichert dein Browser ein Anmelde-Token (siehe [Cookies](${R.cookies})). Bestellen geht auch ohne Konto als Gast.` },
        { p: `Du kannst dein Konto jederzeit löschen lassen; eine E-Mail an ${mail(o)} genügt. Wir löschen dann deine Kontodaten. Bestelldaten bewahren wir nur so lange auf, wie es die gesetzlichen Aufbewahrungspflichten verlangen (Abschnitt 5).` },
      ],
    },
    {
      h: '8. Kontakt per E-Mail',
      blocks: [
        { p: 'Wenn du uns eine E-Mail schreibst, verarbeiten wir deine Adresse und den Inhalt deiner Nachricht, um dir zu antworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn es um eine Bestellung oder einen Vertrag geht, sonst Art. 6 Abs. 1 lit. f DSGVO (Beantwortung von Anfragen). Unser E-Mail-Postfach liegt bei der IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, mit der ein Vertrag zur Auftragsverarbeitung besteht. Wir löschen Nachrichten, wenn die Anfrage erledigt ist und keine Aufbewahrungspflicht besteht.' },
      ],
    },
    {
      h: '9. Cookies und Speicher im Browser',
      blocks: [
        { p: `Wir speichern nur, was für den Shop technisch nötig ist, zum Beispiel deinen Warenkorb und den gewählten Farbmodus. Diese Daten bleiben in deinem Browser und werden nicht an uns übertragen, bis du eine Bestellung abschickst. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG und Art. 6 Abs. 1 lit. f DSGVO. Eine vollständige Übersicht steht auf der Seite [Cookies](${R.cookies}).` },
      ],
    },
    {
      h: '10. Deine Rechte',
      blocks: [
        { p: 'Du hast jederzeit das Recht auf' },
        {
          ul: [
            'Auskunft über deine gespeicherten Daten (Art. 15 DSGVO),',
            'Berichtigung unrichtiger Daten (Art. 16 DSGVO),',
            'Löschung (Art. 17 DSGVO), soweit keine Aufbewahrungspflicht entgegensteht,',
            'Einschränkung der Verarbeitung (Art. 18 DSGVO),',
            'Datenübertragbarkeit (Art. 20 DSGVO),',
            'Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).',
          ],
        },
        { p: '**Widerspruchsrecht (Art. 21 DSGVO):** Soweit wir Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeiten, kannst du aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit widersprechen. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen.' },
        { p: `Für alle Anfragen genügt eine E-Mail an ${mail(o)}.` },
      ],
    },
    {
      h: '11. Beschwerderecht',
      blocks: [
        { p: 'Du kannst dich bei einer Datenschutz-Aufsichtsbehörde beschweren. Für uns zuständig ist die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Kavalleriestraße 2–4, 40213 Düsseldorf, [www.ldi.nrw.de](https://www.ldi.nrw.de).' },
      ],
    },
    {
      h: '12. Pflicht zur Bereitstellung',
      blocks: [
        { p: 'Zum Ansehen des Shops musst du keine Daten angeben. Für eine Bestellung brauchen wir die als Pflichtfeld markierten Angaben, sonst können wir den Vertrag nicht abschließen. Eine automatisierte Entscheidungsfindung oder Profilbildung findet nicht statt.' },
      ],
    },
    {
      h: '13. Änderungen',
      blocks: [
        { p: 'Wir passen diese Erklärung an, wenn sich der Shop oder die Rechtslage ändert, zum Beispiel wenn Zahlungsarten oder ein Versanddienstleister hinzukommen. Es gilt die hier veröffentlichte Fassung.' },
      ],
    },
  ],
});

const cookies = () => ({
  title: 'Cookies & Speicher im Browser',
  short: 'Cookies',
  updated: LEGAL_UPDATED,
  sections: [
    {
      h: 'Kurz gesagt',
      blocks: [
        { p: 'CardCompass verwendet keine Tracking-, Werbe- oder Analyse-Cookies. Wir nutzen nur Speicher, der für den Shop technisch nötig ist oder eine Funktion bereitstellt, die du selbst nutzt (zum Beispiel deinen Warenkorb). Dafür ist nach § 25 Abs. 2 Nr. 2 TDDDG keine Einwilligung erforderlich, deshalb zeigen wir auch kein Cookie-Banner.' },
      ],
    },
    {
      h: 'Was wir speichern',
      blocks: [
        {
          // Die Namen entsprechen den Schlüsseln, die der neue Shop-Code
          // tatsächlich verwendet (src/lib/cart.jsx, src/lib/hooks.js,
          // src/App.jsx/main.jsx, src/lib/supabase.js). Bei Änderungen dort
          // bitte hier nachziehen.
          table: {
            head: ['Name', 'Art', 'Zweck', 'Dauer'],
            rows: [
              ['cc_cart_v1', 'Local Storage', 'Speichert die Artikel in deinem Warenkorb, damit er beim nächsten Besuch noch da ist.', 'Bis du den Warenkorb leerst oder die Browserdaten löschst'],
              ['cc_theme', 'Local Storage', 'Merkt sich, ob du den hellen oder dunklen Modus gewählt hast.', 'Bis du die Browserdaten löschst'],
              ['cc_reload_at', 'Session Storage', 'Lädt die Seite nach einem Update einmal neu, damit keine veraltete Version angezeigt wird.', 'Bis du den Tab schließt'],
              ['cc_auth', 'Local Storage', 'Hält dich in deinem Kundenkonto angemeldet. Wird nur gesetzt, wenn du dich anmeldest.', 'Bis du dich abmeldest (die Anmeldung erneuert sich automatisch)'],
              ['__cf_bm', 'Cookie (Cloudflare)', 'Kann von unserem Hosting-Anbieter Cloudflare gesetzt werden, um automatisierte Angriffe (Bots) zu erkennen.', '30 Minuten'],
            ],
          },
        },
        { p: 'Das Anmelde-Token entsteht nur, wenn du dich in deinem Kundenkonto (oder als Mitarbeitende im Verwaltungsbereich) anmeldest. Wer als Gast einkauft, bekommt diesen Eintrag nicht.' },
      ],
    },
    {
      h: 'Selbst entscheiden',
      blocks: [
        { p: 'Du kannst Cookies und Browserspeicher jederzeit in den Einstellungen deines Browsers löschen oder blockieren. Der Shop funktioniert dann weiter, nur dein Warenkorb, die Farbwahl und die Anmeldung werden nicht mehr gespeichert.' },
        { p: `Sollten wir später Dienste einbinden, die eine Einwilligung brauchen, fragen wir vorher nach und passen diese Seite an. Mehr zum Umgang mit deinen Daten steht in der [Datenschutzerklärung](${R.datenschutz}).` },
      ],
    },
  ],
});

const DOCS = { agb, widerrufsbelehrung, impressum, datenschutz, cookies };

// Reihenfolge + Kurzbeschreibung für die Querverweise unter jedem Dokument.
export const LEGAL_DOCS = [
  { key: 'agb', label: 'AGB', path: R.agb, desc: 'Vertragsschluss, Preise, Lieferung und Haftung' },
  { key: 'widerrufsbelehrung', label: 'Widerrufsbelehrung', path: R.widerrufsbelehrung, desc: '14 Tage Widerrufsrecht und Muster-Formular' },
  { key: 'impressum', label: 'Impressum', path: R.impressum, desc: 'Anbieterkennzeichnung und Kontakt' },
  { key: 'datenschutz', label: 'Datenschutz', path: R.datenschutz, desc: 'Welche Daten wir wofür verarbeiten' },
  { key: 'cookies', label: 'Cookies', path: R.cookies, desc: 'Was im Browser gespeichert wird' },
];

export function getLegalDoc(key, operator = OPERATOR) {
  const make = DOCS[key] || DOCS.impressum;
  return make(operator);
}
