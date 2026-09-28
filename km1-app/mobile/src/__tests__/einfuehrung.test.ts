/* Der erste Start: welche Fragen wer bekommt und was die Antworten
   bewirken. */
import { lies, setze } from '@/daten/zustand';
import { ebeneFuerJahrgang, erstSchritte } from '@/daten/einfuehrung';
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
