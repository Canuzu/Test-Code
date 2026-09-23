import { heuteZeile, minutenText, wochenStart, erinnerungText, WIE_OFT } from '@/lib/zeit';

beforeAll(() => { jest.useFakeTimers(); jest.setSystemTime(new Date(2026, 8, 23, 10, 0)); }); // ein Mittwoch
afterAll(() => jest.useRealTimers());

test('die Zeile über der Begrüßung kennt Tag und nächstes Training', () => {
  expect(heuteZeile(['mi', 'sa'], true)).toBe('Mittwoch, Trainingstag');
  expect(heuteZeile(['do'], true)).toBe('Mittwoch, morgen Training');
  expect(heuteZeile(['sa'], true)).toBe('Mittwoch, Training am Samstag');
  expect(heuteZeile(['mi'], false)).toBe('Mittwoch');
  expect(heuteZeile([], true)).toBe('Mittwoch');
});

test('Minuten in Worten, gerundet', () => {
  expect(minutenText(295)).toBe('fünf Minuten');
  expect(minutenText(40)).toBe('eine Minute');
  expect(minutenText(1000)).toBe('17 Minuten');
});

test('die Woche beginnt am Montag um null Uhr', () => {
  expect(new Date(wochenStart()).toString()).toBe(new Date(2026, 8, 21, 0, 0).toString());
});

test('Erinnerung als Text und wie oft', () => {
  expect(erinnerungText({ an: true, tage: ['mi', 'sa'], zeit: '17:00' })).toBe('Mi + Sa, 17:00');
  expect(erinnerungText({ an: false, tage: ['mi'], zeit: '17:00' })).toBe('Aus');
  expect(WIE_OFT[2]).toBe('Zweimal die Woche');
  expect(WIE_OFT[7]).toBe('Jeden Tag');
});
