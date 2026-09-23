/* Das Camp. Preis und Anmeldung trägt Can nach; bis dahin führt der
   Knopf auf die Website. */
import { Image, Linking, Text, View } from 'react-native';
import { SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { CAMP } from '@/daten/katalog';
import { Abschnitt, Fliess, Titel, Ueberzeile } from '@/ui/Schrift';
import { BILDER, HakenListe, Knopf, Seite } from '@/ui/Bausteine';

export default function Camp() {
  const { f } = useThema();
  return (
    <Seite>
      <Image source={BILDER.goal} style={{ marginHorizontal: -18, marginTop: -18, aspectRatio: 16 / 9 }} resizeMode="cover" />
      <View><Ueberzeile>Herbstferien</Ueberzeile><Titel>{'Herbstcamp\nKöln'}</Titel></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[CAMP.zeit, CAMP.alter, CAMP.uhr].map((t) => (
          <View key={t} style={[{ backgroundColor: f.surface, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }, schwebt(f)]}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{t}</Text>
          </View>
        ))}
      </View>
      <Fliess>{CAMP.text}</Fliess>
      <View style={{ gap: 14 }}><Abschnitt>Was dabei ist</Abschnitt><HakenListe zeilen={CAMP.dabei} /></View>
      <Knopf titel="Auf die Warteliste" onPress={() => Linking.openURL(CAMP.link)} />
    </Seite>
  );
}
