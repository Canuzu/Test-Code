/* Ein Trainingsplan: sechs Wochen, drei Einheiten pro Woche. Die erste
   Woche ist mit Konto frei, die übrigen gehören zu KM1 Pro. */
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { RADIUS, SCHRIFT, ZAHL, useThema } from '@/lib/thema';
import { ebene } from '@/daten/katalog';
import { planSchluessel, planStand, planVon, planWocheFrei } from '@/daten/plaene';
import { hinweis, useZustand } from '@/daten/zustand';
import { planBeenden, planHaken, planStarten, videoFuer } from '@/daten/aktionen';
import { haptik } from '@/lib/haptik';
import { bestaetigen } from '@/lib/fragen';
import { Abschnitt, Klein, Leise, Titel, Ueberzeile } from '@/ui/Schrift';
import { Knopf, Leer, Seite, Striche } from '@/ui/Bausteine';
import { Haken, Schloss, Suche } from '@/ui/Symbole';

export default function PlanSeite() {
  const { f } = useThema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useZustand((z) => z);
  const plan = planVon(id);
  if (!plan) return <Seite><Leer symbol={<Suche farbe={f.ink3} groesse={34} />} text="Diesen Plan gibt es nicht mehr." /></Seite>;

  const an = s.plan?.id === plan.id, st = an ? planStand(s) : null;
  const farbe = f.lv[plan.ebene - 1];

  const starten = async () => {
    if (!s.konto) { haptik('wand'); router.push('/anmelden?modus=neu&grund=fortschritt'); return; }
    if (s.plan && s.plan.id !== plan.id) {
      const ok = await bestaetigen('Plan wechseln?', `„${planVon(s.plan.id)?.titel}" endet dann. Was du dort abgehakt hast, zählt nicht mehr.`, 'Wechseln');
      if (!ok) return;
    }
    try { await planStarten(plan.id); haptik('erfolg'); hinweis('Plan gestartet. Los geht’s.'); }
    catch (e) { haptik('fehler'); hinweis((e as Error).message); }
  };
  const haken = async (w: number, e: number) => {
    try {
      const r = await planHaken(w, e);
      haptik(r.geschafft ? 'aufstieg' : r.an ? 'erfolg' : 'leicht');
      hinweis(r.geschafft ? 'Plan geschafft. Stark.' : r.an ? 'Einheit abgehakt' : 'Haken entfernt');
    } catch (err) { haptik('fehler'); hinweis((err as Error).message); }
  };
  const beenden = async () => {
    const ok = await bestaetigen('Plan beenden?', 'Deine Haken in diesem Plan gehen dabei verloren.', 'Beenden');
    if (!ok) return;
    try { await planBeenden(); haptik('leicht'); hinweis('Plan beendet'); }
    catch (e) { haptik('fehler'); hinweis((e as Error).message); }
  };

  return (
    <Seite>
      <View>
        <Ueberzeile>{`${ebene(plan.ebene).nm} · ${plan.fuer}`}</Ueberzeile>
        <Titel style={{ fontSize: 34, lineHeight: 38 }}>{plan.titel}</Titel>
        <Leise style={{ marginTop: 10 }}>{plan.satz}</Leise>
      </View>

      {st ? (
        <View style={{ backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 18, gap: 10 }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>
            {st.naechste ? `WOCHE ${st.woche + 1} VON ${plan.wochen.length}` : 'GESCHAFFT'}
          </Text>
          <Striche an={st.fertig} gesamt={st.gesamt} farbe={farbe} />
          <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15, color: f.ink2 }}>{`${st.fertig} von ${st.gesamt} Einheiten${st.naechste ? '' : '. Stark.'}`}</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {([[plan.wochen.length, 'Wochen'], [plan.wochen.length * 3, 'Einheiten'], [plan.minuten, 'Minuten']] as const).map(([v, k]) => (
              <View key={k} style={{ flex: 1, backgroundColor: f.surface, borderRadius: RADIUS.bild, paddingVertical: 14, paddingHorizontal: 12 }}>
                <Text style={[ZAHL, { fontSize: 26, color: farbe }]}>{v}</Text>
                <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: f.ink2 }}>{k}</Text>
              </View>
            ))}
          </View>
          <Knopf titel={s.konto ? 'Plan starten' : 'Mit Konto starten'} onPress={starten} />
          <Klein style={{ marginTop: -12 }}>Die erste Woche ist mit Konto frei, die übrigen fünf gehören zu KM1 Pro.</Klein>
        </>
      )}

      {plan.wochen.map((woche, w) => {
        const frei = planWocheFrei(w, s) || (!s.konto && w === 0);
        return (
          <View key={w} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Abschnitt style={{ fontSize: 19 }}>{`Woche ${w + 1}`}</Abschnitt>
              {frei ? null : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Schloss farbe={f.ink2} groesse={14} /><Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: f.ink2 }}>Pro</Text>
                </View>
              )}
            </View>
            <View style={{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }}>
              {woche.map((einheit, e) => {
                const v = videoFuer(einheit.slug, s);
                const fertig = an && !!s.plan!.done[planSchluessel(w, e)];
                const jetzt = st?.naechste?.w === w && st.naechste.e === e;
                return (
                  <View key={e} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingRight: 8, paddingVertical: 10 },
                    jetzt && { backgroundColor: f.accentSoft }]}>
                    <Text style={[ZAHL, { width: 18, fontSize: 15, color: jetzt ? f.accentInk : f.ink3 }]}>{e + 1}</Text>
                    <Pressable style={{ flex: 1, paddingVertical: 4 }} accessibilityRole="button"
                      accessibilityLabel={`${v?.titel.replace(/­/g, '') ?? einheit.slug}. ${einheit.aufgabe}${frei ? '' : ', mit Pro'}`}
                      onPress={() => router.push(frei && v ? `/video/${v.slug}` : '/abo')}>
                      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 16, color: f.ink }} numberOfLines={2}>{v?.titel ?? einheit.slug}</Text>
                      <Text style={{ fontFamily: SCHRIFT.text, fontSize: 14, lineHeight: 19, color: f.ink2 }}>{einheit.aufgabe}</Text>
                    </Pressable>
                    {an && frei ? (
                      <Pressable onPress={() => haken(w, e)} accessibilityRole="checkbox" accessibilityState={{ checked: fertig }}
                        accessibilityLabel={`Einheit ${e + 1} in Woche ${w + 1} erledigt`} hitSlop={6}
                        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: fertig ? f.gruen : 'transparent', borderWidth: fertig ? 0 : 2, borderColor: f.line2 }}>
                          {fertig ? <Haken farbe="#FFFFFF" groesse={16} dicke={3} /> : null}
                        </View>
                      </Pressable>
                    ) : (
                      <View style={{ width: 44, alignItems: 'center' }}>{frei ? null : <Schloss farbe={f.ink3} groesse={16} />}</View>
                    )}
                    {e < woche.length - 1 && <View style={{ position: 'absolute', left: 44, right: 0, bottom: 0, height: 0.5, backgroundColor: f.line2 }} />}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {an && <Knopf art="text" titel="Plan beenden" onPress={beenden} />}
    </Seite>
  );
}
