/* Der Elternbereich. Hier steht Sie, nicht du, denn hier liest jemand
   anderes mit. */
import { Text, View } from 'react-native';
import { SCHRIFT, useThema } from '@/lib/thema';
import { KAUF, WARUM } from '@/daten/katalog';
import { useZustand } from '@/daten/zustand';
import { geradeDran } from '@/daten/aktionen';
import { Abschnitt, Fliess, Klein, Leise, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { HakenListe, Panel, Seite, Zeile, Zeilen } from '@/ui/Bausteine';
import { loeschenFragen } from '@/ui/Konto';

export default function Eltern() {
  const { f } = useThema();
  const s = useZustand((z) => z);
  const akt = geradeDran(s);
  const anzahl = (z: string) => s.katalog.filter((v) => v.zugang === z).length;
  return (
    <Seite>
      <View><Ueberzeile>Für Eltern</Ueberzeile><Titel>{'Was Ihr Kind\nhier übt.'}</Titel></View>
      <Fliess>KM1 ersetzt kein Vereinstraining. Die App füllt die Lücke dazwischen: die zwanzig Minuten am Mittwoch im Hof, nach denen eine Sache sitzt, für die im Mannschaftstraining keine Zeit war.</Fliess>

      {akt && (
        <Panel>
          <Notiz>Gerade dran</Notiz>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15, color: f.ink }}>{akt.titel.replace(/­/g, '')}</Text>
          <Leise>{`Warum das zählt: ${WARUM[akt.kategorie]}`}</Leise>
        </Panel>
      )}

      <View style={{ gap: 14 }}><Abschnitt>Wie viel Zeit sinnvoll ist</Abschnitt>
        <HakenListe zeilen={['15 bis 20 Minuten am Stück, zwei- bis dreimal die Woche.',
          'Lieber kurz und regelmäßig als einmal eine Stunde am Sonntag.',
          'Ein Ball und zehn Quadratmeter reichen. Ein Hinterhof tut es.']} /></View>

      <View style={{ gap: 14 }}><Abschnitt>Wobei Sie helfen können</Abschnitt>
        <HakenListe zeilen={['Zählen lassen statt korrigieren. Ihr Kind merkt selbst, wann es sitzt.',
          'Einmal zuschauen, wenn es etwas zeigen will. Mehr Motivation gibt es nicht.',
          'Hinterher fragen, was geklappt hat, nicht was schiefging.']} /></View>

      <Panel traegt>
        <Notiz>Kein Ort zum Verweilen</Notiz>
        <Leise style={{ color: f.inkBody }}>Die App hat keine Endlosliste und kein Video, das von allein weiterläuft. Wer eine Übung gesehen hat, soll rausgehen, nicht weiterscrollen.</Leise>
      </Panel>

      <View style={{ gap: 14 }}><Abschnitt>Was wir speichern</Abschnitt>
        <HakenListe zeilen={['E-Mail, Vorname und Jahrgang, damit das Konto existiert.',
          'Bei Kindern unter 16 zusätzlich, wann Sie eingewilligt haben.',
          'Welche Übungen abgehakt sind und was auf der Merkliste steht.',
          'Kein Tracking, keine Werbung, kein Verkauf von Daten.']} />
        {s.konto && (
          <Zeilen><Zeile titel="Konto und alle Daten löschen" gefahr letzte onPress={() => loeschenFragen(true)} /></Zeilen>
        )}
      </View>

      <View style={{ gap: 14 }}><Abschnitt>Was kostet was</Abschnitt>
        <HakenListe zeilen={[`Ohne Anmeldung: ${anzahl('offen')} Videos, sofort, ohne E-Mail.`,
          `Mit kostenlosem Konto: ${anzahl('konto')} weitere Videos und der gespeicherte Fortschritt.`,
          `KM1 Pro, 6,99 € im Monat: die ${anzahl('pro')} Einheiten mit Profispielern. Sonst nichts kostenpflichtig.`,
          `Abrechnung über ${KAUF.laden}, jederzeit kündbar.`]} />
        <Klein>{`Der Kauf läuft über ${KAUF.kontoSie}. ${KAUF.sperre} kann Ihr Kind nichts kaufen, ohne dass Sie zustimmen. Für Kinder unter 16 Jahren legen Sie das Konto an.`}</Klein>
      </View>
    </Seite>
  );
}

