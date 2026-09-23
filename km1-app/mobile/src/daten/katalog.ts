/* Was die App über Fußball weiß: Ebenen, Kategorien, Challenges und die
   Videos. Die Videos kommen vom Server; ohne Server aus katalog.json,
   das supabase/werkzeug/startdaten.mjs aus dem Prototyp erzeugt. */
import { Platform } from 'react-native';
import roh from './katalog.json';

export type Zugang = 'offen' | 'konto' | 'pro';
export type Kategorie = 'dribbling' | 'passen' | 'flanken' | 'schuss' | 'annahme' | 'athletik' | 'torwart' | 'taktik';
export type Schritt = { nr: number; text: string; sekunde: number | null };
export type Video = {
  id?: string;               // die ID in der Datenbank; ohne Server leer
  slug: string;
  titel: string;
  beschreibung: string;
  fehler: string;
  kategorie: Kategorie;
  ebene: number;
  woche: number | null;
  dauer_sek: number;
  zugang: Zugang;
  gast: string | null;
  neu: boolean;
  bild: string | null;
  pfad: string | null;
  reihenfolge: number;
  schritte: Schritt[];       // leer, wenn der Server sie nicht herausgibt
};

export const VORSCHAU_KATALOG = roh as Video[];

export const EBENEN = [
  { n: 1, nm: 'Foundational', md: 'Gruppentraining', ag: 'U6 bis U13',
    tx: 'Grundlagen, Teamgeist und die Begeisterung für Fußball.' },
  { n: 2, nm: 'Development', md: 'Fördertraining', ag: 'U8 bis U15',
    tx: 'Gezielte Weiterentwicklung, vorbereitet auf höhere Leistungsniveaus.' },
  { n: 3, nm: 'Performance', md: 'Individualtraining', ag: 'U17 und U19',
    tx: 'Fortgeschrittene Fähigkeiten und taktisches Bewusstsein für den Wettkampf auf Profiniveau.' },
  { n: 4, nm: 'Professional', md: 'Individualtraining', ag: 'Profis',
    tx: 'Leistung, taktisches Verständnis und Fitness für nationale und internationale Profispieler.' },
] as const;
export const ebene = (n: number) => EBENEN[Math.min(Math.max(n, 1), 4) - 1];

export const KAT: Record<Kategorie, string> = {
  dribbling: 'Dribbling', passen: 'Passen', flanken: 'Flanken', schuss: 'Torschuss',
  annahme: 'Ballannahme', athletik: 'Athletik', torwart: 'Torwart', taktik: 'Taktik',
};

/* Schlag den Coach. Das Ziel ist Kaders Marke, nicht eine feste Zahl. */
export const CHALLENGES = [
  { id: 'challenge-September', m: 'September', t: 'Übersteiger in 60 Sekunden', marke: 43, eh: 'Übersteiger',
    be: 'Eine Minute, ein Ball, so viele saubere Übersteiger wie möglich. Kader hat es an einem Dienstagabend auf 43 gebracht. Wer 44 schafft, hat ihn geschlagen.',
    rg: ['Der Ball bleibt im Kreis, sonst zählt der Durchgang nicht.', 'Nur Übersteiger mit Richtungswechsel zählen.', 'Wer stehen bleibt, fängt die Zählung von vorn an.'] },
  { id: 'challenge-August', m: 'August', t: 'Jonglieren ohne Bodenkontakt', marke: 78, eh: 'Kontakte', be: '', rg: [] },
  { id: 'challenge-Juli', m: 'Juli', t: 'Torwand: fünf Schüsse', marke: 4, eh: 'Treffer', be: '', rg: [] },
];

/* Warum eine Kategorie zählt, in Worten für Eltern. */
export const WARUM: Record<Kategorie, string> = {
  annahme: 'Wer den Ball sauber mitnimmt, hat im Spiel eine halbe Sekunde mehr Zeit. Diese halbe Sekunde ist der Unterschied zwischen abspielen und verlieren.',
  passen: 'Ein fester, flacher Pass ist die Grundlage jedes Zusammenspiels. Wer ihn sicher spielt, wird im Team öfter angespielt.',
  dribbling: 'Wer den Ball eng führt und im richtigen Moment das Tempo wechselt, löst Situationen allein, wenn kein Mitspieler frei ist.',
  flanken: 'Eine Flanke, die ankommt, macht aus einem Angriff über außen eine Torchance. Es kommt auf Genauigkeit an, nicht auf Kraft.',
  schuss: 'Tore entstehen aus sauberer Technik, nicht aus Kraft. Wer den Ball flach und genau trifft, trifft öfter.',
  athletik: 'Schnelle Füße und eine stabile Körpermitte schützen vor Verletzungen und machen jede Technik im Spiel erst möglich.',
  torwart: 'Beim Torwart entscheidet die Grundstellung über fast jeden Ball. Wer sie sicher beherrscht, kommt schneller in die Ecke.',
  taktik: 'Wer versteht, wohin er laufen muss, spart Kraft und hilft der ganzen Mannschaft.',
};

/* Wo gekauft wird. Auf dem iPhone über die Apple-ID, auf Android über
   Google Play, im Browser werden beide Wege genannt. */
export const KAUF = Platform.select({
  ios: { laden: 'den App Store', konto: 'deine Apple-ID', kontoSie: 'Ihre Apple-ID',
         kuendigen: 'in den Einstellungen deiner Apple-ID',
         sperre: 'Mit der Kaufanfrage in der Familienfreigabe von Apple' },
  android: { laden: 'Google Play', konto: 'dein Google-Konto', kontoSie: 'Ihr Google-Konto',
             kuendigen: 'in Google Play unter Abos', sperre: 'Mit Google Family Link' },
  default: { laden: 'den App Store oder Google Play', konto: 'deine Apple-ID oder dein Google-Konto',
             kontoSie: 'Ihre Apple-ID oder Ihr Google-Konto',
             kuendigen: 'in den Einstellungen deiner Apple-ID oder in Google Play',
             sperre: 'Mit der Familienfreigabe von Apple oder Google Family Link' },
})!;

export const PREIS = { monat: '6,99 €', jahr: '59,00 €', jahrProMonat: '4,92 €' };
export const preisText = (p: 'monat' | 'jahr') => p === 'monat' ? '6,99 € im Monat' : '59,00 € im Jahr';

/* Die Fassung der Einwilligungserklärung für Eltern. Ändert sich der
   Text, ändert sich die Fassung, und die Datenbank weiß, wem welcher
   Text vorlag. */
export const EINWILLIGUNG_FASSUNG = '2026-09';

export const CAMP = {
  titel: 'Herbstcamp Köln', zeit: 'Mo 19. bis Fr 23. Oktober', alter: 'U8 bis U15', uhr: '9 bis 16 Uhr',
  kurz: 'Montag bis Freitag, 19. bis 23. Oktober, in den Herbstferien.',
  text: 'Fünf Tage am Stück auf dem Platz. Vormittags Technik in kleinen Gruppen, nachmittags Spielformen, am letzten Tag ein Turnier mit allen Eltern an der Linie.',
  dabei: ['Training in Gruppen von höchstens zehn Kindern', 'Mittagessen und Getränke an allen fünf Tagen',
          'Ein KM1-Trikot, das bleibt', 'Abschlussturnier am Freitag mit Urkunde'],
  link: 'https://km1-training.de',
};

export const LINKS = {
  datenschutz: 'https://km1-training.de/datenschutz/',
  impressum: 'https://km1-training.de/impressum/',
  appleLizenz: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
};
