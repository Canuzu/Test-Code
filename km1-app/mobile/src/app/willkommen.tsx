/* Der erste Start: drei kurze Fragen, dann weiß die App, für wen sie da
   ist. Alles lässt sich überspringen, und nichts davon verlässt das
   Gerät, bis ein Konto angelegt wird. */
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RADIUS, SCHRIFT, ZAHL, useThema } from '@/lib/thema';
import { ebene } from '@/daten/katalog';
import { ERST_ZEITEN, ROLLEN, ebeneFuerJahrgang, erstJahrgaenge, erstSchritte, rollenName, type ErstSchritt } from '@/daten/einfuehrung';
import { useZustand, type Rolle } from '@/daten/zustand';
import { ersterStartUebernehmen, type ErstAntworten } from '@/daten/aktionen';
import { erinnerungAktualisieren } from '@/daten/erinnern';
import { TAGE, tagName, type Tag } from '@/lib/zeit';
import { haptik } from '@/lib/haptik';
import { Klein, Leise, Titel, Ueberzeile } from '@/ui/Schrift';
import { HakenListe, Knopf, Raster, Wahl } from '@/ui/Bausteine';
import { Haken, Zurueck } from '@/ui/Symbole';

/* Die Tage in der Reihenfolge der Woche, nicht in der des Antippens. */
const wochenOrdnung = (tage: Tag[]) => TAGE.map(([k]) => k).filter((k) => tage.includes(k));

