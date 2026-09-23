/* Die Ebenenwahl der Videothek, als kleines Blatt von unten. */
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { EBENEN } from '@/daten/katalog';
import { setze, useZustand } from '@/daten/zustand';
import { Druck, Seite } from '@/ui/Bausteine';
import { Titel } from '@/ui/Schrift';
import { Haken } from '@/ui/Symbole';

export default function EbeneWaehlen() {
  const { f } = useThema();
  const gewaehlt = useZustand((z) => z.filter.ebene);
  const waehle = (n: number) => { setze((z) => ({ filter: { ...z.filter, ebene: n } })); router.back(); };
  const zeile = (n: number, text: string, farbe: string | null) => (
    <Druck key={n} onPress={() => waehle(n)} accessibilityRole="button" accessibilityState={{ selected: gewaehlt === n }}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16,
        borderRadius: RADIUS.bild, backgroundColor: f.surface }, schwebt(f),
        gewaehlt === n && { borderWidth: 1.5, borderColor: farbe ?? f.accent }]}>
      <View style={{ width: 11, height: 11, borderRadius: 99, backgroundColor: farbe ?? f.ink3 }} />
      <Text style={{ flex: 1, fontFamily: SCHRIFT.fett, fontSize: 15.5, color: f.ink }}>{text}</Text>
      {gewaehlt === n && <Haken farbe={f.accentInk} />}
    </Druck>
  );
  return (
    <Seite>
      <Titel>Welche Ebene?</Titel>
      <View style={{ gap: 8 }}>
        {zeile(0, 'Jede Ebene', null)}
        {EBENEN.map((l) => zeile(l.n, `${l.nm} · ${l.ag}`, f.lv[l.n - 1]))}
      </View>
    </Seite>
  );
}
