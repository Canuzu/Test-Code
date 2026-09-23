/* Das Designsystem der App, übernommen aus dem Prototyp (app/index.html).
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
  diaBg: string; diaLine: string; diaDot: string;
  schatten: string;
};

const hell: Farben = {
  canvas: '#EEF2ED', canvas2: '#E4EAE2', surface: '#FFFFFF', surface2: '#F7FAF6', surface3: '#EBF0E9',
  field: '#FFFFFF', veil: 'rgba(247,250,246,0.94)', line: 'rgba(10,20,17,0.08)', line2: 'rgba(10,20,17,0.15)',
  ink: '#0A1411', inkBody: '#2E3E37', ink2: '#53645D', ink3: '#5F6E68',
  accent: '#C81E14', accent2: '#A5150D', accentSoft: 'rgba(200,30,20,0.09)', accentLine: 'rgba(200,30,20,0.3)',
  accentInk: '#C81E14', onAccent: '#FFFFFF', onMedia: '#F4F7F3', onLv: '#FFFFFF',
  lv: ['#0D7C75', '#3C8329', '#A9630A', '#C81E14'],
  diaBg: '#101E19', diaLine: 'rgba(242,245,241,0.4)', diaDot: 'rgba(242,245,241,0.9)',
  schatten: '#0A1411',
};

const dunkel: Farben = {
  canvas: '#070D0B', canvas2: '#030706', surface: '#1E2E28', surface2: '#253830', surface3: '#2C4139',
  field: '#0A1310', veil: 'rgba(16,28,24,0.96)', line: 'rgba(242,245,241,0.13)', line2: 'rgba(242,245,241,0.2)',
  ink: '#F2F5F1', inkBody: '#C2D1CA', ink2: '#94A79E', ink3: '#84968E',
  accent: '#DE2F25', accent2: '#C81E14', accentSoft: 'rgba(224,52,42,0.14)', accentLine: 'rgba(224,52,42,0.4)',
  accentInk: '#FF5A4F', onAccent: '#FFFFFF', onMedia: '#F4F7F3', onLv: '#07100D',
  lv: ['#2FA8A0', '#5FB04A', '#E8952F', '#E24036'],
  diaBg: '#1B2A24', diaLine: 'rgba(242,245,241,0.4)', diaDot: 'rgba(242,245,241,0.9)',
  schatten: '#000000',
};

export function useThema() {
  const system = useColorScheme();
  const wahl = useZustand((z) => z.thema);
  const istDunkel = wahl === 'auto' ? system === 'dark' : wahl === 'dunkel';
  return { f: istDunkel ? dunkel : hell, dunkel: istDunkel };
}

/* Die drei Schriften. Anton für Überschriften in Versalien, Chivo für
   alles Lesbare, JetBrains Mono nur für Zahlen und die Zeile über jeder
   Überschrift. Jede Stärke ist ein eigener Schnitt, weil eigene Schriften
   in React Native kein fontWeight kennen. */
export const SCHRIFT = {
  display: 'Anton',
  text: 'Chivo',
  mittel: 'Chivo-Medium',
  fett: 'Chivo-Bold',
  schwarz: 'Chivo-Black',
  mono: 'JetBrainsMono',
  monoMittel: 'JetBrainsMono-Medium',
  monoFett: 'JetBrainsMono-Bold',
} as const;

export const SCHRIFTDATEIEN = {
  [SCHRIFT.display]: require('@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf'),
  [SCHRIFT.text]: require('@expo-google-fonts/chivo/400Regular/Chivo_400Regular.ttf'),
  [SCHRIFT.mittel]: require('@expo-google-fonts/chivo/500Medium/Chivo_500Medium.ttf'),
  [SCHRIFT.fett]: require('@expo-google-fonts/chivo/700Bold/Chivo_700Bold.ttf'),
  [SCHRIFT.schwarz]: require('@expo-google-fonts/chivo/900Black/Chivo_900Black.ttf'),
  [SCHRIFT.mono]: require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
  [SCHRIFT.monoMittel]: require('@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf'),
  [SCHRIFT.monoFett]: require('@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf'),
};

export const RADIUS = { karte: 18, bild: 14, knopf: 14, chip: 11, schild: 8 };

/* Die zwei Höhen aus dem Prototyp: Inhalt schwebt, Listen liegen flach. */
export function schwebt(f: Farben, stark = false) {
  return {
    shadowColor: f.schatten,
    shadowOpacity: stark ? 0.18 : 0.08,
    shadowRadius: stark ? 16 : 6,
    shadowOffset: { width: 0, height: stark ? 10 : 3 },
    elevation: stark ? 6 : 2,
  };
}
