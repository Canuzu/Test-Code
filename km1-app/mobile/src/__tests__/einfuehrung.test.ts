/* Der erste Start: welche Fragen wer bekommt und was die Antworten
   bewirken. */
import { lies, setze } from '@/daten/zustand';
import { ROLLEN, ROLLEN_HAUPT, ebeneFuerJahrgang, erstSchritte, istKind, meineEbene } from '@/daten/einfuehrung';
import { ersterStartUebernehmen, naechstesVideo } from '@/daten/aktionen';

beforeEach(() => setze({
  konto: null, ersterStart: false, vorlieben: { rolle: null, jahrgang: null },
  erinnerung: { an: true, tage: ['mi', 'sa'], zeit: '17:00' }, filter: { kat: 'alle', ebene: 0, suche: '' },
}));

test('Spieler und Eltern bekommen drei Fragen, Trainer zwei, alle anderen eine', () => {
  expect(erstSchritte('spieler')).toEqual(['rolle', 'jahrgang', 'zeit', 'fertig']);
  expect(erstSchritte('eltern')).toEqual(['rolle', 'jahrgang', 'zeit', 'fertig']);
  expect(erstSchritte('trainer')).toEqual(['rolle', 'zeit', 'fertig']);
  expect(erstSchritte('scout')).toEqual(['rolle', 'fertig']);
});

test('Die Ebene folgt dem Alter', () => {
  expect(ebeneFuerJahrgang(2014, 2026)).toBe(1);   // 12
  expect(ebeneFuerJahrgang(2012, 2026)).toBe(2);   // 14
  expect(ebeneFuerJahrgang(2011, 2026)).toBe(3);   // 15
});

test('Die Antworten setzen Jahrgang, Ebene und Erinnerung', () => {
  const jg = new Date().getFullYear() - 14;
  ersterStartUebernehmen({ rolle: 'spieler', jahrgang: jg, tage: ['di', 'do'], zeit: '18:00' });
  const s = lies();
  expect(s.ersterStart).toBe(true);
  expect(s.vorlieben).toEqual({ rolle: 'spieler', jahrgang: jg });
  expect(s.erinnerung).toEqual({ an: true, tage: ['di', 'do'], zeit: '18:00' });
  expect(s.filter.ebene).toBe(2);
  expect(naechstesVideo(s)?.ebene).toBe(2);
});

test('Wer keine Tage wählt, bekommt keine Erinnerung; ein Scout keinen Jahrgang', () => {
  ersterStartUebernehmen({ rolle: 'eltern', jahrgang: 2016, tage: [], zeit: '17:00' });
  expect(lies().erinnerung.an).toBe(false);
  setze({ vorlieben: { rolle: null, jahrgang: null } });
  ersterStartUebernehmen({ rolle: 'scout', jahrgang: 2016, tage: ['mo'], zeit: '19:00' });
  expect(lies().vorlieben).toEqual({ rolle: 'scout', jahrgang: null });
  expect(lies().erinnerung.tage).toEqual([]);
});

test('Überspringen merkt sich nur, dass gefragt wurde', () => {
  ersterStartUebernehmen(null);
  expect(lies().ersterStart).toBe(true);
  expect(lies().vorlieben.rolle).toBeNull();
});

test('Ohne gewählten Jahrgang bleibt die Ebene, wie sie war', () => {
  ersterStartUebernehmen({ rolle: 'spieler', jahrgang: null, tage: ['mo'], zeit: '17:00' });
  expect(lies().vorlieben).toEqual({ rolle: 'spieler', jahrgang: null });
  expect(lies().filter.ebene).toBe(0);
  expect(meineEbene(lies())).toBe(1);
});

test('Oben stehen drei Rollen, die übrigen hinter „Etwas anderes“', () => {
  expect(ROLLEN_HAUPT).toEqual(['spieler', 'eltern', 'trainer']);
  expect(ROLLEN.filter((x) => !ROLLEN_HAUPT.includes(x.r)).map((x) => x.r)).toEqual(['akademie', 'verein', 'profi', 'scout']);
});

test('Ohne Konto zählt der Jahrgang aus dem ersten Start für Ebene und Alter', () => {
  const jahr = 2026;
  expect(istKind({ konto: null, vorlieben: { rolle: null, jahrgang: null } }, jahr)).toBe(true);
  expect(istKind({ konto: null, vorlieben: { rolle: 'spieler', jahrgang: 2014 } }, jahr)).toBe(true);
  expect(istKind({ konto: null, vorlieben: { rolle: 'spieler', jahrgang: 2009 } }, jahr)).toBe(false);
  // Eltern geben den Jahrgang ihres Kindes an, sind aber selbst kein Kind.
  expect(istKind({ konto: null, vorlieben: { rolle: 'eltern', jahrgang: 2014 } }, jahr)).toBe(false);
  setze({ vorlieben: { rolle: 'spieler', jahrgang: new Date().getFullYear() - 14 } });
  expect(meineEbene(lies())).toBe(2);
});
