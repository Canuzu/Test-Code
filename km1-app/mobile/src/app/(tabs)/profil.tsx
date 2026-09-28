/* Das Profil zeigt das Ich und die eigenen Sachen. Alles, was man
   einstellt statt benutzt, liegt hinter dem Zahnrad oben rechts. */
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, ZAHL, useThema } from '@/lib/thema';
import { ebene } from '@/daten/katalog';
import { CAMP_DATEN } from '@/daten/camp';
import { planStand } from '@/daten/plaene';
import { useZustand } from '@/daten/zustand';
import { offenFuerMich, serieWochen, uebungen } from '@/daten/aktionen';
import { meineEbene } from '@/daten/einfuehrung';
import { monatText } from '@/lib/zeit';
import { Leise, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { BILDER, Initialen, Knopf, Panel, Seite, Striche, Zeile, Zeilen } from '@/ui/Bausteine';
import { PlanReihe } from '@/ui/Plan';
import { Zahnrad } from '@/ui/Symbole';

function Kopf({ oben, titel }: { oben: string; titel: string }) {
  const { f } = useThema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ flex: 1 }}><Ueberzeile>{oben}</Ueberzeile><Titel>{titel}</Titel></View>
      <Pressable onPress={() => router.push('/einstellungen')} accessibilityRole="button" accessibilityLabel="Einstellungen"
        hitSlop={8} style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 99, alignItems: 'center', justifyContent: 'center',
          backgroundColor: f.surface3 }, pressed && { opacity: 0.7 }]}>
        <Zahnrad farbe={f.ink2} />
      </Pressable>
    </View>
  );
}

export default function Profil() {
  const { f } = useThema();
  const s = useZustand((z) => z);
  const { konto, merk, buchungen } = s;

  if (!konto) {
    return (
      <Seite>
        <Kopf oben="Gast" titel={'Du schaust\nohne Konto zu.'} />
        <Panel>
          <Leise>Mit einem kostenlosen Konto merkt sich die App, was du geschafft hast, und du kannst einen Trainingsplan starten.</Leise>
          <Knopf titel="Konto anlegen" onPress={() => router.push('/anmelden?modus=neu')} />
          <Knopf titel="Anmelden" art="geist" onPress={() => router.push('/anmelden?modus=alt')} />
        </Panel>
        <Zeilen>
          <Zeile titel="Die KM1-Pyramide" wert={ebene(meineEbene(s)).nm} onPress={() => router.push('/weg')} letzte />
        </Zeilen>
        <PlanReihe />
      </Seite>
    );
  }

  const l = ebene(konto.ebene), farbe = f.lv[konto.ebene - 1];
  const kader = konto.rolle === 'km1';
  const zahlen: [number, string][] = [[uebungen(s).length, 'Übungen'], [offenFuerMich(s), 'Offen'], [serieWochen(s), 'Wochen­serie']];
  const st = planStand(s);
  const buchung = buchungen[CAMP_DATEN.id];
  return (
    <Seite>
      <Kopf oben={kader ? 'KM1' : l.nm} titel="Profil" />

      {konto.geburtsjahr == null && konto.rolle === 'spieler' && (
        <Panel style={{ borderWidth: 1.5, borderColor: f.accentLine }}>
          <Notiz>Noch ein Schritt</Notiz>
          <Leise style={{ color: f.ink }}>Sag uns dein Alter. Unter 16 Jahren legen die Eltern das Konto an.</Leise>
          <Knopf titel="Alter angeben" onPress={() => router.push('/anmelden?modus=alter')} />
        </Panel>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {kader
          ? <Image source={BILDER.coach} style={{ width: 64, height: 64, borderRadius: 99 }} accessibilityLabel="Kader" />
          : <Initialen name={konto.vorname} farbe={farbe} />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: SCHRIFT.schwarz, fontSize: 22, letterSpacing: -0.4, color: f.ink }}>{konto.vorname}</Text>
          <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15, color: f.ink2, marginTop: 2 }}>
            {kader ? 'Gründer und Trainer' : `${l.nm} · seit ${monatText(konto.seit)}`}
          </Text>
        </View>
      </View>

      {!kader && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {zahlen.map(([v, k]) => (
            <View key={k} style={{ flex: 1, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 12, gap: 2,
              backgroundColor: f.surface, borderRadius: RADIUS.bild }}>
              <Text style={[ZAHL, { fontSize: 28, lineHeight: 32, color: farbe }]}>{v}</Text>
              <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{k}</Text>
            </View>
          ))}
        </View>
      )}

      {st && (
        <Pressable onPress={() => router.push(`/plan/${st.plan.id}`)} accessibilityRole="button"
          accessibilityLabel={`Dein Plan: ${st.plan.titel}, ${st.fertig} von ${st.gesamt} Einheiten`}
          style={({ pressed }) => [{ backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 18, gap: 10 }, pressed && { opacity: 0.9 }]}>
          <Notiz>{st.naechste ? `Dein Plan · Woche ${st.woche + 1} von ${st.plan.wochen.length}` : 'Dein Plan · geschafft'}</Notiz>
          <Text style={{ fontFamily: SCHRIFT.schwarz, fontSize: 18, color: f.ink }}>{st.plan.titel}</Text>
          <Striche an={st.fertig} gesamt={st.gesamt} farbe={f.lv[st.plan.ebene - 1]} />
          <Text style={{ fontFamily: SCHRIFT.text, fontSize: 14, color: f.ink2 }}>{`${st.fertig} von ${st.gesamt} Einheiten`}</Text>
        </Pressable>
      )}

      <Zeilen>
        {kader ? null : <Zeile titel="Mein Weg" wert={l.nm} onPress={() => router.push('/weg')} />}
        <Zeile titel="Merkliste" wert={String(Object.keys(merk).length)} onPress={() => router.push('/merkliste')} />
        {buchung ? <Zeile titel={CAMP_DATEN.titel} wert={buchung.nr} onPress={() => router.push('/camp')} /> : null}
        <Zeile titel="Challenge" wert="Schlag den Coach" onPress={() => router.push('/challenge')} letzte />
      </Zeilen>

      {!st && !kader && <PlanReihe />}

      {kader && (
        <Panel>
          <Notiz>Für Kader</Notiz>
          <Leise>Du siehst alle Videos, auch die Profi-Einheiten. Prüfen, freigeben und Neuigkeiten schreiben geht vorerst in der App im Browser; hochgeladen wird im Supabase-Dashboard.</Leise>
        </Panel>
      )}
    </Seite>
  );
}
