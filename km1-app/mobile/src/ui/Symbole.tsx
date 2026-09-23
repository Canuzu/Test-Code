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
