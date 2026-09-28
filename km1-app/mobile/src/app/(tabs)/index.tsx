/* Die Startseite hat eine Aufgabe: zeigen, was heute dran ist. Unter
   „Für dich" stehen höchstens fünf Blöcke: Hinweise in einer Karte, die
   große Karte mit dem Wochenziel, Neues, die Challenge und ein einziger
   Werbeplatz. Alles von anderen steht unter „Folge ich", wie bei
   Instagram oder Strava. */
import { useEffect, useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SCHRIFT, RADIUS, schwebt, useThema } from '@/lib/thema';
import { CHALLENGES, ebene } from '@/daten/katalog';
import { CAMP_DATEN, euro } from '@/daten/camp';
import { planStand, planWocheFrei } from '@/daten/plaene';
import { setze, useZustand, type Zustand } from '@/daten/zustand';
import { dieseWoche, gesperrt, naechstesVideo, uebtSelbst, videoFuer } from '@/daten/aktionen';
import { neuigkeitenLaden, type Neuigkeit } from '@/daten/gemeinschaft';
import { fmtZeit, heuteZeile } from '@/lib/zeit';
import { haptik } from '@/lib/haptik';
import { Titel, Ueberzeile } from '@/ui/Schrift';
import { BILDER, Druck, Held, Leer, Seite, Wahl, type HeldZiel } from '@/ui/Bausteine';
import { Kreide } from '@/ui/Kreide';
import { BlockKopf as Kopf, Reihe } from '@/ui/Reihe';
import { Kalender, Person, Weiter } from '@/ui/Symbole';

type HinweisDaten = { t: string; s: string; farbe: string; symbol: React.ReactNode; weg: () => void };

