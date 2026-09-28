/* Ein Camp buchen. Ein Camp ist eine Leistung auf dem Platz; bezahlt
   wird deshalb direkt bei KM1, nicht über den App Store und ohne dessen
   Abgabe. Buchen kann nur ein Erwachsener, Kinder fragen ihre Eltern.
   Termin, Preis und Plätze stehen in camp.json, das startdaten.mjs aus
   der App im Browser erzeugt, mit denselben Zahlen wie in der Datenbank. */
import roh from './camp.json';
import type { CampKind } from './zustand';

export const CAMP_DATEN = roh as {
  id: string; titel: string; von: string; bis: string; preis_cent: number; geschwister_rabatt_cent: number;
  plaetze: number; frei: number; jahrgang_von: number; jahrgang_bis: number;
};

export const MAX_KINDER = 3;
export type Zahlung = 'karte' | 'paypal' | 'lastschrift';
export const ZAHLUNGEN: [Zahlung, string][] = [['karte', 'Karte'], ['paypal', 'PayPal'], ['lastschrift', 'Lastschrift']];

export type CampFormular = { kinder: CampKind[]; notfall: string; fotos: boolean; ok: boolean; zahlung: Zahlung };

export const euro = (cent: number) => (cent / 100).toFixed(2).replace('.', ',') + ' €';

/* Das erste Kind zahlt den vollen Preis, jedes Geschwisterkind weniger. */
export function campSumme(kinder: number) {
  if (kinder < 1) return 0;
  return kinder * CAMP_DATEN.preis_cent - (kinder - 1) * CAMP_DATEN.geschwister_rabatt_cent;
}

/* Die Jahrgänge, die ins Camp passen, der jüngste zuerst. */
export function campJahrgaenge() {
  const j: number[] = [];
  for (let x = CAMP_DATEN.jahrgang_bis; x >= CAMP_DATEN.jahrgang_von; x--) j.push(x);
  return j;
}

export function neuesFormular(vorname = '', jahrgang: number | null = null): CampFormular {
  const passt = jahrgang != null && jahrgang >= CAMP_DATEN.jahrgang_von && jahrgang <= CAMP_DATEN.jahrgang_bis;
  return {
    kinder: [{ vorname, jahrgang: passt ? jahrgang! : CAMP_DATEN.jahrgang_bis - 2, hinweise: '' }],
    notfall: '', fotos: false, ok: false, zahlung: 'karte',
  };
}

/* Was noch fehlt, in einem Satz. Leer heißt: es kann gebucht werden.
   Der Server prüft dasselbe noch einmal. */
export function campPruefen(c: CampFormular): string | null {
  if (c.kinder.some((k) => !k.vorname.trim())) return 'Bitte den Vornamen jedes Kindes eintragen.';
  if (c.kinder.some((k) => k.jahrgang < CAMP_DATEN.jahrgang_von || k.jahrgang > CAMP_DATEN.jahrgang_bis)) {
    return `Das Camp ist für die Jahrgänge ${CAMP_DATEN.jahrgang_von} bis ${CAMP_DATEN.jahrgang_bis}.`;
  }
  const ziffern = c.notfall.replace(/\D/g, '');
  if (ziffern.length < 6 || c.notfall.trim().length > 30) return 'Bitte eine Notfallnummer angeben, unter der Sie tagsüber erreichbar sind.';
  if (!c.ok) return 'Bitte bestätigen Sie die Teilnahmebedingungen.';
  return null;
}

/* Eine Buchungsnummer wie auf dem Server, für den Vorschau-Modus. */
export function vorschauNummer() {
  const z = () => Math.floor(Math.random() * 36).toString(36).toUpperCase();
  return `HC-${1000 + Math.floor(Math.random() * 9000)}-${z()}${z()}${z()}${z()}`;
}
