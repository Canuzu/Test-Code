/* Nutzungsbedingungen in Kurzform. Sie wiederholen, was die App an
   anderer Stelle verspricht. Vor dem Start gehören sie einmal
   juristisch geprüft und durch die Fassung des Anwalts ersetzt. */
import { Linking, Platform, View } from 'react-native';
import { KAUF, LINKS } from '@/daten/katalog';
import { Abschnitt, Klein, Titel, Ueberzeile, Verweis } from '@/ui/Schrift';
import { HakenListe, Seite } from '@/ui/Bausteine';

export default function Bedingungen() {
  return (
    <Seite>
      <View><Ueberzeile>Das Wichtigste in Kürze</Ueberzeile><Titel>{'Nutzungs­bedingungen'}</Titel></View>
      <View style={{ gap: 14 }}><Abschnitt>Das Abo</Abschnitt>
        <HakenListe zeilen={['KM1 Pro kostet 6,99 € im Monat oder 59,00 € im Jahr.',
          'Die ersten sieben Tage sind gratis. Wer in dieser Zeit kündigt, zahlt nichts.',
          'Danach verlängert sich das Abo automatisch um denselben Zeitraum, wenn es nicht spätestens 24 Stunden vor Ablauf gekündigt wird.',
          `Gekündigt wird ${KAUF.kuendigen}. Das Abo läuft dann bis zum Ende des bezahlten Zeitraums.`,
          `Bezahlt wird über ${KAUF.laden}. Auch Erstattungen laufen darüber.`]} /></View>
      <View style={{ gap: 14 }}><Abschnitt>Die Videos</Abschnitt>
        <HakenListe zeilen={['Die Videos sind für den privaten Gebrauch. Herunterladen, weitergeben oder öffentlich zeigen ist nicht erlaubt.',
          'Die Rechte an den Videos liegen bei KM1 und den Spielern darin.']} /></View>
      <View style={{ gap: 14 }}><Abschnitt>Beim Üben</Abschnitt>
        <HakenListe zeilen={['Geübt wird auf eigene Verantwortung. Kinder üben am besten dort, wo ein Erwachsener in der Nähe ist, und nie auf der Straße.',
          'Wer Schmerzen hat, hört auf. Keine Übung ist wichtiger als die Gesundheit.']} /></View>
      <View style={{ gap: 14 }}><Abschnitt>Das Konto</Abschnitt>
        <HakenListe zeilen={['Für Kinder unter 16 Jahren legen die Eltern das Konto an.',
          'Das Konto lässt sich jederzeit löschen, im Profil und unter Datenschutz.']} /></View>
      <Klein>
        {Platform.OS !== 'android' ? <>Für Käufe im App Store gilt zusätzlich der <Verweis onPress={() => Linking.openURL(LINKS.appleLizenz)}>Lizenzvertrag von Apple</Verweis>. </> : null}
        Wer hinter KM1 steht, steht im <Verweis onPress={() => Linking.openURL(LINKS.impressum)}>Impressum</Verweis>.
      </Klein>
    </Seite>
  );
}
