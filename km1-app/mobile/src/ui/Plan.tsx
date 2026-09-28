/* Die Trainingspläne als Reihe von Karten, oben in Technik und im Profil. */
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, useThema } from '@/lib/thema';
import { ebene } from '@/daten/katalog';
import { PLAENE, planStand, type Plan } from '@/daten/plaene';
import { useZustand } from '@/daten/zustand';
import { BlockKopf } from './Reihe';

export function PlanKarte({ plan }: { plan: Plan }) {
  const { f } = useThema();
  const s = useZustand((z) => z);
  const an = s.plan?.id === plan.id, st = an ? planStand(s) : null;
  const farbe = f.lv[plan.ebene - 1];
  const zeile = st
    ? `Woche ${st.woche + 1} von ${plan.wochen.length} · ${st.fertig} von ${st.gesamt}`
    : `${plan.wochen.length} Wochen · 3 × pro Woche · ${plan.fuer}`;
  return (
    <Pressable onPress={() => router.push(`/plan/${plan.id}`)} accessibilityRole="button"
      accessibilityLabel={`${plan.titel}, ${ebene(plan.ebene).nm}${an ? ', läuft' : ''}. ${zeile}`}
      style={({ pressed }) => [{ width: 230, minHeight: 150, borderRadius: RADIUS.karte, padding: 16, gap: 8,
        backgroundColor: farbe }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.94 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.onLv, opacity: 0.9 }}>{ebene(plan.ebene).nm}</Text>
        {an ? (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12, color: '#0B1511' }}>Läuft</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ flex: 1, fontFamily: SCHRIFT.display, fontSize: 24, lineHeight: 25, color: f.onLv }}>{plan.titel.toUpperCase()}</Text>
      <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 13, lineHeight: 17, color: f.onLv, opacity: 0.92 }}>{zeile}</Text>
    </Pressable>
  );
}

export function PlanReihe() {
  return (
    <View style={{ gap: 14 }}>
      <BlockKopf titel="Trainingspläne" angabe="6 Wochen" />
      <FlatList horizontal data={PLAENE} keyExtractor={(p) => p.id} showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 12 }}
        renderItem={({ item }) => <PlanKarte plan={item} />} />
    </View>
  );
}
