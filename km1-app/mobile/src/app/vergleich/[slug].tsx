/* Selbstaufnahme mit Vergleich: das Kind filmt sich und sieht sich direkt
   unter Kader, in Zeitlupe und Bild für Bild. Das eigene Video bleibt auf
   dem Handy: kein Upload, keine Einwilligung, keine Moderation. Schließt
   man die Seite, ist es aus der App verschwunden. */
import { useEffect, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { RADIUS, SCHRIFT, ZAHL, useThema } from '@/lib/thema';
import { hinweis, useZustand } from '@/daten/zustand';
import { gesperrt, quelle } from '@/daten/aktionen';
import { fmtZeit } from '@/lib/zeit';
import { haptik } from '@/lib/haptik';
import { Klein, Leise, Titel, Ueberzeile } from '@/ui/Schrift';
import { Knopf, Leer, Poster, Seite, Wahl } from '@/ui/Bausteine';
import { Kamera, Pause, Play, Suche } from '@/ui/Symbole';
import { setzeTempo, springeZu } from '@/ui/Spieler';

const TEMPI: [number, string][] = [[1, '1×'], [0.5, '½×'], [0.25, '¼×']];
const BILD = 1 / 30;

/* Eigene Clips sind kurz. Zehntelsekunden, damit Bild für Bild sichtbar wird. */
const vgZeit = (t: number) => t < 60 ? t.toFixed(1).replace('.', ',') + ' s' : fmtZeit(t);

function Feld({ name, verhaeltnis, children }: { name: string; verhaeltnis: number; children: React.ReactNode }) {
  const { f } = useThema();
  return (
    <View style={{ aspectRatio: verhaeltnis, borderRadius: RADIUS.bild, overflow: 'hidden', backgroundColor: '#030706',
      maxHeight: 420, alignSelf: 'center', width: '100%' }}>
      {children}
      <View style={{ position: 'absolute', left: 10, top: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 }}>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.onMedia }}>{name}</Text>
      </View>
    </View>
  );
}

