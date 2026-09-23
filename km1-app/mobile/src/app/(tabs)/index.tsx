/* Die Startseite: Begrüßung, die große Karte mit dem nächsten Video,
   Neues, Wochenziel, Challenge, Profi-Einheiten und das Camp. */
import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SCHRIFT, RADIUS, schwebt, useThema } from '@/lib/thema';
import { CAMP, CHALLENGES, ebene } from '@/daten/katalog';
import { useZustand } from '@/daten/zustand';
import { dieseWoche, gesperrt, naechstesVideo, videoFuer } from '@/daten/aktionen';
import { fmtZeit, heuteZeile } from '@/lib/zeit';
import { Abschnitt, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { BILDER, Druck, Held, Knopf, Panel, Seite, Striche } from '@/ui/Bausteine';
import { Kreide } from '@/ui/Kreide';
import { BlockKopf as Kopf, Reihe } from '@/ui/Reihe';



export default function Start() {
  const { f } = useThema();
  const s = useZustand((z) => z);
  const { konto, katalog, stelle, zuletzt, pro, erinnerung } = s;

  const neu = katalog.filter((v) => v.neu);
  const profi = katalog.filter((v) => v.zugang === 'pro');
  const ch = CHALLENGES[0];

  /* Die große Karte: das angefangene Video, sonst das nächste offene. */
  const z = zuletzt ? videoFuer(zuletzt, s) : undefined;
  const sek = z ? stelle[z.slug] : 0;
  const n = naechstesVideo(s) ?? katalog[0];
  const held = z && sek && !gesperrt(z, s)
    ? <Held v={z} oben="Weitertrainieren" unten={`${fmtZeit(z.dauer_sek - sek)} übrig · ${ebene(z.ebene).nm}`}
        anteil={Math.max(3, Math.round((sek / z.dauer_sek) * 100))} />
    : n ? <Held v={n} oben={konto ? 'Als Nächstes' : 'Fang hier an'} unten={`${fmtZeit(n.dauer_sek)} · ${ebene(n.ebene).nm}`} /> : null;

  const ziel = konto ? Math.min(dieseWoche(s), 5) : 0;
  const meine = konto ? f.lv[konto.ebene - 1] : f.accent;

  return (
    <Seite>
      <View>
        <Ueberzeile>{konto ? heuteZeile(erinnerung.tage, erinnerung.an) : 'Ohne Anmeldung'}</Ueberzeile>
        <Titel>{konto ? `Moin ${konto.vorname}.\nWeiter geht’s.` : 'Moin.\nFang einfach an.'}</Titel>
      </View>
      {held}

      <View style={{ gap: 14 }}>
        <Kopf titel="Neu diese Woche" angabe={`${neu.length} Videos`} />
        <Reihe videos={neu} />
      </View>

      {konto ? (
        <Panel traegt>
          <Notiz>Dein Wochenziel</Notiz>
          <Text style={{ fontFamily: SCHRIFT.display, fontSize: 46, lineHeight: 46, color: meine }}>
            {ziel}<Text style={{ fontFamily: SCHRIFT.fett, fontSize: 17, color: f.ink3 }}> / 5 Einheiten</Text>
          </Text>
          <Striche an={ziel} gesamt={5} farbe={meine} />
        </Panel>
      ) : (
        <Panel>
          <Notiz>Kostenlos</Notiz>
          <Abschnitt>Fortschritt sichern</Abschnitt>
          <Knopf titel="Konto anlegen" onPress={() => router.push('/anmelden?modus=neu')} />
          <Knopf titel="Ich habe schon eins" art="geist" onPress={() => router.push('/anmelden?modus=alt')} />
        </Panel>
      )}

      <Druck onPress={() => router.push('/challenge')} accessibilityRole="button"
        style={[{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }, schwebt(f)]}>
        <View style={{ aspectRatio: 2 }}>
          <Kreide kategorie="dribbling" />
          <View style={{ position: 'absolute', left: 10, top: 10, backgroundColor: 'rgba(244,247,243,0.94)', borderRadius: RADIUS.schild, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 11, letterSpacing: 0.7, color: '#0A1411' }}>{`CHALLENGE ${ch.m.toUpperCase()}`}</Text>
          </View>
        </View>
        <View style={{ padding: 20, paddingTop: 18, gap: 9 }}>
          <Text style={{ fontFamily: SCHRIFT.display, fontSize: 22, color: f.ink }}>SCHLAG DEN COACH</Text>
          <Text style={{ fontFamily: SCHRIFT.text, fontSize: 14.5, lineHeight: 22, color: f.ink2 }}>
            {`${ch.t}. Kader steht bei ${ch.marke}. Schaffst du ${ch.marke + 1}?`}
          </Text>
        </View>
      </Druck>

      <View style={{ gap: 14 }}>
        <Kopf titel="Profi-Einheiten" angabe={pro ? 'Freigeschaltet' : 'Mit Pro'} />
        <Reihe videos={profi} />
      </View>

      {!pro && (
        <Druck onPress={() => router.push('/abo')} accessibilityRole="button"
          style={{ borderRadius: RADIUS.karte, padding: 22, paddingVertical: 24, gap: 14, backgroundColor: f.accent }}>
          <Text style={{ fontFamily: SCHRIFT.monoFett, fontSize: 11.5, letterSpacing: 1.7, color: 'rgba(255,255,255,0.82)' }}>KM1 PRO</Text>
          <Text style={{ fontFamily: SCHRIFT.display, fontSize: 27, lineHeight: 28, color: '#FFFFFF' }}>{'DIE PROFIS.\nAUS DER NÄHE.'}</Text>
          <Text style={{ fontFamily: SCHRIFT.text, fontSize: 14.5, lineHeight: 22, color: 'rgba(255,255,255,0.9)' }}>{`${profi.length} Einheiten mit aktiven Profispielern.`}</Text>
          <Knopf titel="Pro ansehen" art="weiss" onPress={() => router.push('/abo')} />
        </Druck>
      )}

      <Druck onPress={() => router.push('/camp')} accessibilityRole="button"
        style={[{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }, schwebt(f)]}>
        <Image source={BILDER.goal} style={{ width: '100%', aspectRatio: 2 }} resizeMode="cover" />
        <View style={{ padding: 20, paddingTop: 18, gap: 9 }}>
          <Text style={{ fontFamily: SCHRIFT.display, fontSize: 22, color: f.ink }}>{CAMP.titel.toUpperCase()}</Text>
          <Text style={{ fontFamily: SCHRIFT.text, fontSize: 14.5, lineHeight: 22, color: f.ink2 }}>{CAMP.kurz}</Text>
        </View>
      </Druck>
    </Seite>
  );
}
