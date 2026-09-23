/* KM1 Pro. Nennt vor dem Kauf alles, was Apple unter 3.1.2 verlangt:
   Preis nach der Probezeit, automatische Verlängerung, Kündigung und die
   Wege zu Nutzungsbedingungen und Datenschutz. Verspricht nur, was stimmt. */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { KAUF, preisText } from '@/daten/katalog';
import { hinweis, useZustand } from '@/daten/zustand';
import { proVorschau } from '@/daten/aktionen';
import { mitServer } from '@/lib/supabase';
import { haptik } from '@/lib/haptik';
import { Klein, Titel, Ueberzeile, Verweis } from '@/ui/Schrift';
import { Druck, HakenListe, Knopf, Seite } from '@/ui/Bausteine';

export default function Abo() {
  const { f } = useThema();
  const konto = useZustand((z) => z.konto);
  const katalog = useZustand((z) => z.katalog);
  const [preis, setPreis] = useState<'monat' | 'jahr'>('jahr');
  const anzahl = katalog.filter((v) => v.zugang === 'pro').length;

  const kaufen = () => {
    if (!konto) { haptik('wand'); router.push('/anmelden?modus=neu&grund=abo'); return; }
    if (mitServer) {
      // Echte Käufe laufen über RevenueCat und brauchen das Store-Konto.
      hinweis('Der Kauf kommt, sobald das Konto bei Apple und Google steht.');
      return;
    }
    proVorschau(preis);
    haptik('aufstieg');
    hinweis('Vorschau: KM1 Pro ist aktiv, ohne Zahlung');
    router.back();
  };

  const karte = (w: 'monat' | 'jahr', oben: string, gross: string, unten: string, extra?: string) => (
    <Druck onPress={() => { setPreis(w); haptik('tick'); }} accessibilityRole="radio" accessibilityState={{ checked: preis === w }}
      style={[{ flex: 1, borderRadius: RADIUS.karte, padding: 16, paddingVertical: 18, gap: 5, backgroundColor: f.surface },
        schwebt(f, preis === w), preis === w && { borderWidth: 2, borderColor: f.accent }]}>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{oben}</Text>
      <Text style={{ fontFamily: SCHRIFT.display, fontSize: 28, color: f.ink }}>{gross}</Text>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{unten}</Text>
      {extra ? <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12.5, color: f.lv[1] }}>{extra}</Text> : null}
    </Druck>
  );

  return (
    <Seite>
      <View><Ueberzeile>Sieben Tage gratis</Ueberzeile><Titel>{'Die Profis.\nAus der Nähe.'}</Titel></View>
      <HakenListe zeilen={[
        `Alle ${anzahl} Einheiten mit Profispielern`,
        'Regelmäßig neue Einheiten mit neuen Gästen',
        'Jede Übung Schritt für Schritt, in Zeitlupe zum Nachmachen',
        'Das Flutlicht-Symbol für deinen Startbildschirm',
      ]} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {karte('monat', 'Monatlich', '6,99 €', 'pro Monat')}
        {karte('jahr', 'Jährlich', '59,00 €', '4,92 € im Monat', '3,5 Monate gratis')}
      </View>
      <Knopf titel={konto ? '7 Tage gratis testen' : 'Konto anlegen und testen'} onPress={kaufen} />
      <Klein>
        {`Sieben Tage gratis, danach ${preisText(preis)}. Das Abo verlängert sich automatisch, wenn du es nicht spätestens 24 Stunden vor Ablauf kündigst. Abrechnung über ${KAUF.konto}, kündbar ${KAUF.kuendigen}.`}
      </Klein>
      <View style={{ flexDirection: 'row', gap: 20 }}>
        <Text style={{ minHeight: 44, textAlignVertical: 'center', paddingVertical: 12 }}><Verweis onPress={() => router.push('/bedingungen')}>Nutzungsbedingungen</Verweis></Text>
        <Text style={{ minHeight: 44, textAlignVertical: 'center', paddingVertical: 12 }}><Verweis onPress={() => router.push('/datenschutz')}>Datenschutz</Verweis></Text>
      </View>
      {!mitServer && <Klein>Vorschau-Modus: Der Knopf schaltet Pro zum Ansehen frei, es wird nichts bezahlt.</Klein>}
      <Knopf art="geist" titel="Für Eltern" onPress={() => router.push('/eltern')} />
      <Knopf art="geist" titel="Kauf wiederherstellen" onPress={() => hinweis('Keine früheren Käufe gefunden')} />
    </Seite>
  );
}
