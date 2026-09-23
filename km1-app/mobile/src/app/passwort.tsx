/* Neues Passwort. Der Link aus der E-Mail führt hierher und bringt einen
   Code mit, der für ein paar Minuten anmeldet. */
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SCHRIFT, useThema } from '@/lib/thema';
import { codeEinloesen, meldung, passwortSetzen } from '@/daten/aktionen';
import { hinweis } from '@/daten/zustand';
import { Leise, Titel, Ueberzeile } from '@/ui/Schrift';
import { Knopf, Seite } from '@/ui/Bausteine';
import { Feld } from '@/ui/Formular';

export default function Passwort() {
  const { f } = useThema();
  const p = useLocalSearchParams<{ code?: string }>();
  const [bereit, setBereit] = useState(!p.code);
  const [neu, setNeu] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  useEffect(() => {
    if (!p.code) return;
    codeEinloesen(p.code).then(() => setBereit(true)).catch((e) => setFehler(meldung(e)));
  }, [p.code]);
  return (
    <Seite>
      <View><Ueberzeile>Zugang</Ueberzeile><Titel>Neues Passwort</Titel></View>
      <Leise>Mindestens acht Zeichen. Danach bist du angemeldet.</Leise>
      <Feld titel="Neues Passwort" value={neu} onChangeText={setNeu} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      {fehler ? <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14.5, color: f.accentInk }}>{fehler}</Text> : null}
      <Knopf titel="Speichern" deaktiviert={!bereit || neu.length < 8}
        onPress={async () => {
          try { await passwortSetzen(neu); hinweis('Passwort gespeichert'); router.replace('/'); }
          catch (e) { setFehler((e as Error).message); }
        }} />
    </Seite>
  );
}
