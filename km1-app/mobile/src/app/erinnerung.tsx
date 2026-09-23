/* Die Trainingserinnerung: an welchen Tagen, um wie viel Uhr. Sie wird
   als echte Mitteilung auf dem Handy geplant, ganz ohne Server. */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { hinweis, setze, useZustand } from '@/daten/zustand';
import { naechstesVideo } from '@/daten/aktionen';
import { erinnerungAktualisieren } from '@/daten/erinnern';
import { vorschauText } from '@/lib/erinnerung';
import { erinnerungText, TAGE, WIE_OFT, type Tag } from '@/lib/zeit';
import { haptik } from '@/lib/haptik';
import { Klein, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { Chip, Knopf, Seite } from '@/ui/Bausteine';
import { Umschalter } from '@/ui/Formular';

const ZEITEN = ['15:00', '16:00', '16:30', '17:00', '17:30', '18:00', '19:00'];

export default function Erinnerung() {
  const { f } = useThema();
  const s = useZustand((z) => z);
  const [e, setE] = useState(s.erinnerung);
  const naechstes = naechstesVideo(s);

  const tag = (t: Tag) => {
    const tage = e.tage.includes(t) ? e.tage.filter((x) => x !== t) : [...e.tage, t];
    tage.sort((a, b) => TAGE.findIndex((x) => x[0] === a) - TAGE.findIndex((x) => x[0] === b));
    setE({ ...e, tage }); haptik('tick');
  };

  const speichern = async () => {
    if (e.an && !e.tage.length) { haptik('fehler'); hinweis('Wähl mindestens einen Tag'); return; }
    setze({ erinnerung: e });
    const r = await erinnerungAktualisieren(true);
    if (r === 'verweigert') { haptik('fehler'); hinweis('Mitteilungen sind in den Einstellungen des Handys aus'); return; }
    haptik('erfolg');
    hinweis(r === 'nicht-verfuegbar' ? 'Gespeichert. Mitteilungen gibt es nur in der App.' : e.an ? 'Erinnerung: ' + erinnerungText(e) : 'Erinnerung aus');
    router.back();
  };

  return (
    <Seite>
      <View><Ueberzeile>{e.an ? WIE_OFT[e.tage.length] : 'Ausgeschaltet'}</Ueberzeile><Titel>{'Erinnerung\nans Training'}</Titel></View>

      <View style={[{ flexDirection: 'row', gap: 13, padding: 16, borderRadius: RADIUS.bild, backgroundColor: f.surface }, schwebt(f, true)]}
        accessibilityLabel={`Vorschau der Mitteilung: ${vorschauText(naechstes)}`}>
        <View style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: f.surface3, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: SCHRIFT.display, fontSize: 15, color: f.ink }}>KM1</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12.5, color: f.ink2 }}>KM1 Training</Text>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12.5, color: f.ink2 }}>{e.zeit}</Text>
          </View>
          <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 15, lineHeight: 21, color: f.ink, marginTop: 4 }}>{vorschauText(naechstes)}</Text>
        </View>
      </View>

      <View style={{ gap: 9 }}>
        <Notiz>Erinnerung</Notiz>
        <Umschalter<'an' | 'aus'> wahl={e.an ? 'an' : 'aus'} optionen={[['an', 'An'], ['aus', 'Aus']]} onWahl={(w) => setE({ ...e, an: w === 'an' })} />
      </View>

      <View style={{ gap: 9 }}>
        <Notiz>An diesen Tagen</Notiz>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {TAGE.map(([k, n]) => {
            const an = e.tage.includes(k);
            return (
              <Pressable key={k} onPress={() => tag(k)} accessibilityRole="checkbox" accessibilityState={{ checked: an }}
                accessibilityLabel={n}
                style={[{ flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: an ? f.accent : f.surface }, schwebt(f)]}>
                <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13.5, color: an ? '#FFFFFF' : f.ink2 }}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 9 }}>
        <Notiz>Uhrzeit</Notiz>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ZEITEN.map((z) => <Chip key={z} titel={z} an={e.zeit === z} onPress={() => setE({ ...e, zeit: z })} />)}
        </View>
      </View>

      <Knopf titel="Erinnerung speichern" onPress={speichern} />
      <Klein>Die Mitteilung plant das Handy selbst. Es geht dafür nichts an einen Server.</Klein>
    </Seite>
  );
}
