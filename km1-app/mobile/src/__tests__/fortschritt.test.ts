/* Fortschritt im Vorschau-Modus (ohne Server): Zugang, Wochenziel,
   Serie, Aufstieg, gemerkte Stelle und Löschen. */
import { lies, setze, type Konto } from '@/daten/zustand';
import {
  abhaken, dieseWoche, gesperrt, kontoLoeschen, registrieren, serieWochen, stelleMerken, videoFuer,
} from '@/daten/aktionen';
import { TAG_MS, wochenStart } from '@/lib/zeit';

const v = (slug: string) => videoFuer(slug)!;

beforeEach(() => setze({ konto: null, done: {}, merk: {}, pro: false, abo: null, stelle: {}, zuletzt: null }));

test('Zugang: Gast, Konto, Pro, Trainer', () => {
  expect(gesperrt(v('erste-beruehrung'))).toBe(false);
  expect(gesperrt(v('ballmitnahme'))).toBe(true);
  expect(gesperrt(v('profi-freistoss'))).toBe(true);
  const konto: Konto = { id: 'x', vorname: 'Luis', email: null, ebene: 1, rolle: 'spieler', seit: 0, geburtsjahr: 2014, eltern: true, lokal: true };
  setze({ konto });
  expect(gesperrt(v('ballmitnahme'))).toBe(false);
  expect(gesperrt(v('profi-freistoss'))).toBe(true);
  setze({ pro: true });
  expect(gesperrt(v('profi-freistoss'))).toBe(false);
  setze({ pro: false, konto: { ...konto, rolle: 'trainer' } });
  expect(gesperrt(v('profi-freistoss'))).toBe(false);
});

test('Wochenziel zählt nur diese Woche, Serie zählt Wochen am Stück', () => {
  const diese = wochenStart() + 3600e3, vorige = wochenStart() - 3 * TAG_MS, vorvorvorige = wochenStart() - 17 * TAG_MS;
  setze({ done: { 'erste-beruehrung': diese, 'flacher-pass': vorige, abstoppen: vorvorvorige, 'challenge-September': diese } });
  expect(dieseWoche(lies())).toBe(1);        // die Challenge zählt nicht
  expect(serieWochen(lies())).toBe(2);       // diese und letzte Woche, dann eine Lücke
});

test('Aufstieg nach dem ganzen Pfad, auch mit Pro', async () => {
  await registrieren({ vorname: 'Luis', email: 'e@beispiel.de', passwort: 'geheim123', geburtsjahr: 2014, eltern: true });
  setze({ pro: true });
  const pfad = ['erste-beruehrung', 'flacher-pass', 'abstoppen', 'leiter'];
  for (const s of pfad) expect((await abhaken(s)).aufstieg).toBe(false);
  expect((await abhaken('torwart-grund')).aufstieg).toBe(true);
  expect(lies().konto!.ebene).toBe(2);
});

test('gemerkte Stelle: unter fünf Sekunden und kurz vor Schluss zählt nicht', () => {
  stelleMerken('leiter', 120, 435);
  expect(lies().stelle.leiter).toBe(120);
  expect(lies().zuletzt).toBe('leiter');
  stelleMerken('leiter', 3, 435);
  expect(lies().stelle.leiter).toBeUndefined();
  stelleMerken('leiter', 430, 435);
  expect(lies().stelle.leiter).toBeUndefined();
});

test('Konto löschen nimmt Fortschritt, Merkliste und Stelle mit', async () => {
  await registrieren({ vorname: 'Mia', email: 'm@beispiel.de', passwort: 'geheim123', geburtsjahr: 1990, eltern: false });
  await abhaken('erste-beruehrung');
  stelleMerken('leiter', 60, 435);
  await kontoLoeschen();
  const s = lies();
  expect(s.konto).toBeNull();
  expect(s.done).toEqual({});
  expect(s.stelle).toEqual({});
});
