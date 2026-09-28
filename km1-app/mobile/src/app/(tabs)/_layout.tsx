/* Die Bereiche als Leiste unten: Start, Üben, Profil. Oben steht auf
   jeder Seite das Logo und die eigene Ebene; sie öffnet den Weg durch die
   Pyramide, der deshalb keinen eigenen Bereich mehr braucht. */
import { Image, Pressable, Text, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { ebene } from '@/daten/katalog';
import { meineEbene } from '@/daten/einfuehrung';
import { useZustand } from '@/daten/zustand';
import { TabProfil, TabStart, TabTechnik } from '@/ui/Symbole';

function Kopfleiste() {
  const { f, dunkel } = useThema();
  const oben = useSafeAreaInsets().top;
  const s = useZustand((z) => z);
  const l = ebene(meineEbene(s));
  return (
    <View style={{ paddingTop: oben + 6, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: f.canvas,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Image source={dunkel ? require('../../../assets/img/wortmarke-weiss.png') : require('../../../assets/img/wortmarke-schwarz.png')}
        style={{ height: 22, width: 59 }} resizeMode="contain" accessibilityLabel="KM1 Training" />
      <Pressable onPress={() => router.push('/weg')} hitSlop={6} accessibilityRole="button"
        accessibilityLabel={`Dein Weg, Ebene ${l.nm}`}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: f.surface, borderRadius: 99,
          paddingVertical: 7, paddingLeft: 11, paddingRight: 13 }, schwebt(f), pressed && { opacity: 0.7 }]}>
        <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: f.lv[l.n - 1] }} />
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12.5, color: f.ink2 }}>{l.nm}</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const { f } = useThema();
  // Etwas höher als die Vorgabe, sonst schneidet die Leiste die Namen unten ab.
  const unten = useSafeAreaInsets().bottom;
  return (
    <Tabs screenOptions={{
      header: () => <Kopfleiste />,
      tabBarActiveTintColor: f.accentInk,
      tabBarInactiveTintColor: f.ink3,
      tabBarStyle: { backgroundColor: f.veil, borderTopColor: f.line, height: 56 + unten, paddingTop: 4 },
      tabBarLabelStyle: { fontFamily: SCHRIFT.mittel, fontSize: 11, lineHeight: 14 },
      sceneStyle: { backgroundColor: f.canvas },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Start', tabBarIcon: ({ color }) => <TabStart farbe={color} /> }} />
      <Tabs.Screen name="technik" options={{ title: 'Üben', tabBarIcon: ({ color }) => <TabTechnik farbe={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({ color }) => <TabProfil farbe={color} /> }} />
    </Tabs>
  );
}
