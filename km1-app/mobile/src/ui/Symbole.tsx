/* Die Symbole aus dem Prototyp als SVG. Strichstärke und Form wie dort. */
import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { farbe: ColorValue; groesse?: number; dicke?: number; gefuellt?: boolean };

const linie = (farbe: ColorValue, dicke = 2) =>
  ({ fill: 'none', stroke: farbe, strokeWidth: dicke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Play = ({ farbe, groesse = 20 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24"><Path d="M8 5l12 7-12 7z" fill={farbe} /></Svg>
);
export const Schloss = ({ farbe, groesse = 20, dicke = 1.9 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Rect x="5" y="11" width="14" height="9" rx="1.5" {...linie(farbe, dicke)} />
    <Path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" {...linie(farbe, dicke)} />
  </Svg>
);
export const Haken = ({ farbe, groesse = 18, dicke = 2.4 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24"><Path d="M5 12.5l4.5 4.5L19 7" {...linie(farbe, dicke)} /></Svg>
);
export const Zurueck = ({ farbe, groesse = 17 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24"><Path d="M14 6l-6 6 6 6" {...linie(farbe, 2.4)} /></Svg>
);
export const Weiter = ({ farbe, groesse = 14 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24"><Path d="M10 6l6 6-6 6" {...linie(farbe, 2.6)} /></Svg>
);
export const Suche = ({ farbe, groesse = 18 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Circle cx="11" cy="11" r="6.5" {...linie(farbe)} /><Path d="M16 16l4.5 4.5" {...linie(farbe)} />
  </Svg>
);
export const Runter = ({ farbe, groesse = 13 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24"><Path d="M6 9l6 6 6-6" {...linie(farbe, 2.4)} /></Svg>
);
export const Herz = ({ farbe, groesse = 23, gefuellt }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Path d="M12 20.4 4.7 13.1a4.7 4.7 0 0 1 6.6-6.7l.7.7.7-.7a4.7 4.7 0 0 1 6.6 6.7z"
      {...linie(farbe)} fill={gefuellt ? farbe : 'none'} />
  </Svg>
);
export const Person = ({ farbe, groesse = 26 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Circle cx="12" cy="8.5" r="3.8" {...linie(farbe, 1.8)} /><Path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" {...linie(farbe, 1.8)} />
  </Svg>
);
export const Apple = ({ farbe, groesse = 19 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Path fill={farbe} d="M16.3 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.6-1.9-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.8-1.7 0-3.2 1-4 2.5-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.4-.9-2.4-3.6z" />
    <Path fill={farbe} d="M14.2 5.4c.7-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
  </Svg>
);
export const Google = ({ groesse = 19 }: { groesse?: number }) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
    <Path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <Path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
    <Path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </Svg>
);

export const TabStart = ({ farbe, groesse = 23 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="8.5" {...linie(farbe, 1.8)} /><Path d="M12 3.5l3.2 5.3-3.2 2.6-3.2-2.6z" {...linie(farbe, 1.8)} />
    <Path d="M8.8 11.4L7 17.2M15.2 11.4L17 17.2" {...linie(farbe, 1.8)} />
  </Svg>
);
export const TabTechnik = ({ farbe, groesse = 23 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Rect x="3" y="5" width="18" height="14" {...linie(farbe, 1.8)} /><Path d="M10 9.5l5 2.5-5 2.5z" {...linie(farbe, 1.8)} />
  </Svg>
);
export const TabPyramide = ({ farbe, groesse = 23 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Path d="M12 3.5L21 20H3z" {...linie(farbe, 1.8)} /><Path d="M8.2 13h7.6M6.2 16.5h11.6" {...linie(farbe, 1.8)} />
  </Svg>
);
export const TabProfil = Person;

/* Das Zahnrad oben rechts im Profil. Dahinter liegt alles, was man
   einstellt statt benutzt. */
export const Zahnrad = ({ farbe, groesse = 22 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Path fill={farbe} fillRule="evenodd" stroke={farbe} strokeWidth={1.2} strokeLinejoin="round"
      d="M19.63 9.59 L22.06 9.79 L22.06 14.21 L19.63 14.41 L19.10 15.69 L20.67 17.55 L17.55 20.67 L15.69 19.10 L14.41 19.63 L14.21 22.06 L9.79 22.06 L9.59 19.63 L8.31 19.10 L6.45 20.67 L3.33 17.55 L4.90 15.69 L4.37 14.41 L1.94 14.21 L1.94 9.79 L4.37 9.59 L4.90 8.31 L3.33 6.45 L6.45 3.33 L8.31 4.90 L9.59 4.37 L9.79 1.94 L14.21 1.94 L14.41 4.37 L15.69 4.90 L17.55 3.33 L20.67 6.45 L19.10 8.31Z M8.60 12a3.40 3.40 0 1 0 6.80 0a3.40 3.40 0 1 0 -6.80 0Z" />
  </Svg>
);
export const Kamera = ({ farbe, groesse = 20 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Rect x="2.5" y="6.5" width="13" height="11" rx="2.2" {...linie(farbe, 1.9)} />
    <Path d="M15.5 10.5l6-3.2v9.4l-6-3.2" {...linie(farbe, 1.9)} />
  </Svg>
);
export const Kalender = ({ farbe, groesse = 20 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Rect x="3.5" y="5" width="17" height="15" rx="2.2" {...linie(farbe, 1.9)} />
    <Path d="M3.5 10h17M8 3v4M16 3v4" {...linie(farbe, 1.9)} />
  </Svg>
);
export const Pause = ({ farbe, groesse = 20 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Rect x="6" y="4.5" width="4.3" height="15" rx="1.3" fill={farbe} /><Rect x="13.7" y="4.5" width="4.3" height="15" rx="1.3" fill={farbe} />
  </Svg>
);
export const OhneNetz = ({ farbe, groesse = 18 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
    <Path d="M2.5 8.8a14 14 0 0 1 19 0M5.8 12.3a9.2 9.2 0 0 1 12.4 0M9.2 15.8a4.4 4.4 0 0 1 5.6 0" {...linie(farbe, 2)} />
    <Circle cx="12" cy="19.2" r="1.2" fill={farbe} /><Path d="M4 3.5l16 17" {...linie(farbe, 2)} />
  </Svg>
);
export const Plus = ({ farbe, groesse = 18 }: P) => (
  <Svg width={groesse} height={groesse} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" {...linie(farbe, 2.2)} /></Svg>
);
