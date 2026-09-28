/* Einen Platz im Camp buchen. Gefragt wird nur, was das Camp-Team
   braucht: Vorname, Jahrgang und Hinweise zu jedem Kind, eine
   Notfallnummer und ob Fotos erlaubt sind. Bezahlt wird direkt bei KM1. */
import { useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, ZAHL, useThema } from '@/lib/thema';
import {
  CAMP_DATEN, MAX_KINDER, ZAHLUNGEN, campJahrgaenge, campPruefen, campSumme, euro, neuesFormular, type CampFormular,
} from '@/daten/camp';
import { useZustand, type Buchung } from '@/daten/zustand';
import { campBuchen, elternBuchenUeberKind } from '@/daten/aktionen';
import { haptik } from '@/lib/haptik';
import { Feld } from '@/ui/Formular';
import { Abschnitt, Klein, Leise, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { HakenListe, Knopf, Panel, Raster, SchalterZeile, Seite, Wahl, Zeilen } from '@/ui/Bausteine';
import { Haken, Kalender, Plus } from '@/ui/Symbole';

function Jahrgaenge({ wert, onWahl }: { wert: number; onWahl: (j: number) => void }) {
  const { f } = useThema();
  return (
    <View style={{ gap: 9 }}>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13.5, color: f.ink2 }}>Jahrgang</Text>
      <Raster spalten={4} abstand={6}>
        {campJahrgaenge().map((j) => {
          const an = wert === j;
          return (
            <Pressable key={j} onPress={() => { haptik('tick'); onWahl(j); }} accessibilityRole="radio" accessibilityState={{ checked: an }}
              style={{ height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: an ? f.ink : f.surface3 }}>
              <Text style={[ZAHL, { fontSize: 15, color: an ? f.canvas : f.ink }]}>{j}</Text>
            </Pressable>
          );
        })}
      </Raster>
    </View>
  );
}

