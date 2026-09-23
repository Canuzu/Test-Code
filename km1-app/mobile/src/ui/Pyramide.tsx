/* Die KM1-Pyramide. Jede Ebene füllt sich von unten, so weit ihr Pfad
   abgehakt ist. Die eigene Ebene hat eine volle Linie, die nächste eine
   gestrichelte. Dieselbe Geometrie wie im Prototyp.

   Getippt wird nicht auf das SVG, sondern auf vier unsichtbare Flächen
   darüber. Im Browser wird aus einer antippbaren SVG-Gruppe sonst ein
   <button> mitten in der Zeichnung, und die Pyramide verschwindet. */
import { Pressable, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { EBENEN } from '@/daten/katalog';
import { SCHRIFT, useThema } from '@/lib/thema';

const GEO = [
  { n: 4, y0: 0.78, y1: 17.94, x0a: 33.67, x1a: 66.33, x0b: 26.41, x1b: 73.59 },
  { n: 3, y0: 19.89, y1: 37.05, x0a: 25.58, x1a: 74.42, x0b: 18.32, x1b: 81.68 },
  { n: 2, y0: 39.0, y1: 56.16, x0a: 17.5, x1a: 82.5, x0b: 10.24, x1b: 89.76 },
  { n: 1, y0: 58.11, y1: 75.27, x0a: 9.41, x1a: 90.59, x0b: 2.16, x1b: 97.84 },
];

export function Pyramide({ gewaehlt, meine, fortschritt, onWaehlen }: {
  gewaehlt: number;
  meine: number | null;                                  // null ohne Konto
  fortschritt: (n: number) => { fertig: number; gesamt: number };
  onWaehlen: (n: number) => void;
}) {
  const { f } = useThema();
  return (
    <View style={{ width: '100%', aspectRatio: 100 / 78, maxWidth: 660, alignSelf: 'center' }}>
    <Svg viewBox="0 0 100 78" width="100%" height="100%" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        {GEO.map((g) => (
          <ClipPath key={g.n} id={`cp${g.n}`}>
            <Polygon points={`${g.x0a},${g.y0} ${g.x1a},${g.y0} ${g.x1b},${g.y1} ${g.x0b},${g.y1}`} />
          </ClipPath>
        ))}
      </Defs>
      <Path d="M33.3 0.4L1.8 76.2M66.7 0.4L98.2 76.2M1.8 76.2h96.4" fill="none" stroke={f.line2} strokeWidth={0.45} strokeLinecap="round" />
      {GEO.map((g) => {
        const l = EBENEN[g.n - 1], farbe = f.lv[g.n - 1];
        const an = gewaehlt === g.n, mein = meine === g.n, naechste = meine !== null && meine + 1 === g.n;
        const pts = `${g.x0a},${g.y0} ${g.x1a},${g.y0} ${g.x1b},${g.y1} ${g.x0b},${g.y1}`;
        const my = g.y0 + (g.y1 - g.y0) / 2;
        const fz = fortschritt(g.n), q = meine !== null && fz.gesamt ? fz.fertig / fz.gesamt : 0;
        const hoehe = (g.y1 - g.y0) * q;
        return (
          <G key={g.n}>
            <Polygon points={pts} fill={farbe} fillOpacity={an ? 0.16 : 0.07} />
            {q > 0 && (
              <G clipPath={`url(#cp${g.n})`}>
                <Rect x={0} y={g.y1 - hoehe} width={100} height={hoehe} fill={farbe} fillOpacity={0.42} />
              </G>
            )}
            <Polygon points={pts} fill="none" stroke={farbe}
              strokeOpacity={mein ? 1 : an ? 0.85 : naechste ? 0.5 : 0.3}
              strokeWidth={mein || an ? 0.75 : 0.4}
              strokeDasharray={naechste && !an ? '2.2 1.8' : undefined} />
            <SvgText x={50} y={meine !== null ? my - 1.1 : my + 0.4} fontFamily={SCHRIFT.display} fontSize={4.6}
              fill={f.ink} textAnchor="middle">{l.nm.toUpperCase()}</SvgText>
            <SvgText x={50} y={meine !== null ? my + 2.9 : my + 4.6} fontFamily={SCHRIFT.fett} fontSize={2.9}
              fill={f.ink2} textAnchor="middle">{l.ag}</SvgText>
            {meine !== null && (
              <SvgText x={50} y={my + 6.7} fontFamily={SCHRIFT.monoFett} fontSize={2.6} fill={f.ink3}
                textAnchor="middle" letterSpacing={0.2}>{`${fz.fertig} / ${fz.gesamt}`}</SvgText>
            )}
          </G>
        );
      })}
    </Svg>
    {GEO.map((g) => {
      const l = EBENEN[g.n - 1], fz = fortschritt(g.n);
      return (
        <Pressable key={g.n} onPress={() => onWaehlen(g.n)} accessibilityRole="button"
          accessibilityState={{ selected: gewaehlt === g.n }}
          accessibilityLabel={`${l.nm}, ${l.ag}${meine !== null ? `, ${fz.fertig} von ${fz.gesamt} Einheiten` : ''}`}
          style={{ position: 'absolute', left: `${g.x0b}%`, width: `${g.x1b - g.x0b}%`,
            top: `${(g.y0 / 78) * 100}%`, height: `${((g.y1 - g.y0) / 78) * 100}%` }} />
      );
    })}
    </View>
  );
}
