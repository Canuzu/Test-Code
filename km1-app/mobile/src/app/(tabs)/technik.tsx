/* Die Videothek: suchen, nach Ebene und Kategorie filtern. */
import { useMemo } from 'react';
import { ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { ebene, KAT, type Kategorie } from '@/daten/katalog';
import { setze, useZustand } from '@/daten/zustand';
import { ohneTrennung } from '@/lib/zeit';
import { Titel, Ueberzeile } from '@/ui/Schrift';
import { Chip, Druck, Knopf, Leer, Seite, VideoKarte } from '@/ui/Bausteine';
import { Runter, Suche } from '@/ui/Symbole';

export default function Technik() {
  const { f } = useThema();
  const katalog = useZustand((z) => z.katalog);
  const filter = useZustand((z) => z.filter);
  const breite = useWindowDimensions().width;
  // Unter 360 Pixeln eine Spalte, am Tablet und PC mehr.
  const spalten = breite < 360 ? 1 : breite >= 1000 ? 4 : breite >= 700 ? 3 : 2;

  const liste = useMemo(() => katalog.filter((v) => {
    if (filter.kat === 'profi') { if (v.zugang !== 'pro') return false; }
    else if (filter.kat !== 'alle' && v.kategorie !== filter.kat) return false;
    if (filter.ebene && v.ebene !== filter.ebene) return false;
    const q = filter.suche.trim().toLowerCase();
    if (q && !ohneTrennung(v.titel).toLowerCase().includes(q) && !KAT[v.kategorie].toLowerCase().includes(q)) return false;
    return true;
  }), [katalog, filter]);

  const setzeFilter = (teil: Partial<typeof filter>) => setze((z) => ({ filter: { ...z.filter, ...teil } }));
  const eb = filter.ebene ? ebene(filter.ebene) : null;
  const zeilen: typeof liste[] = [];
  for (let i = 0; i < liste.length; i += spalten) zeilen.push(liste.slice(i, i + spalten));
  const gefiltert = filter.kat !== 'alle' || !!filter.ebene || !!filter.suche;

  return (
    <Seite>
      <View>
        <Ueberzeile>Videothek</Ueberzeile>
        <Titel>Technik</Titel>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 46,
          backgroundColor: f.surface, borderRadius: RADIUS.knopf }, schwebt(f)]}>
          <Suche farbe={f.ink3} />
          <TextInput value={filter.suche} onChangeText={(t) => setzeFilter({ suche: t })}
            placeholder="Suchen …" placeholderTextColor={f.ink3} accessibilityLabel="Videos durchsuchen"
            returnKeyType="search" autoCorrect={false}
            style={{ flex: 1, fontFamily: SCHRIFT.mittel, fontSize: 15, color: f.ink, paddingVertical: 11 }} />
        </View>
        <Druck onPress={() => router.push('/ebene')} accessibilityRole="button"
          accessibilityLabel={`Ebene wählen, jetzt ${eb ? eb.nm : 'jede Ebene'}`}
          style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 46,
            backgroundColor: f.surface, borderRadius: RADIUS.knopf }, schwebt(f)]}>
          <View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: eb ? f.lv[eb.n - 1] : f.ink3 }} />
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13.5, color: f.ink }}>{eb ? eb.nm : 'Ebene'}</Text>
          <Runter farbe={f.ink3} />
        </Druck>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 4, gap: 8 }}>
        <Chip titel="Alle" an={filter.kat === 'alle'} onPress={() => setzeFilter({ kat: 'alle' })} />
        <Chip titel="Profi-Einheiten" an={filter.kat === 'profi'} onPress={() => setzeFilter({ kat: 'profi' })} />
        {(Object.keys(KAT) as Kategorie[]).map((k) => (
          <Chip key={k} titel={KAT[k]} an={filter.kat === k} onPress={() => setzeFilter({ kat: k })} />
        ))}
      </ScrollView>

      {liste.length ? (
        <View style={{ gap: 12 }}>
          {zeilen.map((z, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              {z.map((v) => <VideoKarte key={v.slug} v={v} />)}
              {Array.from({ length: spalten - z.length }, (_, j) => <View key={'x' + j} style={{ flex: 1 }} />)}
            </View>
          ))}
        </View>
      ) : (
        <Leer symbol={<Suche farbe={f.ink3} groesse={34} />} text="Dazu haben wir noch nichts.">
          {gefiltert && <Knopf titel="Filter zurücksetzen" art="geist" onPress={() => setzeFilter({ kat: 'alle', ebene: 0, suche: '' })} />}
        </Leer>
      )}
    </Seite>
  );
}
