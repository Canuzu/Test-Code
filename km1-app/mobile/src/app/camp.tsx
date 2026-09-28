/* Das Camp. Gebucht wird direkt in der App, bezahlt direkt bei KM1 und
   nicht über den App Store. Buchen kann nur ein Erwachsener; Kinder
   fragen ihre Eltern. */
import { useEffect, useState } from 'react';
import { Image, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SCHRIFT, useThema } from '@/lib/thema';
import { CAMP } from '@/daten/katalog';
import { CAMP_DATEN, euro } from '@/daten/camp';
import { setze, useZustand } from '@/daten/zustand';
import { campPlaetzeFrei, darfCampBuchen } from '@/daten/aktionen';
import { haptik } from '@/lib/haptik';
import { Abschnitt, Fliess, Leise, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { BILDER, HakenListe, Knopf, Panel, Seite } from '@/ui/Bausteine';
import { Haken } from '@/ui/Symbole';

function Pille({ text, farbe }: { text: string; farbe: string }) {
  return (
    <View style={{ backgroundColor: farbe, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: '#FFFFFF' }}>{text}</Text>
    </View>
  );
}

export default function Camp() {
  const { f } = useThema();
  const konto = useZustand((z) => z.konto);
  const buchung = useZustand((z) => z.buchungen[CAMP_DATEN.id]);
  const wunsch = useZustand((z) => z.campWunsch);
  const [frei, setFrei] = useState(CAMP_DATEN.frei);
  useEffect(() => { campPlaetzeFrei().then(setFrei); }, [buchung]);

  const elternFragen = async () => {
    haptik('leicht');
    try {
      await Share.share({ message: `Ich möchte ins ${CAMP_DATEN.titel}, ${CAMP.zeit}. Buchen geht in der KM1-App unter Camp.` });
      setze({ campWunsch: true });
    } catch {}
  };

  let knopf: React.ReactNode;
  if (buchung) {
    knopf = (
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Notiz>Gebucht</Notiz><Pille text={buchung.nr} farbe={f.gruen} />
        </View>
        <Leise style={{ fontSize: 15, lineHeight: 21 }}>
          {`${buchung.kinder.map((k) => k.vorname).join(' und ')} ${buchung.kinder.length > 1 ? 'sind' : 'ist'} dabei. Die Bestätigung ging an Ihre E-Mail.`}
        </Leise>
      </Panel>
    );
  } else if (konto && !darfCampBuchen(konto)) {
    knopf = wunsch
      ? <Knopf art="erledigt" titel="Deine Eltern sind gefragt" symbol={<Haken farbe={f.gruen} />} onPress={elternFragen} />
      : <Knopf titel="Meine Eltern fragen" onPress={elternFragen} />;
  } else {
    knopf = <Knopf titel="Platz buchen" deaktiviert={frei <= 0}
      onPress={() => { haptik('leicht'); router.push(konto ? '/camp-buchen' : '/anmelden?modus=neu&grund=camp'); }} />;
  }

  return (
    <Seite>
      <Image source={BILDER.goal} style={{ marginHorizontal: -18, marginTop: -18, aspectRatio: 16 / 9 }} resizeMode="cover" />
      <View><Ueberzeile>Herbstferien</Ueberzeile><Titel>{'Herbstcamp\nKöln'}</Titel></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[CAMP.zeit, CAMP.alter, CAMP.uhr].map((t) => (
          <View key={t} style={{ backgroundColor: f.surface3, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 14, color: f.ink }}>{t}</Text>
          </View>
        ))}
      </View>
      <Fliess>{CAMP.text}</Fliess>
      <View style={{ gap: 14 }}><Abschnitt>Was dabei ist</Abschnitt><HakenListe zeilen={CAMP.dabei} /></View>
      {!buchung && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Notiz>{`${euro(CAMP_DATEN.preis_cent)} pro Kind`}</Notiz>
          <Pille text={frei > 0 ? `Noch ${frei} Plätze` : 'Ausgebucht'} farbe={frei > 0 ? f.orange : f.ink2} />
        </View>
      )}
      {knopf}
    </Seite>
  );
}
