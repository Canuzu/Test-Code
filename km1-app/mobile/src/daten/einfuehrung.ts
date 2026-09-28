/* Der erste Start: drei kurze Fragen, dann weiß die App, für wen sie da
   ist. Wer man ist, welcher Jahrgang, wann trainiert wird. Alles lässt
   sich überspringen, und nichts davon verlässt das Gerät, bis ein Konto
   angelegt wird. Dieselben Regeln wie in der App im Browser. */
import type { Rolle } from './zustand';

export type ErstSchritt = 'rolle' | 'jahrgang' | 'zeit' | 'fertig';

/* Wer selbst trainiert oder ein Kind hat, beantwortet alle drei Fragen.
   Trainer nur die Zeit, alle anderen keine. */
export function erstSchritte(r: Rolle | null): ErstSchritt[] {
  if (r === 'spieler' || r === 'eltern') return ['rolle', 'jahrgang', 'zeit', 'fertig'];
  if (r === 'trainer') return ['rolle', 'zeit', 'fertig'];
  return ['rolle', 'fertig'];
}

/* Welche Ebene zum Alter passt: bis zur U13 Foundational, bis zur U15
   Development, darüber Performance. */
export function ebeneFuerJahrgang(jahrgang: number, jahr = new Date().getFullYear()) {
  const alter = jahr - jahrgang;
  return alter <= 12 ? 1 : alter <= 14 ? 2 : 3;
}

/* Die Jahrgänge zur Auswahl: sechs bis neunzehn Jahre alt. */
export function erstJahrgaenge(jahr = new Date().getFullYear()) {
  const j: number[] = [];
  for (let x = jahr - 6; x >= jahr - 19; x--) j.push(x);
  return j;
}

export const ERST_ZEITEN = ['16:00', '17:00', '18:00', '19:00'];

/* Die Rollen, die man selbst wählen kann. KM1 vergibt nur KM1. */
export const ROLLEN: { r: Rolle; nm: string; satz: string; farbe: string; pruef?: boolean }[] = [
  { r: 'spieler', nm: 'Spieler', satz: 'Ich trainiere selbst.', farbe: '#FF9500' },
  { r: 'eltern', nm: 'Eltern', satz: 'Mein Kind trainiert, ich behalte den Überblick.', farbe: '#34C759' },
  { r: 'trainer', nm: 'Trainer', satz: 'Ich trainiere eine Mannschaft.', farbe: '#0D7C75', pruef: true },
  { r: 'akademie', nm: 'Akademie', satz: 'Wir sind eine Fußballschule oder ein Nachwuchszentrum.', farbe: '#AF52DE', pruef: true },
  { r: 'verein', nm: 'Verein', satz: 'Wir sind ein Profiverein, etwa aus der Bundesliga.', farbe: '#34495E', pruef: true },
  { r: 'profi', nm: 'Profi', satz: 'Ich spiele im Profifußball.', farbe: '#D39B00', pruef: true },
  { r: 'scout', nm: 'Scout', satz: 'Ich sichte Talente für einen Verein.', farbe: '#5856D6', pruef: true },
];
export const rollenName = (r: Rolle) => r === 'km1' ? 'KM1' : ROLLEN.find((x) => x.r === r)?.nm ?? r;