export default function Vergleich() {
  const { f } = useThema();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const katalog = useZustand((z) => z.katalog);
  useZustand((z) => z.konto); useZustand((z) => z.pro);
  const v = katalog.find((x) => x.slug === slug);

  const [kaderUrl, setKaderUrl] = useState<string | null>(null);
  const [eigen, setEigen] = useState<{ uri: string; verhaeltnis: number } | null>(null);
  const [tempo, setTempo] = useState(0.5);
  const [schritt, setSchritt] = useState(0);
  const [zeit, setZeit] = useState(0);
  const [breite, setBreite] = useState(1);

  useEffect(() => {
    if (!v || gesperrt(v)) return;
    let an = true;
    quelle(v).then((u) => { if (an) setKaderUrl(u); }).catch(() => {});
    return () => { an = false; };
  }, [v]);

  const kader = useVideoPlayer(kaderUrl ? { uri: kaderUrl, contentType: kaderUrl.includes('.m3u8') ? 'hls' : 'auto' } : null,
    (p) => { p.muted = true; });
  const selbst = useVideoPlayer(eigen ? { uri: eigen.uri } : null, (p) => { p.muted = true; p.timeUpdateEventInterval = 0.1; });
  const { isPlaying } = useEvent(selbst, 'playingChange', { isPlaying: selbst.playing });

  const kaderAb = (i: number) => v?.schritte[i]?.sekunde ?? 0;
  const { status: kaderStatus } = useEvent(kader, 'statusChange', { status: kader.status });
  // Lädt Kaders Video nicht, bleibt sein Standbild stehen, und das eigene Video läuft allein.
  const kaderLaeuft = !!kaderUrl && kaderStatus !== 'error';
  const beide = (tu: (p: VideoPlayer) => void) => { tu(selbst); if (kaderLaeuft) tu(kader); };

  useEventListener(selbst, 'timeUpdate', ({ currentTime }) => setZeit(currentTime));
  useEventListener(selbst, 'playToEnd', () => { kader.pause(); });
  useEffect(() => { beide((p) => setzeTempo(p, tempo)); }, [tempo, eigen, kaderLaeuft]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!v) return <Seite><Leer symbol={<Suche farbe={f.ink3} groesse={34} />} text="Dieses Video gibt es nicht mehr." /></Seite>;
  if (gesperrt(v)) {
    return <Seite><Leer symbol={<Kamera farbe={f.ink3} groesse={34} />} text="Vergleichen geht mit den Videos, die für dich frei sind.">
      <Knopf titel="Zurück" art="geist" onPress={() => router.back()} /></Leer></Seite>;
  }

  const waehlen = async (kamera: boolean) => {
    try {
      if (kamera) {
        const recht = await ImagePicker.requestCameraPermissionsAsync();
        if (!recht.granted) { hinweis('Ohne Kamera geht das Filmen nicht. Erlauben kannst du es in den Einstellungen des Handys.'); return; }
      }
      const optionen: ImagePicker.ImagePickerOptions = { mediaTypes: ['videos'], videoMaxDuration: 60, quality: 1 };
      const r = kamera ? await ImagePicker.launchCameraAsync(optionen) : await ImagePicker.launchImageLibraryAsync(optionen);
      const a = r.canceled ? null : r.assets?.[0];
      if (!a) return;
      const verhaeltnis = a.width && a.height ? Math.min(1.78, Math.max(0.75, a.width / a.height)) : 16 / 9;
      setEigen({ uri: a.uri, verhaeltnis });
      setZeit(0);
      haptik('erfolg');
    } catch {
      haptik('fehler'); hinweis('Das Video ließ sich nicht öffnen.');
    }
  };

  const spielen = () => {
    haptik('tick');
    if (isPlaying) { beide((p) => p.pause()); return; }
    springeZu(kader, kaderAb(schritt) + selbst.currentTime);
    beide((p) => p.play());
  };
  const bild = (r: 1 | -1) => {
    haptik('tick');
    beide((p) => p.pause());
    const t = Math.max(0, selbst.currentTime + r * BILD);
    springeZu(selbst, t); setZeit(t);
    springeZu(kader, kaderAb(schritt) + t);
  };
  const springen = (e: { nativeEvent: { locationX: number } }) => {
    const d = selbst.duration;
    if (!d) return;
    beide((p) => p.pause());
    const t = Math.max(0, Math.min(d, (e.nativeEvent.locationX / breite) * d));
    springeZu(selbst, t); setZeit(t);
    springeZu(kader, kaderAb(schritt) + t);
  };
  const versprechen = <Klein>Dein Video bleibt auf diesem Handy. Es wird nicht hochgeladen, und niemand sonst sieht es.</Klein>;

  const kaderFeld = (
    <Feld name="Kader" verhaeltnis={16 / 9}>
      {kaderLaeuft
        ? <VideoView player={kader} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls={false} />
        : <Poster v={v} verhaeltnis={16 / 9} radius={0} />}
      <View style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={[ZAHL, { fontSize: 13, color: '#FFFFFF' }]}>{fmtZeit(kaderAb(schritt) + zeit)}</Text>
      </View>
    </Feld>
  );

  if (!eigen) {
    return (
      <Seite>
        <View><Ueberzeile>Nur auf diesem Handy</Ueberzeile><Titel>Du und Kader</Titel>
          <Leise style={{ marginTop: 10 }}>Film dich bei der Übung und sieh dich direkt unter Kader, in Zeitlupe und Bild für Bild.</Leise></View>
        {kaderFeld}
        <View style={{ aspectRatio: 16 / 9, borderRadius: RADIUS.bild, borderWidth: 2, borderStyle: 'dashed', borderColor: f.line2,
          alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Kamera farbe={f.ink3} groesse={30} />
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: f.ink2 }}>Du</Text>
        </View>
        <Knopf titel="Jetzt filmen" symbol={<Kamera farbe="#FFFFFF" />} onPress={() => waehlen(true)} />
        <Knopf titel="Video auswählen" art="geist" onPress={() => waehlen(false)} />
        {versprechen}
      </Seite>
    );
  }

  const d = selbst.duration || 0;
  return (
    <Seite>
      {kaderFeld}
      <Feld name="Du" verhaeltnis={eigen.verhaeltnis}>
        <VideoView player={selbst} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls={false} />
      </Feld>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={spielen} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Anhalten' : 'Abspielen'}
          style={{ width: 48, height: 48, borderRadius: 99, backgroundColor: f.accent, alignItems: 'center', justifyContent: 'center' }}>
          {isPlaying ? <Pause farbe="#FFFFFF" /> : <View style={{ marginLeft: 3 }}><Play farbe="#FFFFFF" /></View>}
        </Pressable>
        <Pressable onPress={springen} onLayout={(e: LayoutChangeEvent) => setBreite(e.nativeEvent.layout.width || 1)}
          accessibilityRole="adjustable" accessibilityLabel="Stelle im Video" accessibilityValue={{ text: vgZeit(zeit) }}
          style={{ flex: 1, height: 44, justifyContent: 'center' }}>
          <View style={{ height: 6, borderRadius: 99, backgroundColor: f.surface3, overflow: 'hidden' }}>
            <View style={{ width: `${d ? Math.min(100, (zeit / d) * 100) : 0}%`, height: '100%', backgroundColor: f.accent }} />
          </View>
        </Pressable>
        <Text style={[ZAHL, { minWidth: 56, textAlign: 'right', fontSize: 15, color: f.ink2 }]}>{vgZeit(zeit)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Knopf style={{ flex: 1 }} art="geist" titel="Bild zurück" onPress={() => bild(-1)} />
        <Knopf style={{ flex: 1 }} art="geist" titel="Bild vor" onPress={() => bild(1)} />
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>TEMPO</Text>
        <Wahl beschriftung="Tempo" werte={TEMPI} wert={tempo} onWahl={(t) => { haptik('tick'); setTempo(t); }} />
      </View>
      {v.schritte.length > 1 && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>KADER AB</Text>
          <Wahl beschriftung="Kader ab Schritt" wert={schritt}
            werte={v.schritte.slice(0, 4).map((_, i) => [i, `Schritt ${i + 1}`] as [number, string])}
            onWahl={(i) => { haptik('tick'); setSchritt(i); springeZu(kader, kaderAb(i) + selbst.currentTime); }} />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Knopf style={{ flex: 1 }} art="geist" titel="Neu filmen" onPress={() => waehlen(true)} />
        <Knopf style={{ flex: 1 }} art="geist" titel="Verwerfen" onPress={() => { beide((p) => p.pause()); setEigen(null); setZeit(0); haptik('leicht'); }} />
      </View>
      {versprechen}
    </Seite>
  );
}
