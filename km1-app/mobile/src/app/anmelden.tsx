/* Konto anlegen und anmelden.

   Zuerst das Alter, denn davon hängt alles ab: Unter 16 Jahren legen die
   Eltern das Konto an, mit ihrer eigenen E-Mail-Adresse und einer
   ausdrücklichen Einwilligung (DSGVO Art. 8). Die Bestätigungsmail geht
   an sie, erst ihr Klick macht das Konto aktiv. Anmeldung über Google
   oder Apple gibt es deshalb erst ab 16. */
import { useEffect, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SCHRIFT, useThema } from '@/lib/thema';
import { LINKS } from '@/daten/katalog';
import { hinweis, useZustand } from '@/daten/zustand';
import {
  anmelden, codeEinloesen, meldung, mitGoogle, passwortVergessen, profilErgaenzen, registrieren,
} from '@/daten/aktionen';
import { mitServer } from '@/lib/supabase';
import { haptik } from '@/lib/haptik';
import { Klein, Leise, Titel, Ueberzeile, Verweis } from '@/ui/Schrift';
import { Knopf, Panel, Seite } from '@/ui/Bausteine';
import { Einwilligung, Feld, Umschalter } from '@/ui/Formular';
import { Apple, Google } from '@/ui/Symbole';
import { loeschenFragen } from '@/ui/Konto';

type Modus = 'neu' | 'alt' | 'alter';
type Schritt = 'jahrgang' | 'kind' | 'selbst' | 'post';

const GRUND: Record<string, string> = {
  fortschritt: 'Damit dein Fortschritt gespeichert wird, brauchst du ein Konto.',
  merkliste: 'Damit deine Merkliste erhalten bleibt, brauchst du ein Konto.',
  konto: 'Dieses Video gehört zu denen, für die ein kostenloses Konto reicht.',
  abo: 'Für ein Abo braucht es ein Konto, sonst weiß niemand, wem Pro gehört.',
};

const JAHR = new Date().getFullYear();
/* Vorsichtig nach Jahrgang: wer in diesem Jahr 16 wird, gilt noch als jünger. */
const unter16 = (jg: number) => JAHR - jg < 17;

