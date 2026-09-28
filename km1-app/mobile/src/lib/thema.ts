/* Das Designsystem der App, übernommen aus der App im Browser
   (app/index.html): der Aufbau von Apple mit dem Charakter von KM1.
   Dieselben Farben, dieselben Kontrastwerte: jede Schrift erreicht
   mindestens 4,5 : 1 gegen ihren Hintergrund, in beiden Fassungen. */
import { useColorScheme } from 'react-native';
import { useZustand } from '@/daten/zustand';

export type Farben = {
  canvas: string; canvas2: string; surface: string; surface2: string; surface3: string;
  field: string; veil: string; line: string; line2: string;
  ink: string; inkBody: string; ink2: string; ink3: string;
  accent: string; accent2: string; accentSoft: string; accentLine: string; accentInk: string;
  onAccent: string; onMedia: string; onLv: string;
  lv: [string, string, string, string];
  gruen: string; orange: string;
  diaBg: string; diaLine: string; diaDot: string;
  schatten: string;
};

const hell: Farben = {
  canvas: '#F1F4F0', canvas2: '#E6EBE7', surface: '#FFFFFF', surface2: '#F1F4F0', surface3: '#E7ECE8',
  field: '#FFFFFF', veil: 'rgba(241,244,240,0.94)', line: 'rgba(40,64,52,0.16)', line2: 'rgba(40,64,52,0.24)',
  ink: '#0B1511', inkBody: '#1E2A25', ink2: '#57655F', ink3: '#5F6E68',
  accent: '#C81E14', accent2: '#B3180F', accentSoft: 'rgba(200,30,20,0.08)', accentLine: 'rgba(200,30,20,0.3)',
  accentInk: '#C81E14', onAccent: '#FFFFFF', onMedia: '#F4F7F3', onLv: '#FFFFFF',
  lv: ['#0D7C75', '#3C8329', '#A9630A', '#C81E14'],
  gruen: '#248A3D', orange: '#B64400',
  diaBg: '#101E19', diaLine: 'rgba(242,245,241,0.4)', diaDot: 'rgba(242,245,241,0.9)',
  schatten: '#0A1E14',
};

const dunkel: Farben = {
  canvas: '#050907', canvas2: '#030605', surface: '#131B18', surface2: '#1E2824', surface3: '#26312C',
  field: '#0A1310', veil: 'rgba(5,9,7,0.94)', line: 'rgba(150,180,165,0.2)', line2: 'rgba(150,180,165,0.28)',
  ink: '#F2F5F1', inkBody: '#D5DFDA', ink2: '#9DAEA6', ink3: '#84968E',
  accent: '#D22A20', accent2: '#C81E14', accentSoft: 'rgba(255,90,79,0.13)', accentLine: 'rgba(255,90,79,0.4)',
  accentInk: '#FF5A4F', onAccent: '#FFFFFF', onMedia: '#F4F7F3', onLv: '#07100D',
  lv: ['#2FA8A0', '#5FB04A', '#E8952F', '#E24036'],
  gruen: '#30D158', orange: '#FF9F0A',
  diaBg: '#1B2A24', diaLine: 'rgba(242,245,241,0.4)', diaDot: 'rgba(242,245,241,0.9)',
  schatten: '#000000',
};

export function useThema() {
  const system = useColorScheme();
  const wahl = useZustand((z) => z.thema);
  const istDunkel = wahl === 'auto' ? system === 'dark' : wahl === 'dunkel';
  return { f: istDunkel ? dunkel : hell, dunkel: istDunkel };
}

/* Die drei Schriften. Anton nur für die großen Titel, Inter für alles
   Lesbare und für Zahlen, JetBrains Mono nur für die rote Zeile über dem
   Titel einer Seite. Jede Stärke ist ein eigener Schnitt, weil eigene
   Schriften in React Native kein fontWeight kennen. */
export const SCHRIFT = {
  display: 'Anton',
  text: 'Inter',
  mittel: 'Inter-Medium',
  fett: 'Inter-SemiBold',
  schwarz: 'Inter-Bold',
  mono: 'JetBrainsMono',
  monoMittel: 'JetBrainsMono-Medium',
  monoFett: 'JetBrainsMono-Bold',
} as const;

/* Zahlen stehen in festen Breiten, damit ein Zähler beim Wechseln nicht springt. */
export const ZAHL = { fontFamily: SCHRIFT.schwarz, fontVariant: ['tabular-nums' as const] };

export const SCHRIFTDATEIEN = {
  [SCHRIFT.display]: require('@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf'),
  [SCHRIFT.text]: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  [SCHRIFT.mittel]: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  [SCHRIFT.fett]: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  [SCHRIFT.schwarz]: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  [SCHRIFT.mono]: require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
  [SCHRIFT.monoMittel]: require('@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf'),
  [SCHRIFT.monoFett]: require('@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf'),
};

export const RADIUS = { gross: 26, karte: 20, bild: 14, knopf: 14, feld: 12, chip: 99, schild: 8 };

/* Die zwei Höhen der App: Inhalt schwebt leicht, Blätter und Hinweise
   deutlich. Im Dunkeln trägt die hellere Fläche statt des Schattens. */
export function schwebt(f: Farben, stark = false) {
  const dunkel = f.schatten === '#000000';
  return {
    shadowColor: f.schatten,
    shadowOpacity: dunkel && !stark ? 0 : stark ? 0.18 : 0.08,
    shadowRadius: stark ? 20 : 5,
    shadowOffset: { width: 0, height: stark ? 14 : 2 },
    elevation: dunkel && !stark ? 0 : stark ? 6 : 2,
  };
}