/* Mehrere Hinweise stehen in einer Karte, wie die Mitteilungen in iOS. */
function Hinweise({ liste }: { liste: HinweisDaten[] }) {
  const { f } = useThema();
  if (!liste.length) return null;
  return (
    <View style={{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }}>
      {liste.map((h, i) => (
        <Druck key={h.t} onPress={h.weg} accessibilityRole="button" accessibilityLabel={`${h.t}. ${h.s}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
          <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: h.farbe, alignItems: 'center', justifyContent: 'center' }}>
            {h.symbol}
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text numberOfLines={1} style={{ fontFamily: SCHRIFT.fett, fontSize: 16, letterSpacing: -0.3, color: f.ink }}>{h.t}</Text>
            <Text numberOfLines={1} style={{ fontFamily: SCHRIFT.text, fontSize: 14, letterSpacing: -0.15, color: f.ink2 }}>{h.s}</Text>
          </View>
          <Weiter farbe={f.ink3} />
          {i < liste.length - 1 && <View style={{ position: 'absolute', left: 60, right: 0, bottom: 0, height: 0.5, backgroundColor: f.line2 }} />}
        </Druck>
      ))}
    </View>
  );
}

/* Eine breite Karte mit Bild oben, für Challenge und Camp. */
function BreiteKarte({ bild, oben, titel, text, los, weg }: {
  bild: React.ReactNode; oben: string; titel: string; text: string; los: string; weg: () => void;
}) {
  const { f } = useThema();
  return (
    <Druck onPress={weg} accessibilityRole="button" accessibilityLabel={`${oben}: ${titel}. ${text}`}
      style={[{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }, schwebt(f)]}>
      <View style={{ aspectRatio: 2.2 }}>{bild}</View>
      <View style={{ padding: 20, paddingTop: 16, gap: 6, alignItems: 'center' }}>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15, color: f.accentInk }}>{oben}</Text>
        <Text style={{ fontFamily: SCHRIFT.display, fontSize: 30, lineHeight: 31, color: f.ink, textAlign: 'center' }}>{titel.toUpperCase()}</Text>
        <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15, lineHeight: 21, color: f.ink2, textAlign: 'center' }}>{text}</Text>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15, color: f.accentInk, marginTop: 4 }}>{los} ›</Text>
      </View>
    </Druck>
  );
}

function wochenziel(s: Zustand): HeldZiel | null {
  if (!s.konto || !uebtSelbst(s)) return null;
  const z = Math.min(dieseWoche(s), 5);
  return { anteil: z / 5, text: z >= 5 ? 'Geschafft' : `${z} von 5 diese Woche`, beschriftung: z >= 5 ? 'Wochenziel geschafft' : `${z} von 5 Einheiten diese Woche` };
}

function FuerDich({ s }: { s: Zustand }) {
  const { konto, katalog, stelle, zuletzt, pro } = s;
  const neu = useMemo(() => katalog.filter((v) => v.neu), [katalog]);
  const ch = CHALLENGES[0];

  const hinweise: HinweisDaten[] = [];
  if (!konto) {
    hinweise.push({ t: 'Kostenloses Konto anlegen', s: 'Dann merkt sich die App deinen Fortschritt', farbe: '#8E8E93',
      symbol: <Person farbe="#FFFFFF" groesse={20} />, weg: () => router.push('/anmelden?modus=neu') });
  } else if (konto.geburtsjahr == null && konto.rolle === 'spieler') {
    hinweise.push({ t: 'Sag uns dein Alter', s: 'Damit die Übungen zu dir passen', farbe: '#0A7AFF',
      symbol: <Person farbe="#FFFFFF" groesse={20} />, weg: () => router.push('/anmelden?modus=alter') });
  }
  if (s.campWunsch && !s.buchungen[CAMP_DATEN.id]) {
    hinweise.push({ t: 'Du willst ins Herbstcamp', s: 'Zeig deinen Eltern die Seite zum Buchen', farbe: '#FF9500',
      symbol: <Kalender farbe="#FFFFFF" />, weg: () => router.push('/camp') });
  }

  /* Die große Karte: das angefangene Video, sonst die nächste Einheit
     des Plans, sonst das nächste offene Video. */
  const z = zuletzt ? videoFuer(zuletzt, s) : undefined;
  const sek = z ? stelle[z.slug] : 0;
  const st = konto ? planStand(s) : null;
  const planVideo = st?.naechste && planWocheFrei(st.naechste.w, s) ? videoFuer(st.naechste.einheit.slug, s) : undefined;
  const n = naechstesVideo(s) ?? katalog[0];
  let held: React.ReactNode = null;
  if (z && sek && !gesperrt(z, s)) {
    held = <Held v={z} oben="Weitertrainieren" unten={`${fmtZeit(z.dauer_sek - sek)} übrig · ${ebene(z.ebene).nm}`}
      anteil={Math.max(3, Math.round((sek / z.dauer_sek) * 100))} ziel={wochenziel(s)} />;
  } else if (st && planVideo) {
    held = <Held v={planVideo} oben="Dein Plan" unten={st.naechste!.einheit.aufgabe}
      ziel={{ anteil: st.dieseWoche / 3, text: `Woche ${st.woche + 1}: ${st.dieseWoche} von 3`, beschriftung: `Woche ${st.woche + 1} des Plans, ${st.dieseWoche} von 3 Einheiten` }} />;
  } else if (n) {
    held = <Held v={n} oben={konto ? 'Als Nächstes' : 'Fang hier an'} unten={`${fmtZeit(n.dauer_sek)} · ${ebene(n.ebene).nm}`} ziel={wochenziel(s)} />;
  }

  /* Ein einziger Werbeplatz. Er wechselt täglich zwischen dem Abo und dem
     Camp; wer das Abo schon hat oder Kader ist, sieht das Camp. */
  const camp = (
    <BreiteKarte key="camp" bild={<Image source={BILDER.goal} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
      oben="In den Herbstferien" titel={CAMP_DATEN.titel} text={`19. bis 23. Oktober · ${euro(CAMP_DATEN.preis_cent)}`}
      los="Mehr erfahren" weg={() => router.push('/camp')} />
  );
  const abo = (
    <Druck key="abo" onPress={() => router.push('/abo')} accessibilityRole="button"
      style={{ borderRadius: RADIUS.karte, padding: 22, gap: 10, backgroundColor: '#000000', alignItems: 'center' }}>
      <Text style={{ fontFamily: SCHRIFT.schwarz, fontSize: 15, color: '#FF6A3D' }}>KM1 Pro</Text>
      <Text style={{ fontFamily: SCHRIFT.display, fontSize: 30, lineHeight: 31, color: '#FFFFFF', textAlign: 'center' }}>DIE PROFI-EINHEITEN</Text>
      <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>Ab 6,99 € im Monat. Sieben Tage gratis.</Text>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15, color: '#FF6A3D', marginTop: 2 }}>Mehr erfahren ›</Text>
    </Druck>
  );
  const werbung = pro || konto?.rolle === 'km1' ? camp : new Date().getDate() % 2 ? camp : abo;

  return (
    <>
      <Hinweise liste={hinweise} />
      {held}
      <View style={{ gap: 14 }}>
        <Kopf titel="Neu diese Woche" angabe={`${neu.length} Videos`} />
        <Reihe videos={neu} />
      </View>
      {uebtSelbst(s) && (
        <BreiteKarte bild={<Kreide kategorie="dribbling" />} oben={`Challenge im ${ch.m}`} titel="Schlag den Coach"
          text={`${ch.t}. Schaffst du ${ch.marke + 1}?`} los="Mitmachen" weg={() => router.push('/challenge')} />
      )}
      {werbung}
    </>
  );
}

/* Was KM1 selbst meldet. Mit Server die Neuigkeiten, die Kader schreibt;
   ohne Server, was in der App wirklich neu ist. */
function FolgeIch({ s }: { s: Zustand }) {
  const { f } = useThema();
  const [news, setNews] = useState<Neuigkeit[] | null>(null);
  // Neu laden, wenn sich Katalog oder Konto ändern, nicht bei jedem Haken.
  useEffect(() => { let an = true; neuigkeitenLaden(s).then((n) => { if (an) setNews(n); }); return () => { an = false; }; }, [s.katalog, s.konto]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <View style={{ gap: 14 }}>
        <Kopf titel="Neu bei KM1" />
        {(news ?? []).map((n) => (
          <Druck key={n.id} onPress={() => { if (n.ziel) router.push(n.ziel as Href); }} disabled={!n.ziel}
            accessibilityRole={n.ziel ? 'button' : undefined}
            style={[{ backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 18, gap: 6 }, schwebt(f)]}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.accentInk }}>{n.art}</Text>
            <Text style={{ fontFamily: SCHRIFT.schwarz, fontSize: 18, lineHeight: 23, letterSpacing: -0.3, color: f.ink }}>{n.titel}</Text>
            {n.text ? <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15, lineHeight: 21, color: f.ink2 }}>{n.text}</Text> : null}
          </Druck>
        ))}
      </View>
      <Leer symbol={<Person farbe={f.ink3} groesse={30} />}
        text={s.konto ? 'Wem du folgst, dessen Beiträge stehen hier: Profis, Vereine und dein Trainer.' : 'Mit einem Konto folgst du Profis, Vereinen und KM1.'} />
    </>
  );
}

export default function Start() {
  const s = useZustand((z) => z);
  const { konto, erinnerung, ersterStart } = s;
  const folge = s.startSicht === 'folge';

  /* Beim allerersten Öffnen die drei Fragen, danach nie wieder von selbst. */
  useEffect(() => {
    if (konto || ersterStart) return;
    const t = setTimeout(() => router.push('/willkommen'), 50);
    return () => clearTimeout(t);
  }, [konto, ersterStart]);

  return (
    <Seite>
      <View>
        <Ueberzeile>{konto ? heuteZeile(erinnerung.tage, erinnerung.an) : 'Ohne Anmeldung'}</Ueberzeile>
        <Titel>{konto ? `Moin ${konto.vorname}.\nWeiter geht’s.` : 'Moin.\nFang einfach an.'}</Titel>
      </View>
      <Wahl beschriftung="Startseite" werte={[['fuerdich', 'Für dich'], ['folge', 'Folge ich']]} wert={s.startSicht}
        onWahl={(w) => { setze({ startSicht: w }); haptik('tick'); }} />
      {folge ? <FolgeIch s={s} /> : <FuerDich s={s} />}
    </Seite>
  );
}
