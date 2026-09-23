/* Die vier Bereiche als Leiste unten. Oben steht auf jeder Seite das
   Logo und die eigene Ebene. */
import { Image, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { ebene } from '@/daten/katalog';
import { useZustand } from '@/daten/zustand';
import { TabPyramide, TabProfil, TabStart, TabTechnik } from '@/ui/Symbole';

function Kopfleiste() {
  const { f, dunkel } = useThema();
  const oben = useSafeAreaInsets().top;
  const konto = useZustand((z) => z.konto);
  const l = konto ? ebene(konto.ebene) : null;
  return (
    <View style={{ paddingTop: oben + 6, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: f.canvas,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Image source={dunkel ? require('../../../assets/img/wortmarke-weiss.png') : require('../../../assets/img/wortmarke-schwarz.png')}
        style={{ height: 22, width: 59 }} resizeMode="contain" accessibilityLabel="KM1 Training" />
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: f.surface, borderRadius: 99,
        paddingVertical: 7, paddingLeft: 11, paddingRight: 13 }, schwebt(f)]}
        accessibilityLabel={l ? `Deine Ebene: ${l.nm}` : 'Ohne Konto'}>
        <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: l ? f.lv[l.n - 1] : f.ink3 }} />
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12.5, color: f.ink2 }}>{l ? l.nm : 'Gast'}</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { f } = useThema();
  return (
    <Tabs screenOptions={{
      header: () => <Kopfleiste />,
      tabBarActiveTintColor: f.accentInk,
      tabBarInactiveTintColor: f.ink3,
      tabBarStyle: { backgroundColor: f.veil, borderTopColor: f.line },
      tabBarLabelStyle: { fontFamily: SCHRIFT.fett, fontSize: 11.5 },
      sceneStyle: { backgroundColor: f.canvas },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Start', tabBarIcon: ({ color }) => <TabStart farbe={color} /> }} />
      <Tabs.Screen name="technik" options={{ title: 'Technik', tabBarIcon: ({ color }) => <TabTechnik farbe={color} /> }} />
      <Tabs.Screen name="pyramide" options={{ title: 'Pyramide', tabBarIcon: ({ color }) => <TabPyramide farbe={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({ color }) => <TabProfil farbe={color} /> }} />
    </Tabs>
  );
}
