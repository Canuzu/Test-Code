/* Camp buchen im Vorschau-Modus: Preis, Prüfung und wer buchen darf.
   Dass camp.json und seed.sql dieselben Zahlen tragen, prüft die CI:
   beide schreibt startdaten.mjs aus derselben Quelle. */
import { lies, setze, type Konto } from '@/daten/zustand';
import { CAMP_DATEN, campJahrgaenge, campPruefen, campSumme, euro, neuesFormular } from '@/daten/camp';
import { campBuchen, darfCampBuchen, elternBuchenUeberKind } from '@/daten/aktionen';

const jahr = new Date().getFullYear();
const erwachsen: Konto = { id: 'x', vorname: 'Sandra', email: null, ebene: 1, rolle: 'eltern', seit: 0, geburtsjahr: null, eltern: false, lokal: true };

beforeEach(() => setze({ konto: erwachsen, buchungen: {} }));

test('Preis mit Geschwisterrabatt, in Euro geschrieben', () => {
  expect(campSumme(1)).toBe(24900);
  expect(campSumme(2)).toBe(2 * 24900 - 2000);
  expect(campSumme(3)).toBe(3 * 24900 - 2 * 2000);
  expect(euro(campSumme(2))).toBe('478,00 €');
});

test('Die Jahrgänge des Camps, der jüngste zuerst', () => {
  const z = CAMP_DATEN;
  expect(z.jahrgang_bis - z.jahrgang_von).toBe(7);
  expect(campJahrgaenge()[0]).toBe(z.jahrgang_bis);
  expect(campJahrgaenge().at(-1)).toBe(z.jahrgang_von);
});

test('Was fehlt, steht in einem Satz', () => {
  const c = neuesFormular('Luis', 2014);
  expect(campPruefen(c)).toMatch(/Notfallnummer/);
  c.notfall = '0221 1234567';
  expect(campPruefen(c)).toMatch(/Teilnahmebedingungen/);
  c.ok = true;
  expect(campPruefen(c)).toBeNull();
  c.kinder.push({ vorname: ' ', jahrgang: 2016, hinweise: '' });
  expect(campPruefen(c)).toMatch(/Vornamen/);
  c.kinder[1] = { vorname: 'Mila', jahrgang: 2005, hinweise: '' };
  expect(campPruefen(c)).toMatch(/Jahrgänge/);
});

test('Wer buchen darf', () => {
  const kind: Konto = { ...erwachsen, vorname: 'Luis', rolle: 'spieler', geburtsjahr: jahr - 12, eltern: true };
  expect(darfCampBuchen(null)).toBe(false);
  expect(darfCampBuchen(erwachsen)).toBe(true);
  expect(darfCampBuchen(kind)).toBe(true);                 // das Konto läuft auf die Eltern
  expect(elternBuchenUeberKind(kind)).toBe(true);
  expect(darfCampBuchen({ ...kind, geburtsjahr: jahr - 17, eltern: false })).toBe(false);
  expect(darfCampBuchen({ ...kind, geburtsjahr: jahr - 25, eltern: false })).toBe(true);
});

test('Buchen legt die Buchung ab, ein Kind ohne Eltern kann es nicht', async () => {
  const c = { ...neuesFormular('Luis', 2014), notfall: '0221 1234567', ok: true };
  c.kinder.push({ vorname: 'Mila', jahrgang: 2017, hinweise: 'Nussallergie' });
  const b = await campBuchen(c);
  expect(b.summe).toBe(campSumme(2));
  expect(b.nr).toMatch(/^HC-\d{4}-[0-9A-Z]{4}$/);
  expect(lies().buchungen[CAMP_DATEN.id].kinder.map((k) => k.vorname)).toEqual(['Luis', 'Mila']);
  setze({ konto: { ...erwachsen, rolle: 'spieler', geburtsjahr: jahr - 15, eltern: false }, buchungen: {} });
  await expect(campBuchen(c)).rejects.toThrow(/Erwachsener/);
  await expect(campBuchen({ ...c, ok: false })).rejects.toThrow();
});
