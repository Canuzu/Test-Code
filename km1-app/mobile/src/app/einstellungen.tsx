/* Alles, was man einstellt statt benutzt: Darstellung, Erinnerung, Abo,
   die Texte für Eltern und das Konto. */
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { LINKS, preisText } from '@/daten/katalog';
import { setze, useZustand } from '@/daten/zustand';
import { abmelden } from '@/daten/aktionen';
import { datumText, erinnerungText } from '@/lib/zeit';
import { haptik } from '@/lib/haptik';
import { Klein, Notiz } from '@/ui/Schrift';
import { Seite, Wahl, Zeile, Zeilen } from '@/ui/Bausteine';
import { loeschenFragen } from '@/ui/Konto';

export default function Einstellungen() {
  const s = useZustand((z) => z);
  const { konto, pro, abo, erinnerung, thema } = s;
  const aboWert = konto?.rolle === 'km1' ? 'Alles frei'
    : pro ? (abo ? `Bis ${datumText(abo.bis)}` : 'Aktiv')
    : 'Ab 6,99 €';

  return (
    <Seite>
      <View style={{ gap: 10 }}>
        <Notiz>Darstellung</Notiz>
        <Wahl beschriftung="Darstellung" wert={thema} werte={[['hell', 'Hell'], ['dunkel', 'Dunkel'], ['auto', 'Automatisch']]}
          onWahl={(t) => { setze({ thema: t }); haptik('leicht'); }} />
      </View>

      <Zeilen>
        <Zeile titel="Erinnerung" wert={erinnerungText(erinnerung)} onPress={() => router.push('/erinnerung')} />
        <Zeile titel="KM1 Pro" wert={aboWert} onPress={() => router.push('/abo')} letzte={!!konto} />
        {!konto && <Zeile titel="Einführung ansehen" onPress={() => router.push('/willkommen')} letzte />}
      </Zeilen>
      {pro && abo?.preis ? <Klein style={{ marginTop: -12 }}>{`Danach ${preisText(abo.preis)}. Kündbar bis 24 Stunden vorher.`}</Klein> : null}

      <Zeilen>
        <Zeile titel="Für Eltern" onPress={() => router.push('/eltern')} />
        <Zeile titel="Datenschutz" onPress={() => router.push('/datenschutz')} />
        <Zeile titel="Nutzungsbedingungen" onPress={() => router.push('/bedingungen')} />
        <Zeile titel="Impressum" wert="km1-training.de" onPress={() => Linking.openURL(LINKS.impressum)} letzte />
      </Zeilen>

      {konto && (
        <Zeilen>
          <Zeile titel="Abmelden" wert={konto.vorname}
            onPress={async () => { await abmelden(); haptik('leicht'); router.back(); }} />
          <Zeile titel="Konto löschen" gefahr letzte onPress={() => loeschenFragen()} />
        </Zeilen>
      )}
    </Seite>
  );
}
