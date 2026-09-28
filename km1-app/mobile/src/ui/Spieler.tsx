/* Der Videoplayer. Die Bedienung kommt vom System (iPhone und Android):
   Spulen, Vollbild, Bild im Bild, und bei einem Anruf hält das System
   das Video an. Dazu kommt, was es nur bei KM1 gibt: Kapitel aus den
   Schritten und die Zeitlupe.

   Der Strom ist HLS, wo es geht: die Qualität passt sich dem Netz an,
   und das Video liegt nicht als eine Datei herum.

   Drei Fehlerzustände fängt der Player selbst ab: ohne Netz sagt er es,
   statt sich endlos zu drehen, und lädt von allein, sobald das Netz
   zurück ist. Lädt das Video nicht, gibt es „Erneut versuchen". Und wer
   das Handy sperrt oder angerufen wird, findet das Video angehalten an
   derselben Stelle wieder. */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { SCHRIFT, useThema } from '@/lib/thema';
import { quelle, stelleMerken } from '@/daten/aktionen';
import { hinweis, lies, useZustand } from '@/daten/zustand';
import { fmtZeit } from '@/lib/zeit';
import type { Video } from '@/daten/katalog';
import { Knopf } from './Bausteine';

/* Der Player gehört expo-video. Gesetzt wird über diese beiden
   Funktionen, nicht direkt im Bildschirm. */
export function springeZu(p: VideoPlayer, sek: number) { p.currentTime = sek; }
export function setzeTempo(p: VideoPlayer, tempo: number) { p.playbackRate = tempo; }

/* Welche Player schon an der gemerkten Stelle angesetzt haben. */
const angesetzt = new WeakSet<VideoPlayer>();

export function useSpieler(v: Video, aktiv: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [versuch, setVersuch] = useState(0);
  const [zeit, setZeit] = useState(0);
  const offline = useZustand((z) => z.offline);
  const bildImBild = useRef(false);

  useEffect(() => {
    if (!aktiv) return;
    if (lies().offline) return;          // ohne Netz gar nicht erst versuchen
    let vorbei = false;
    quelle(v).then((u) => { if (!vorbei) setUrl(u); })
      .catch((e) => { if (!vorbei) setFehler(e.message); });
    return () => { vorbei = true; };
  }, [v, aktiv, versuch]);

  // Kommt das Netz zurück, lädt das Video von allein.
  const warOffline = useRef(offline);
  useEffect(() => {
    if (warOffline.current && !offline && (!url || fehler)) { setFehler(null); setUrl(null); setVersuch((n) => n + 1); }
    warOffline.current = offline;
  }, [offline, url, fehler]);

  const player = useVideoPlayer(
    url ? { uri: url, contentType: url.includes('.m3u8') ? 'hls' : 'auto' } : null,
    (p) => { p.timeUpdateEventInterval = 1; },
  );
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });

  /* Sobald die Datei da ist, an der Stelle ansetzen, an der man zuletzt
     aufgehört hat. Nicht jede Plattform meldet beide Ereignisse, deshalb
     hören wir auf beide, und das erste gewinnt. */
  const ansetzen = () => {
    if (angesetzt.has(player)) return;
    angesetzt.add(player);
    const s = lies().stelle[v.slug];
    if (s) springeZu(player, s);
  };
  useEventListener(player, 'sourceLoad', ansetzen);
  useEventListener(player, 'statusChange', ({ status: neu }) => { if (neu === 'readyToPlay') ansetzen(); });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setZeit(currentTime);
    // Vor dem Ansetzen meldet der Player 0. Das darf die gemerkte Stelle
    // nicht überschreiben, sonst fängt das Video jedes Mal vorn an.
    if (!angesetzt.has(player)) return;
    const dauer = player.duration || v.dauer_sek;
    // Nicht jede Sekunde schreiben: alle fünf Sekunden reicht.
    const gemerkt = lies().stelle[v.slug] ?? 0;
    if (Math.abs(currentTime - gemerkt) >= 5 || currentTime / dauer > 0.95) stelleMerken(v.slug, currentTime, dauer);
  });

  // Beim Anhalten die genaue Stelle festhalten: das ist der Moment, in dem
  // ein Kind rausgeht und übt.
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying || !angesetzt.has(player)) return;
    stelleMerken(v.slug, player.currentTime, player.duration || v.dauer_sek);
  });

  /* Sperrbildschirm, Anruf, anderer App-Wechsel: anhalten, Stelle merken
     und beim Zurückkommen sagen, wo es steht. Im Bild-im-Bild läuft das
     Video weiter, dafür ist es da. */
  const angehalten = useRef<number | null>(null);
  useEffect(() => {
    const abo = AppState.addEventListener('change', (neu) => {
      if (neu !== 'active') {
        if (player.playing && !bildImBild.current) {
          player.pause();
          angehalten.current = player.currentTime;
          if (angesetzt.has(player)) stelleMerken(v.slug, player.currentTime, player.duration || v.dauer_sek);
        }
      } else if (angehalten.current != null) {
        hinweis(`Angehalten bei ${fmtZeit(angehalten.current)}`);
        angehalten.current = null;
      }
    });
    return () => abo.remove();
  }, [player, v.slug, v.dauer_sek]);

  // Beim Verlassen ebenso.
  useEffect(() => () => {
    if (!angesetzt.has(player)) return;
    try { stelleMerken(v.slug, player.currentTime, player.duration || v.dauer_sek); } catch {}
  }, [player, v.slug, v.dauer_sek]);

  const erneut = () => { angesetzt.delete(player); setFehler(null); setUrl(null); setVersuch((n) => n + 1); };
  const ohneNetz = offline && (!url || status === 'error' || !!fehler);
  const meldung = ohneNetz ? 'Kein Netz. Das Video lädt, sobald du wieder online bist.'
    : fehler ?? (status === 'error' ? 'Das Video lässt sich gerade nicht laden.' : null);
  const bildImBildWechsel = (an: boolean) => { bildImBild.current = an; };
  return { player, status, meldung, ohneNetz, erneut, zeit, bildImBildWechsel, technisch: error?.message };
}

export function SpielerFlaeche({ player, status, meldung, ohneNetz, erneut, bildImBildWechsel }: {
  player: VideoPlayer; status: string; meldung: string | null; ohneNetz?: boolean; erneut: () => void;
  bildImBildWechsel?: (an: boolean) => void;
}) {
  const { f } = useThema();
  return (
    <View style={{ aspectRatio: 16 / 9, backgroundColor: '#030706', marginHorizontal: -18, marginTop: -18 }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain"
        nativeControls allowsPictureInPicture
        onPictureInPictureStart={() => bildImBildWechsel?.(true)} onPictureInPictureStop={() => bildImBildWechsel?.(false)}
        fullscreenOptions={{ enable: true, orientation: 'landscape' }} />
      {status === 'loading' && !meldung && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={f.onMedia} size="large" accessibilityLabel="Video lädt" />
        </View>
      )}
      {meldung && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: 24, backgroundColor: 'rgba(3,7,6,0.82)' }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15, color: f.onMedia, textAlign: 'center' }}>{meldung}</Text>
          {ohneNetz ? null : (
            <>
              <Text style={{ fontFamily: SCHRIFT.text, fontSize: 13.5, color: 'rgba(244,247,243,0.75)', textAlign: 'center' }}>
                Oft liegt es am Netz. Ein zweiter Versuch holt auch einen neuen Abspiellink.
              </Text>
              <Knopf titel="Erneut versuchen" onPress={erneut} style={{ minWidth: 200 }} />
            </>
          )}
        </View>
      )}
    </View>
  );
}