export default function Willkommen() {
  const { f } = useThema();
  const innen = useSafeAreaInsets();
  const erinnerung = useZustand((z) => z.erinnerung);
  const vorlieben = useZustand((z) => z.vorlieben);
  const [schritt, setSchritt] = useState<ErstSchritt>('rolle');
  const [a, setA] = useState<ErstAntworten>({
    rolle: null, jahrgang: vorlieben.jahrgang ?? new Date().getFullYear() - 12,
    tage: wochenOrdnung(erinnerung.tage), zeit: ERST_ZEITEN.includes(erinnerung.zeit) ? erinnerung.zeit : '17:00',
  });
  const folge = erstSchritte(a.rolle), i = folge.indexOf(schritt), eltern = a.rolle === 'eltern';

  const weiter = () => { haptik('leicht'); setSchritt(folge[i + 1]); };
  const zurueck = () => { haptik('tick'); setSchritt(folge[i - 1]); };
  const schliessen = (antworten: ErstAntworten | null, danach?: () => void) => {
    ersterStartUebernehmen(antworten);
    if (antworten && erstSchritte(antworten.rolle).includes('zeit')) erinnerungAktualisieren(false);
    if (router.canGoBack()) router.back(); else router.replace('/');
    if (danach) setTimeout(danach, 350);
  };
  const rolleWaehlen = (r: Rolle) => {
    haptik('tick');
    setA((x) => ({ ...x, rolle: r }));
    setSchritt(erstSchritte(r)[1]);
  };

  let inhalt: React.ReactNode;
  if (schritt === 'rolle') {
    inhalt = (
      <>
        <View><Ueberzeile>Willkommen bei KM1</Ueberzeile><Titel>Wer bist du?</Titel></View>
        <View style={{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }}>
          {ROLLEN.map((x, n) => (
            <Pressable key={x.r} onPress={() => rolleWaehlen(x.r)} accessibilityRole="radio"
              accessibilityState={{ checked: a.rolle === x.r }} accessibilityLabel={`${x.nm}. ${x.satz}`}
              style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
                pressed && { backgroundColor: f.surface3 }]}>
              <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: x.farbe, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: SCHRIFT.schwarz, fontSize: 15, color: '#FFFFFF' }}>{x.nm[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 16, color: f.ink }}>{x.nm}</Text>
                <Text style={{ fontFamily: SCHRIFT.text, fontSize: 14, lineHeight: 19, color: f.ink2 }}>{x.satz}</Text>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 99, borderWidth: 2, borderColor: a.rolle === x.r ? f.accent : f.line2,
                backgroundColor: a.rolle === x.r ? f.accent : 'transparent' }} />
              {n < ROLLEN.length - 1 && <View style={{ position: 'absolute', left: 60, right: 0, bottom: 0, height: 0.5, backgroundColor: f.line2 }} />}
            </Pressable>
          ))}
        </View>
      </>
    );
  } else if (schritt === 'jahrgang') {
    const lv = ebene(ebeneFuerJahrgang(a.jahrgang));
    inhalt = (
      <>
        <View><Ueberzeile>{eltern ? 'Ihr Kind' : 'Du'}</Ueberzeile>
          <Titel style={{ fontSize: 34, lineHeight: 38 }}>{eltern ? 'Welcher Jahrgang ist Ihr Kind?' : 'Welcher Jahrgang bist du?'}</Titel></View>
        <Raster spalten={4}>
          {erstJahrgaenge().map((j) => {
            const an = a.jahrgang === j;
            return (
              <Pressable key={j} onPress={() => { haptik('tick'); setA((x) => ({ ...x, jahrgang: j })); }}
                accessibilityRole="radio" accessibilityState={{ checked: an }}
                style={{ height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: an ? f.ink : f.surface3 }}>
                <Text style={[ZAHL, { fontSize: 16, color: an ? f.canvas : f.ink }]}>{j}</Text>
              </Pressable>
            );
          })}
        </Raster>
        <View style={{ backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 18, gap: 4, borderLeftWidth: 4, borderLeftColor: f.lv[lv.n - 1] }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{lv.ag.toUpperCase()}</Text>
          <Text style={{ fontFamily: SCHRIFT.display, fontSize: 26, color: f.lv[lv.n - 1] }}>{lv.nm.toUpperCase()}</Text>
          <Leise style={{ fontSize: 15, lineHeight: 21 }}>{`${eltern ? 'Damit fängt Ihr Kind an.' : 'Damit fängst du an.'} ${lv.tx}`}</Leise>
        </View>
        <Knopf titel="Weiter" onPress={weiter} />
      </>
    );
  } else if (schritt === 'zeit') {
    const frage = eltern ? 'Wann trainiert Ihr Kind?' : a.rolle === 'trainer' ? 'Wann trainiert deine Mannschaft?' : 'Wann trainierst du?';
    inhalt = (
      <>
        <View><Ueberzeile>Erinnerung</Ueberzeile><Titel style={{ fontSize: 34, lineHeight: 38 }}>{frage}</Titel></View>
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>AN DIESEN TAGEN</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {TAGE.map(([k, kurz]) => {
              const an = a.tage.includes(k);
              return (
                <Pressable key={k} accessibilityRole="checkbox" accessibilityState={{ checked: an }} accessibilityLabel={kurz}
                  onPress={() => { haptik('tick'); setA((x) => ({ ...x, tage: an ? x.tage.filter((t) => t !== k) : wochenOrdnung([...x.tage, k]) })); }}
                  style={{ flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: an ? f.ink : f.surface3 }}>
                  <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: an ? f.canvas : f.ink }}>{kurz}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>UHRZEIT</Text>
          <Wahl beschriftung="Uhrzeit" werte={ERST_ZEITEN.map((z) => [z, z] as [string, string])} wert={a.zeit}
            onWahl={(z) => { haptik('tick'); setA((x) => ({ ...x, zeit: z })); }} />
        </View>
        <Knopf titel="Weiter" onPress={weiter} />
      </>
    );
  } else {
    const zeilen = [rollenName(a.rolle!)];
    if (folge.includes('jahrgang')) zeilen.push(`Jahrgang ${a.jahrgang}, ${ebene(ebeneFuerJahrgang(a.jahrgang)).nm}`);
    if (folge.includes('zeit')) zeilen.push(a.tage.length ? `Erinnerung ${a.tage.map(tagName).join(' + ')}, ${a.zeit}` : 'Keine Erinnerung');
    const pruef = ROLLEN.find((x) => x.r === a.rolle)?.pruef;
    inhalt = (
      <>
        <View style={{ alignItems: 'center', gap: 10, paddingTop: 10 }}>
          <View style={{ width: 64, height: 64, borderRadius: 99, backgroundColor: f.gruen, alignItems: 'center', justifyContent: 'center' }}>
            <Haken farbe="#FFFFFF" groesse={32} dicke={3} />
          </View>
          <Ueberzeile mitte>Fertig</Ueberzeile>
          <Titel style={{ textAlign: 'center', marginTop: 0 }}>Alles klar.</Titel>
        </View>
        <HakenListe zeilen={zeilen} />
        {pruef ? <Klein>KM1 prüft jedes Konto, das mit Kindern arbeitet oder sie sichtet. Den Bereich für Trainer, Vereine, Akademien, Profis und Scouts gibt es vorerst in der App im Browser.</Klein> : null}
        <Knopf titel="Kostenloses Konto anlegen" onPress={() => schliessen(a, () => router.push('/anmelden?modus=neu'))} />
        <Knopf art="text" titel="Erst mal umschauen" onPress={() => schliessen(a)} />
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: f.canvas }}>
      <View style={{ paddingTop: innen.top + 6, paddingHorizontal: 12, height: innen.top + 52, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 110 }}>
          {i > 0 && schritt !== 'fertig' ? (
            <Pressable onPress={zurueck} accessibilityRole="button" accessibilityLabel="Zurück" hitSlop={10}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44 }}>
              <Zurueck farbe={f.accentInk} /><Text style={{ fontFamily: SCHRIFT.text, fontSize: 17, color: f.accentInk }}>Zurück</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: SCHRIFT.fett, fontSize: 16, color: f.ink }}>
          {schritt === 'fertig' ? '' : a.rolle ? `${i + 1} von ${folge.length - 1}` : 'Willkommen'}
        </Text>
        <View style={{ width: 110, alignItems: 'flex-end' }}>
          {schritt !== 'fertig' ? (
            <Pressable onPress={() => { haptik('leicht'); schliessen(null); }} accessibilityRole="button" hitSlop={10}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ fontFamily: SCHRIFT.text, fontSize: 17, color: f.accentInk }}>Überspringen</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: innen.bottom + 40, gap: 22, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {inhalt}
      </ScrollView>
    </View>
  );
}