function Fertig({ b }: { b: Buchung }) {
  const { f } = useThema();
  const namen = b.kinder.map((k) => k.vorname).join(' und ');
  return (
    <Seite>
      <View style={{ alignItems: 'center', gap: 10, paddingTop: 10 }}>
        <View style={{ width: 64, height: 64, borderRadius: 99, backgroundColor: f.gruen, alignItems: 'center', justifyContent: 'center' }}>
          <Haken farbe="#FFFFFF" groesse={32} dicke={3} />
        </View>
        <Ueberzeile mitte>{`Buchung ${b.nr}`}</Ueberzeile>
        <Titel style={{ textAlign: 'center', marginTop: 0 }}>{'Bis zum\n19. Oktober!'}</Titel>
        <Leise style={{ textAlign: 'center' }}>
          {`${namen} ${b.kinder.length > 1 ? 'sind' : 'ist'} im ${CAMP_DATEN.titel} dabei. Die Bestätigung und die Rechnung über ${euro(b.summe)} gehen an Ihre E-Mail.`}
        </Leise>
      </View>
      <HakenListe zeilen={['Montag um 9 Uhr am Vereinsheim, mit Fußballschuhen und Trinkflasche', 'Abholen jeden Tag um 16 Uhr',
        'Fragen gehen direkt an das Camp-Team von KM1']} />
      <Knopf art="geist" titel="In den Kalender" symbol={<Kalender farbe={f.accentInk} />}
        onPress={() => Linking.openURL(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(CAMP_DATEN.titel)}&dates=${CAMP_DATEN.von.replace(/-/g, '')}T090000/${CAMP_DATEN.bis.replace(/-/g, '')}T160000&ctz=Europe/Berlin`)} />
      <Knopf titel="Fertig" onPress={() => router.back()} />
    </Seite>
  );
}

export default function CampBuchen() {
  const { f } = useThema();
  const konto = useZustand((z) => z.konto);
  const vorlieben = useZustand((z) => z.vorlieben);
  const [c, setC] = useState<CampFormular>(() => neuesFormular(
    konto?.rolle === 'spieler' ? konto.vorname : '',
    konto?.rolle === 'spieler' ? konto.geburtsjahr : vorlieben.jahrgang,
  ));
  /* Was fehlt, steht erst nach dem ersten Versuch da und verschwindet,
     sobald es ergänzt ist. */
  const [versucht, setVersucht] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fertig, setFertig] = useState<Buchung | null>(null);
  if (fertig) return <Fertig b={fertig} />;

  const ueberKind = !!konto && elternBuchenUeberKind(konto);
  const kind = (i: number, teil: Partial<CampFormular['kinder'][number]>) =>
    setC((x) => ({ ...x, kinder: x.kinder.map((k, j) => (j === i ? { ...k, ...teil } : k)) }));
  const summe = campSumme(c.kinder.length);

  const fehler = serverFehler ?? (versucht ? campPruefen(c) : null);
  const senden = async () => {
    setVersucht(true); setServerFehler(null);
    if (campPruefen(c)) { haptik('fehler'); return; }
    setLaeuft(true);
    try { const b = await campBuchen(c); haptik('erfolg'); setFertig(b); }
    catch (e) { haptik('fehler'); setServerFehler((e as Error).message); }
    finally { setLaeuft(false); }
  };

  return (
    <Seite>
      <View><Ueberzeile>{`${CAMP_DATEN.titel} · 19. bis 23. Oktober`}</Ueberzeile><Titel>Platz buchen</Titel></View>

      {ueberKind && (
        <Panel style={{ borderWidth: 1.5, borderColor: f.accentLine }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, color: f.ink }}>Bitte gib das Handy jetzt deinen Eltern.</Text>
          <Leise style={{ fontSize: 15, lineHeight: 21 }}>Buchen darf nur ein Elternteil. Das Konto läuft auf Ihre E-Mail-Adresse, dorthin geht auch die Bestätigung.</Leise>
        </Panel>
      )}

      {c.kinder.map((k, i) => (
        <View key={i} style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Abschnitt style={{ fontSize: 19 }}>{i === 0 ? 'Ihr Kind' : 'Geschwisterkind'}</Abschnitt>
            {i > 0 && (
              <Pressable onPress={() => { haptik('leicht'); setC((x) => ({ ...x, kinder: x.kinder.filter((_, j) => j !== i) })); }}
                accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15, color: f.accentInk }}>Entfernen</Text>
              </Pressable>
            )}
          </View>
          <Feld titel="Vorname" value={k.vorname} onChangeText={(t) => kind(i, { vorname: t })} placeholder="Luis" autoComplete="off" />
          <Jahrgaenge wert={k.jahrgang} onWahl={(j) => kind(i, { jahrgang: j })} />
          <View style={{ gap: 9 }}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13.5, color: f.ink2 }}>Allergien, Medikamente, Hinweise</Text>
            <TextInput value={k.hinweise} onChangeText={(t) => kind(i, { hinweise: t })} placeholder="Optional" placeholderTextColor={f.ink3}
              multiline accessibilityLabel="Allergien, Medikamente, Hinweise"
              style={{ minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.knopf, backgroundColor: f.field,
                color: f.ink, fontFamily: SCHRIFT.mittel, fontSize: 16, borderWidth: 1, borderColor: f.line, textAlignVertical: 'top' }} />
          </View>
        </View>
      ))}
      {c.kinder.length < MAX_KINDER && (
        <Knopf art="geist" symbol={<Plus farbe={f.accentInk} />} titel={`Geschwisterkind, ${euro(CAMP_DATEN.geschwister_rabatt_cent)} günstiger`}
          onPress={() => { haptik('leicht'); setC((x) => ({ ...x, kinder: [...x.kinder, { vorname: '', jahrgang: x.kinder[0].jahrgang, hinweise: '' }] })); }} />
      )}

      <Feld titel="Notfallnummer" value={c.notfall} onChangeText={(t) => setC((x) => ({ ...x, notfall: t }))}
        placeholder="z. B. 0170 1234567" hilfe="Unter dieser Nummer erreicht Sie das Camp-Team während des Camps, von 9 bis 16 Uhr."
        keyboardType="phone-pad" autoComplete="tel" maxLength={30} />

      <Zeilen>
        <SchalterZeile titel="Fotos vom Camp dürfen in der App erscheinen" an={c.fotos}
          onPress={() => { haptik('tick'); setC((x) => ({ ...x, fotos: !x.fotos })); }} />
        <SchalterZeile titel={ueberKind ? 'Ich bin erziehungsberechtigt und habe die Teilnahmebedingungen gelesen' : 'Ich habe die Teilnahmebedingungen gelesen'}
          an={c.ok} letzte onPress={() => { haptik('tick'); setC((x) => ({ ...x, ok: !x.ok })); }} />
      </Zeilen>
      <Klein style={{ marginTop: -12 }}>Kostenlos stornierbar bis 14 Tage vor Beginn. Ohne Ihre Zustimmung erscheint kein Foto Ihres Kindes.</Klein>

      <View style={{ gap: 10 }}>
        <Notiz>Bezahlen</Notiz>
        <Wahl beschriftung="Bezahlen" werte={ZAHLUNGEN} wert={c.zahlung} onWahl={(z) => { haptik('tick'); setC((x) => ({ ...x, zahlung: z })); }} />
        <Klein>Bezahlt wird direkt bei KM1, nicht über den App Store.</Klein>
      </View>

      {fehler ? <Text accessibilityLiveRegion="assertive" style={{ fontFamily: SCHRIFT.fett, fontSize: 15, lineHeight: 21, color: f.accentInk }}>{fehler}</Text> : null}
      <Knopf titel={`Verbindlich buchen · ${euro(summe)}`} deaktiviert={laeuft} onPress={senden} />
    </Seite>
  );
}
