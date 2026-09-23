/* Schlag den Coach. Ansehen, nachmachen, im Training zeigen. Bewusst
   ohne Einsendungen: in der App gibt es keine fremden Videos. */
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { CHALLENGES } from '@/daten/katalog';
import { hinweis, useZustand } from '@/daten/zustand';
import { challengeUmschalten } from '@/daten/aktionen';
import { haptik } from '@/lib/haptik';
import { Abschnitt, Fliess, Titel, Ueberzeile } from '@/ui/Schrift';
import { Knopf, Seite } from '@/ui/Bausteine';
import { Kreide } from '@/ui/Kreide';
import { Haken } from '@/ui/Symbole';

export default function Challenge() {
  const { f } = useThema();
  const c = CHALLENGES[0];
  const konto = useZustand((z) => z.konto);
  const geschafft = !!useZustand((z) => z.challenges[c.id]);
  const umschalten = async () => {
    if (!konto) { haptik('wand'); router.push('/anmelden?modus=neu&grund=fortschritt'); return; }
    try { const an = await challengeUmschalten(c.id); haptik(an ? 'erfolg' : 'leicht'); hinweis(an ? 'Stark. Zeig es im Training.' : 'Haken entfernt'); }
    catch (e) { haptik('fehler'); hinweis((e as Error).message); }
  };
  return (
    <Seite>
      <View style={{ marginHorizontal: -18, marginTop: -18, aspectRatio: 16 / 9 }}><Kreide kategorie="dribbling" /></View>
      <View><Ueberzeile>{`Challenge im ${c.m}`}</Ueberzeile><Titel>Schlag den Coach</Titel></View>
      <Fliess>{c.be}</Fliess>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 20, borderRadius: RADIUS.karte, backgroundColor: f.surface }, schwebt(f)]}>
        <Text style={{ fontFamily: SCHRIFT.display, fontSize: 58, lineHeight: 60, color: f.accentInk }}>{c.marke}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, color: f.ink }}>{c.t}</Text>
          <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 13.5, color: f.ink2, marginTop: 3 }}>{`Kaders Marke · ${c.eh}`}</Text>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Abschnitt>So zählt es</Abschnitt>
        {c.rg.map((r, i) => (
          <View key={r} style={[{ flexDirection: 'row', gap: 14, padding: 16, paddingHorizontal: 18, borderRadius: RADIUS.bild, backgroundColor: f.surface }, schwebt(f)]}>
            <Text style={{ width: 22, fontFamily: SCHRIFT.monoFett, fontSize: 13, color: f.accentInk }}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={{ flex: 1, fontFamily: SCHRIFT.text, fontSize: 16, lineHeight: 24, color: f.inkBody }}>{r}</Text>
          </View>
        ))}
      </View>
      <Knopf art={geschafft ? 'erledigt' : 'haupt'} titel={geschafft ? 'Geschafft, zeig es im Training' : `Ich habe ${c.marke + 1} geschafft`}
        symbol={geschafft ? <Haken farbe={f.lv[1]} /> : undefined} onPress={umschalten} />
      <View style={{ gap: 10 }}>
        <Abschnitt>Frühere Challenges</Abschnitt>
        {CHALLENGES.slice(1).map((x) => (
          <View key={x.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, paddingHorizontal: 18, borderRadius: RADIUS.bild, backgroundColor: f.surface }, schwebt(f)]}>
            <Text style={{ width: 34, fontFamily: SCHRIFT.monoFett, fontSize: 12, color: f.ink3 }}>{x.m.slice(0, 3).toUpperCase()}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, color: f.ink }}>{x.t}</Text>
              <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 13, color: f.ink2, marginTop: 3 }}>{`Kader: ${x.marke} ${x.eh}`}</Text>
            </View>
          </View>
        ))}
      </View>
    </Seite>
  );
}
