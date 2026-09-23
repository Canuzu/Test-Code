/* Der Aufstieg bekommt den ganzen Bildschirm. Er passiert dreimal im
   Leben eines Nutzers. */
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { SCHRIFT, useThema } from '@/lib/thema';
import { ebene } from '@/daten/katalog';
import { useZustand } from '@/daten/zustand';
import { Fliess, Titel, Ueberzeile } from '@/ui/Schrift';
import { Knopf } from '@/ui/Bausteine';
import { Haken } from '@/ui/Symbole';

export default function Aufstieg() {
  const { f } = useThema();
  const konto = useZustand((z) => z.konto);
  const l = ebene(konto?.ebene ?? 1), farbe = f.lv[l.n - 1];
  return (
    <View style={{ flex: 1, backgroundColor: f.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}>
      <View style={{ width: 96, height: 96, borderRadius: 99, backgroundColor: farbe, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Haken farbe={f.onLv} groesse={38} dicke={2.6} />
      </View>
      <Ueberzeile mitte>Neue Ebene</Ueberzeile>
      <Titel style={{ textAlign: 'center' }}>{l.nm}</Titel>
      <Fliess style={{ textAlign: 'center', maxWidth: 420 }}>{l.tx}</Fliess>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{`${l.md} · ${l.ag}`}</Text>
      <Knopf titel="Weiter" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 8, maxWidth: 420, width: '100%' }} />
    </View>
  );
}