export default function Anmelden() {
  const { f } = useThema();
  const p = useLocalSearchParams<{ modus?: Modus; grund?: string; code?: string; error_description?: string }>();
  const konto = useZustand((z) => z.konto);
  const [modus, setModus] = useState<Modus>(p.modus === 'alt' || p.modus === 'alter' ? p.modus : 'neu');
  const [schritt, setSchritt] = useState<Schritt>('jahrgang');
  const [jahrgang, setJahrgang] = useState('');
  const [vorname, setVorname] = useState(konto?.vorname && konto.vorname !== 'Spieler' ? konto.vorname : '');
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [eltern, setEltern] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(p.error_description ?? null);

  /* Kommt man über den Link aus der Bestätigungsmail oder von Google
     zurück, steht ein Code in der Adresse. */
  useEffect(() => {
    if (!p.code) return;
    codeEinloesen(p.code)
      .then((ok) => { if (ok) { haptik('erfolg'); hinweis('Angemeldet'); router.replace('/'); } })
      .catch((e) => setFehler(meldung(e)));
  }, [p.code]);

  const fertig = (text = 'Angemeldet') => { haptik('erfolg'); hinweis(text); if (router.canGoBack()) router.back(); else router.replace('/'); };
  const los = async (was: () => Promise<void>) => {
    setFehler(null); setLaeuft(true);
    try { await was(); } catch (e) { haptik('fehler'); setFehler((e as Error).message); } finally { setLaeuft(false); }
  };
  const jg = parseInt(jahrgang, 10);
  const jahrgangOk = jg >= 1900 && jg <= JAHR;

  /* Apple verlangt „Mit Apple anmelden", sobald es Google gibt. Auf
     Android steht Google zuerst. */
  const appleKnopf = (
    <Knopf key="apple" art="geist" titel="Mit Apple anmelden" symbol={<Apple farbe={f.ink} />}
      onPress={() => hinweis('„Mit Apple anmelden" kommt, sobald das Apple-Entwicklerkonto steht.')} />
  );
  const googleKnopf = (
    <Knopf key="google" art="geist" titel="Mit Google anmelden" symbol={<Google />} deaktiviert={laeuft}
      onPress={() => los(async () => { if (await mitGoogle()) fertig(); })} />
  );
  const extern2 = (
    <View style={{ gap: 12 }}>
      {Platform.OS === 'android' ? [googleKnopf, appleKnopf] : [appleKnopf, googleKnopf]}
    </View>
  );

  const fehlerText = fehler ? (
    <Text accessibilityLiveRegion="assertive" style={{ fontFamily: SCHRIFT.fett, fontSize: 14.5, lineHeight: 21, color: f.accentInk }}>{fehler}</Text>
  ) : null;
  const vorschau = !mitServer ? (
    <Klein>Vorschau-Modus: Solange der Server nicht verbunden ist, bleibt das Konto auf diesem Gerät.</Klein>
  ) : null;

  // ------------------------------------------------------------------
  if (schritt === 'post') {
    return (
      <Seite>
        <View><Ueberzeile>Fast geschafft</Ueberzeile><Titel>{'Bitte die\nE-Mail bestätigen'}</Titel></View>
        <Leise>{eltern
          ? `Wir haben Ihnen eine E-Mail an ${email} geschickt. Erst mit dem Link darin ist das Konto Ihres Kindes aktiv.`
          : `Wir haben dir eine E-Mail an ${email} geschickt. Mit dem Link darin ist dein Konto aktiv.`}</Leise>
        <Knopf titel="Verstanden" onPress={() => router.back()} />
      </Seite>
    );
  }

  if (modus === 'alter') {
    return (
      <Seite>
        <View><Ueberzeile>Noch ein Schritt</Ueberzeile><Titel>Wie alt bist du?</Titel></View>
        <Leise>Wir fragen nur das Jahr. Unter 16 Jahren legen die Eltern das Konto an.</Leise>
        <Feld titel="Vorname" value={vorname} onChangeText={setVorname} placeholder="Luis" autoComplete="given-name" />
        <Feld titel="Jahrgang" value={jahrgang} onChangeText={(t) => setJahrgang(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="2012" keyboardType="number-pad" maxLength={4} />
        {fehlerText}
        <Knopf titel="Speichern" deaktiviert={!jahrgangOk || laeuft}
          onPress={() => los(async () => { await profilErgaenzen(vorname, jg); fertig('Gespeichert'); })} />
        {fehler && /Eltern/.test(fehler) && (
          <Panel>
            <Leise>Bitte deine Eltern, das Konto mit ihrer E-Mail-Adresse neu anzulegen. Dieses Konto kannst du hier löschen.</Leise>
            <Knopf art="geist" titel="Dieses Konto löschen" onPress={() => loeschenFragen()} />
          </Panel>
        )}
      </Seite>
    );
  }

  return (
    <Seite>
      <View>
        <Ueberzeile>{modus === 'neu' ? 'Kostenlos' : 'Willkommen zurück'}</Ueberzeile>
        <Titel>{modus === 'neu' ? (schritt === 'kind' ? 'Konto für\nIhr Kind' : 'Konto anlegen') : 'Anmelden'}</Titel>
      </View>
      {p.grund && GRUND[p.grund] ? <Leise>{GRUND[p.grund]}</Leise> : null}

      <Umschalter<'neu' | 'alt'> wahl={modus === 'alt' ? 'alt' : 'neu'} optionen={[['neu', 'Neu hier'], ['alt', 'Ich habe ein Konto']]}
        onWahl={(w) => { setModus(w); setSchritt('jahrgang'); setFehler(null); }} />

      {modus === 'alt' && (
        <>
          <Feld titel="E-Mail" value={email} onChangeText={setEmail} placeholder="name@beispiel.de"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <View style={{ gap: 4 }}>
            <Feld titel="Passwort" value={passwort} onChangeText={setPasswort} placeholder="mindestens 8 Zeichen"
              secureTextEntry autoComplete="current-password" textContentType="password" />
            <Knopf art="geist" titel="Passwort vergessen?" style={{ alignSelf: 'flex-end', minHeight: 44, paddingHorizontal: 12, shadowOpacity: 0, elevation: 0, backgroundColor: 'transparent' }}
              onPress={() => {
                if (email.indexOf('@') < 1) { haptik('fehler'); setFehler('Trag zuerst deine E-Mail-Adresse ein.'); return; }
                los(async () => { await passwortVergessen(email); hinweis('Der Link zum Zurücksetzen ist unterwegs'); });
              }} />
          </View>
          {fehlerText}
          <Knopf titel="Anmelden" deaktiviert={laeuft || !email || !passwort}
            onPress={() => los(async () => { await anmelden(email, passwort); fertig(); })} />
          {extern2}
        </>
      )}

      {modus === 'neu' && schritt === 'jahrgang' && (
        <>
          <Feld titel="In welchem Jahr bist du geboren?" value={jahrgang}
            onChangeText={(t) => setJahrgang(t.replace(/\D/g, '').slice(0, 4))} placeholder="2012"
            keyboardType="number-pad" maxLength={4}
            hilfe="Nur das Jahr. Unter 16 Jahren legen deine Eltern das Konto an." />
          <Knopf titel="Weiter" deaktiviert={!jahrgangOk}
            onPress={() => { setFehler(null); setSchritt(unter16(jg) ? 'kind' : 'selbst'); }} />
        </>
      )}

      {modus === 'neu' && schritt === 'kind' && (
        <>
          <Panel style={{ borderWidth: 1.5, borderColor: f.accentLine }}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, color: f.ink }}>Bitte gib das Handy jetzt deinen Eltern.</Text>
            <Leise>Liebe Eltern: Ihr Kind ist unter 16. Das Konto läuft deshalb auf Ihre E-Mail-Adresse, und es wird erst aktiv, wenn Sie den Link in unserer E-Mail bestätigen.</Leise>
          </Panel>
          <Feld titel="Vorname Ihres Kindes" value={vorname} onChangeText={setVorname} placeholder="Luis" autoComplete="off" />
          <Feld titel="Ihre E-Mail-Adresse" value={email} onChangeText={setEmail} placeholder="name@beispiel.de"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Feld titel="Passwort" value={passwort} onChangeText={setPasswort} placeholder="mindestens 8 Zeichen"
            secureTextEntry autoComplete="new-password" textContentType="newPassword" />
          <Einwilligung an={eltern} onWechsel={setEltern}>
            Ich bin erziehungsberechtigt und willige ein, dass KM1 den Vornamen, den Jahrgang und den Trainingsfortschritt
            meines Kindes speichert, wie im <Verweis onPress={() => router.push('/datenschutz')}>Datenschutz</Verweis> beschrieben.
            Ich kann das jederzeit widerrufen, indem ich das Konto lösche.
          </Einwilligung>
          {fehlerText}
          <Knopf titel="Konto für mein Kind anlegen" deaktiviert={!eltern || laeuft || !vorname.trim() || !email || passwort.length < 8}
            onPress={() => los(async () => {
              const r = await registrieren({ vorname, email, passwort, geburtsjahr: jg, eltern: true });
              if (r.bestaetigen) setSchritt('post'); else fertig('Konto angelegt');
            })} />
          <Klein>Mit dem Anlegen gelten die <Verweis onPress={() => router.push('/bedingungen')}>Nutzungsbedingungen</Verweis>.</Klein>
        </>
      )}

      {modus === 'neu' && schritt === 'selbst' && (
        <>
          <Feld titel="Vorname" value={vorname} onChangeText={setVorname} placeholder="Luis" autoComplete="given-name" />
          <Feld titel="E-Mail" value={email} onChangeText={setEmail} placeholder="name@beispiel.de"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Feld titel="Passwort" value={passwort} onChangeText={setPasswort} placeholder="mindestens 8 Zeichen"
            secureTextEntry autoComplete="new-password" textContentType="newPassword" />
          {fehlerText}
          <Knopf titel="Konto anlegen" deaktiviert={laeuft || !vorname.trim() || !email || passwort.length < 8}
            onPress={() => los(async () => {
              const r = await registrieren({ vorname, email, passwort, geburtsjahr: jg, eltern: false });
              if (r.bestaetigen) setSchritt('post'); else fertig('Konto angelegt');
            })} />
          {extern2}
          <Klein>
            Mit dem Anlegen stimmst du den <Verweis onPress={() => router.push('/bedingungen')}>Nutzungsbedingungen</Verweis> zu.
            Wie wir mit deinen Daten umgehen, steht im <Verweis onPress={() => router.push('/datenschutz')}>Datenschutz</Verweis>.
          </Klein>
        </>
      )}

      <Knopf art="geist" titel="Weiter ohne Konto" onPress={() => router.back()} />
      {vorschau}
      <Klein>Das Impressum steht auf <Verweis onPress={() => Linking.openURL(LINKS.impressum)}>km1-training.de</Verweis>.</Klein>
    </Seite>
  );
}
