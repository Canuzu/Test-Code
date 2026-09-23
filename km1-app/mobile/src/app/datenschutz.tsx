/* Datenschutz ohne Juristendeutsch. Die vollständige Erklärung liegt auf
   km1-training.de; diese Seite sagt in drei Listen, was passiert. */
import { Linking, View } from 'react-native';
import { LINKS } from '@/daten/katalog';
import { useZustand } from '@/daten/zustand';
import { mitServer } from '@/lib/supabase';
import { Abschnitt, Klein, Titel, Ueberzeile, Verweis } from '@/ui/Schrift';
import { HakenListe, Seite, Zeile, Zeilen } from '@/ui/Bausteine';
import { loeschenFragen } from '@/ui/Konto';

export default function Datenschutz() {
  const konto = useZustand((z) => z.konto);
  return (
    <Seite>
      <View><Ueberzeile>Ohne Juristendeutsch</Ueberzeile><Titel>Deine Daten</Titel></View>
      <View style={{ gap: 14 }}><Abschnitt>Was wir speichern</Abschnitt>
        <HakenListe zeilen={['E-Mail, Vorname und Jahrgang, damit dein Konto existiert',
          'Welche Übungen du abgehakt hast und was auf deiner Merkliste steht',
          'Ob dein Abo läuft']} /></View>
      <View style={{ gap: 14 }}><Abschnitt>Wer dabei hilft</Abschnitt>
        {/* Ehrlich statt „keine Weitergabe an Dritte": ohne diese Dienste
            läuft die App nicht. Sie verarbeiten die Daten nur für uns. */}
        <HakenListe zeilen={['Supabase speichert Konto und Fortschritt, auf Servern in Frankfurt',
          'Apple und Google wickeln das Abo ab und sehen dabei nur, was sie für die Zahlung brauchen',
          'Mehr Dienste gibt es nicht']} /></View>
      <View style={{ gap: 14 }}><Abschnitt>Was wir nicht tun</Abschnitt>
        <HakenListe zeilen={['Kein Tracking, keine Werbenetzwerke',
          'Kein Verkauf und keine Weitergabe für fremde Zwecke',
          'Keine Auswertung, wer wie oft welches Video schaut',
          'Die Schriften und Bilder kommen aus der App selbst, nicht von fremden Servern']} /></View>
      {konto && <Zeilen><Zeile titel="Konto und alle Daten löschen" gefahr letzte onPress={() => loeschenFragen()} /></Zeilen>}
      <Klein>
        Die vollständige <Verweis onPress={() => Linking.openURL(LINKS.datenschutz)}>Datenschutzerklärung</Verweis> steht auf km1-training.de.
        {!mitServer ? ' Im Vorschau-Modus bleibt alles auf diesem Gerät.' : ''}
      </Klein>
    </Seite>
  );
}
