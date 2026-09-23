/* Die Pyramide: vier Ebenen, eine Richtung. Darunter der Pfad der
   gewählten Ebene, fünf Wochen zum Abhaken. */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { ebene as ebeneVon, KAT } from '@/daten/katalog';
import { useZustand } from '@/daten/zustand';
import { gesperrt, lvFortschritt, pfad } from '@/daten/aktionen';
import { fmtZeit } from '@/lib/zeit';
import { Leise, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { Druck, Seite, Striche } from '@/ui/Bausteine';
import { BlockKopf } from '@/ui/Reihe';
import { Pyramide } from '@/ui/Pyramide';
import { Haken } from '@/ui/Symbole';

export default function PyramideSeite() {
  const { f } = useThema();
  const s = useZustand((z) => z);
  const { konto, done } = s;
  const [wahl, setWahl] = useState<number | null>(null);
  const sel = wahl ?? konto?.ebene ?? 1;
  const l = ebeneVon(sel), farbe = f.lv[sel - 1];
  const fz = lvFortschritt(s, sel);
  const liste = pfad(s, sel);

  const hier = konto && konto.ebene === sel;
  const naechste = konto && konto.ebene + 1 === sel;

  return (
    <Seite>
      <View>
        <Ueberzeile>Vier Ebenen, eine Richtung</Ueberzeile>
        <Titel>{'Die KM1-\nPyramide'}</Titel>
      </View>
      <Pyramide gewaehlt={sel} meine={konto ? konto.ebene : null}
        fortschritt={(n) => lvFortschritt(s, n)} onWaehlen={setWahl} />

      <View style={[{ backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 20, gap: 10,
        borderLeftWidth: 4, borderLeftColor: farbe }, schwebt(f)]}>
        {hier && (
          <View style={{ alignSelf: 'flex-start', backgroundColor: farbe, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12, color: f.onLv }}>Du bist hier</Text>
          </View>
        )}
        {naechste && (
          <View style={{ alignSelf: 'flex-start', borderWidth: 1.5, borderColor: farbe, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12, color: f.ink }}>Deine nächste Ebene</Text>
          </View>
        )}
        <Notiz>{`${l.md} · ${l.ag}`}</Notiz>
        <Text style={{ fontFamily: SCHRIFT.display, fontSize: 24, color: farbe }}>{`${l.nm} Area`.toUpperCase()}</Text>
        <Leise>{l.tx}</Leise>
        {konto && (
          <>
            <Striche an={fz.fertig} gesamt={fz.gesamt} farbe={farbe} />
            <Notiz>{`${fz.fertig} von ${fz.gesamt} Einheiten`}</Notiz>
          </>
        )}
      </View>

      <View style={{ gap: 14 }}>
        <BlockKopf titel="Dein Pfad" angabe={`${liste.length} Videos`} />
        <View style={{ gap: 10 }}>
          {liste.map((v) => {
            const fertig = !!done[v.slug];
            const zusatz = v.zugang === 'pro' ? ' · Profi' : (v.zugang === 'konto' && gesperrt(v, s)) ? ' · Konto' : '';
            return (
              <Druck key={v.slug} onPress={() => router.push(`/video/${v.slug}`)} accessibilityRole="button"
                accessibilityLabel={`Woche ${v.woche}: ${v.titel.replace(/­/g, '')}${fertig ? ', erledigt' : ''}`}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 15,
                  backgroundColor: f.surface, borderRadius: RADIUS.bild }, schwebt(f)]}>
                <Text style={{ width: 26, fontFamily: SCHRIFT.monoFett, fontSize: 12, color: f.ink3 }}>{`W${v.woche}`}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, lineHeight: 20, color: f.ink }}>{v.titel}</Text>
                  <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 13, color: f.ink2, marginTop: 3 }}>
                    {`${KAT[v.kategorie]} · ${fmtZeit(v.dauer_sek)}${zusatz}`}
                  </Text>
                </View>
                <View style={{ width: 26, height: 26, borderRadius: 99, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: fertig ? f.lv[1] : f.surface3 }}>
                  {fertig && <Haken farbe={f.onLv} groesse={13} dicke={2.6} />}
                </View>
              </Druck>
            );
          })}
        </View>
      </View>
    </Seite>
  );
}
