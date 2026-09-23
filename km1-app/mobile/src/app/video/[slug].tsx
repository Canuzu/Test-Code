/* Ein Video: Player, Beschreibung, die Schritte als Kapitel, der
   häufigste Fehler, Abhaken und Merken. Gesperrt zeigt es die
   Beschreibung als Vorgeschmack und den Weg zum Freischalten. */
import { useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { ebene, KAT, type Video } from '@/daten/katalog';
import { hinweis, useZustand } from '@/daten/zustand';
import { abhaken, gesperrt, merken } from '@/daten/aktionen';
import { erinnerungAktualisieren } from '@/daten/erinnern';
import { fmtZeit } from '@/lib/zeit';
import { haptik } from '@/lib/haptik';
import { Abschnitt, Fliess, Klein, Titel, Ueberzeile } from '@/ui/Schrift';
import { BILDER, Chip, Druck, Knopf, Leer, Poster, Seite } from '@/ui/Bausteine';
import { Reihe, BlockKopf } from '@/ui/Reihe';
import { setzeTempo, SpielerFlaeche, springeZu, useSpieler } from '@/ui/Spieler';
import { Haken, Herz, Person, Schloss, Suche } from '@/ui/Symbole';

const zugangName = (z: Video['zugang']) => z === 'pro' ? 'Profi-Einheit' : z === 'konto' ? 'Mit Konto' : 'Ohne Anmeldung';
const TEMPI = [0.5, 0.75, 1];

export default function VideoSeite() {
  const { f } = useThema();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const katalog = useZustand((z) => z.katalog);
  const konto = useZustand((z) => z.konto);
  const done = useZustand((z) => z.done);
  const merk = useZustand((z) => z.merk);
  useZustand((z) => z.pro);
  const v = katalog.find((x) => x.slug === slug) ?? katalog[0];
  const zu = gesperrt(v);
  const sp = useSpieler(v, !zu);
  const [tempo, setTempo] = useState(1);

  const verwandt = useMemo(() => {
    const gleich = katalog.filter((x) => x.kategorie === v.kategorie && x.slug !== v.slug).slice(0, 4);
    return gleich.length ? gleich : katalog.filter((x) => x.ebene === v.ebene && x.slug !== v.slug).slice(0, 4);
  }, [katalog, v.slug, v.kategorie, v.ebene]);

  if (!katalog.some((x) => x.slug === slug)) {
    return <Seite><Leer symbol={<Suche farbe={f.ink3} groesse={34} />} text="Dieses Video gibt es nicht mehr." /></Seite>;
  }

  const l = ebene(v.ebene), fertig = !!done[v.slug], gemerkt = !!merk[v.slug];
  const jetzt = v.schritte.reduce((a, s, i) => (s.sekunde != null && sp.zeit + 0.5 >= s.sekunde ? i : a), -1);

  const oeffnen = () => router.push(v.zugang === 'pro' ? '/abo' : '/anmelden?modus=neu&grund=konto');

  const haken = async () => {
    if (!konto) { haptik('wand'); router.push('/anmelden?modus=neu&grund=fortschritt'); return; }
    try {
      const r = await abhaken(v.slug);
      erinnerungAktualisieren();
      if (r.aufstieg) { haptik('aufstieg'); router.push('/aufstieg'); return; }
      haptik(r.abgehakt ? 'erfolg' : 'leicht');
      hinweis(r.abgehakt ? 'Abgehakt. Stark.' : 'Haken entfernt');
    } catch (e) { haptik('fehler'); hinweis((e as Error).message); }
  };
  const herz = async () => {
    if (!konto) { haptik('wand'); router.push('/anmelden?modus=neu&grund=merkliste'); return; }
    try { const an = await merken(v.slug); haptik('leicht'); hinweis(an ? 'Gemerkt' : 'Aus der Merkliste genommen'); }
    catch (e) { haptik('fehler'); hinweis((e as Error).message); }
  };

  return (
    <Seite>
      <Stack.Screen options={{ title: KAT[v.kategorie].toUpperCase() }} />
      {zu ? (
        <View style={{ marginHorizontal: -18, marginTop: -18 }}>
          <Poster v={v} verhaeltnis={16 / 9} radius={0} kinder={
            <Druck onPress={oeffnen} accessibilityRole="button"
              accessibilityLabel={v.zugang === 'pro' ? 'Mit KM1 Pro freischalten' : 'Mit Konto freischalten'}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 74, height: 74, borderRadius: 99, backgroundColor: f.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Schloss farbe="#FFFFFF" groesse={26} />
              </View>
            </Druck>
          } />
        </View>
      ) : (
        <SpielerFlaeche player={sp.player} status={sp.status} meldung={sp.meldung} erneut={sp.erneut} />
      )}

      <View>
        <Ueberzeile>{`${l.nm} · ${l.ag}`}</Ueberzeile>
        <Titel style={{ fontSize: 25, lineHeight: 27 }}>{v.titel}</Titel>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[`Ebene ${v.ebene}`, fmtZeit(v.dauer_sek), zugangName(v.zugang), ...(v.gast ? [`Gast · ${v.gast}`] : [])].map((t, i) => (
          <View key={t} style={[{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: f.surface, borderRadius: 99,
            paddingHorizontal: 12, paddingVertical: 7 }, schwebt(f)]}>
            {i === 0 && <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: f.lv[v.ebene - 1] }} />}
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{t}</Text>
          </View>
        ))}
      </View>

      {!zu && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Klein style={{ marginRight: 4 }}>Zeitlupe</Klein>
          {TEMPI.map((t) => (
            <Chip key={t} titel={String(t).replace('.', ',') + '×'} an={tempo === t}
              onPress={() => { setTempo(t); setzeTempo(sp.player, t); haptik('tick'); }} />
          ))}
        </View>
      )}

      <Fliess>{v.beschreibung}</Fliess>

      {zu ? (
        <>
          <Klein>{`${v.schritte.length || 'Mehrere'} Schritte zum Nachmachen und der häufigste Fehler, ${v.zugang === 'pro' ? 'mit KM1 Pro.' : 'mit einem kostenlosen Konto.'}`}</Klein>
          <Knopf titel={v.zugang === 'pro' ? 'Mit KM1 Pro ansehen' : 'Kostenloses Konto anlegen'} onPress={oeffnen} />
        </>
      ) : (
        <>
          <View style={{ gap: 14 }}>
            <Abschnitt>So geht’s</Abschnitt>
            <View style={{ gap: 12 }}>
              {v.schritte.map((s, i) => (
                <Druck key={s.nr} accessibilityRole="button"
                  accessibilityLabel={`Schritt ${s.nr}${s.sekunde != null ? `, springt zu ${fmtZeit(s.sekunde)}` : ''}: ${s.text}`}
                  onPress={() => { if (s.sekunde != null) { springeZu(sp.player, s.sekunde); haptik('leicht'); } }}
                  style={[{ flexDirection: 'row', gap: 14, backgroundColor: f.surface, borderRadius: RADIUS.bild,
                    paddingHorizontal: 18, paddingVertical: 16 }, schwebt(f), i === jetzt && { borderWidth: 1.5, borderColor: f.accent }]}>
                  <Text style={{ width: 22, fontFamily: SCHRIFT.monoFett, fontSize: 13, color: f.accentInk }}>{String(s.nr).padStart(2, '0')}</Text>
                  <Text style={{ flex: 1, fontFamily: SCHRIFT.text, fontSize: 16, lineHeight: 24, color: f.inkBody }}>{s.text}</Text>
                  {s.sekunde != null && (
                    <Text style={{ fontFamily: SCHRIFT.mono, fontSize: 12.5, color: i === jetzt ? f.accentInk : f.ink3 }}>{fmtZeit(s.sekunde)}</Text>
                  )}
                </Druck>
              ))}
            </View>
          </View>

          <View style={{ borderRadius: RADIUS.bild, backgroundColor: f.accentSoft, borderWidth: 1, borderColor: f.accentLine, padding: 20, paddingVertical: 18, gap: 7 }}>
            <Text style={{ fontFamily: SCHRIFT.monoFett, fontSize: 11.5, letterSpacing: 1.7, color: f.accentInk }}>HÄUFIGER FEHLER</Text>
            <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15.5, lineHeight: 23, color: f.inkBody }}>{v.fehler}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Knopf style={{ flex: 1 }} art={fertig ? 'erledigt' : 'haupt'} onPress={haken}
              titel={fertig ? 'Auf dem Platz geschafft' : 'Übung abhaken'}
              symbol={fertig ? <Haken farbe={f.lv[1]} /> : undefined} />
            <Knopf art="geist" titel="" onPress={herz} style={{ width: 56, paddingHorizontal: 0 }}
              beschriftung={gemerkt ? 'Aus der Merkliste nehmen' : 'Auf die Merkliste'}
              symbol={<Herz farbe={gemerkt ? f.accent : f.ink} gefuellt={gemerkt} />} />
          </View>

          <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: f.surface, borderRadius: RADIUS.karte,
            paddingHorizontal: 16, paddingVertical: 14 }, schwebt(f)]}>
            {v.gast
              ? <View style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: f.surface3, alignItems: 'center', justifyContent: 'center' }}><Person farbe={f.ink2} /></View>
              : <Image source={BILDER.coach} style={{ width: 52, height: 52, borderRadius: 99 }} accessibilityIgnoresInvertColors />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, color: f.ink }}>{v.gast ?? 'Kader'}</Text>
              <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 13, color: f.ink2, marginTop: 2 }}>{v.gast ? 'Zu Gast bei KM1' : 'Gründer und Trainer'}</Text>
            </View>
          </View>
        </>
      )}

      <View style={{ gap: 14 }}>
        <BlockKopf titel="Passt dazu" />
        <Reihe videos={verwandt} />
      </View>
    </Seite>
  );
}
