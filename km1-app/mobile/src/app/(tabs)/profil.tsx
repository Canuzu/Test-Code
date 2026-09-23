/* Das Profil: wer ich bin, wie weit ich bin, und alle Einstellungen. */
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { ebene, LINKS, preisText } from '@/daten/katalog';
import { setze, useZustand } from '@/daten/zustand';
import { abmelden, offenFuerMich, serieWochen, uebungen } from '@/daten/aktionen';
import { datumText, erinnerungText, monatText } from '@/lib/zeit';
import { haptik } from '@/lib/haptik';
import { Abschnitt, Leise, Notiz, Titel, Ueberzeile } from '@/ui/Schrift';
import { BILDER, Druck, Initialen, Knopf, Panel, Seite, Zeile, Zeilen } from '@/ui/Bausteine';
import { loeschenFragen } from '@/ui/Konto';


function Darstellung() {
  const { f } = useThema();
  const thema = useZustand((z) => z.thema);
  return (
    <View style={{ gap: 14 }}>
      <Notiz>Darstellung</Notiz>
      <View style={{ flexDirection: 'row', gap: 6, padding: 6, backgroundColor: f.surface3, borderRadius: RADIUS.knopf }}>
        {(['hell', 'dunkel', 'auto'] as const).map((t) => {
          const an = thema === t;
          return (
            <Pressable key={t} onPress={() => { setze({ thema: t }); haptik('leicht'); }}
              accessibilityRole="button" accessibilityState={{ selected: an }}
              style={[{ flex: 1, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
                an && [{ backgroundColor: f.surface }, schwebt(f)]]}>
              <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: an ? f.ink : f.inkBody }}>
                {t === 'hell' ? 'Hell' : t === 'dunkel' ? 'Dunkel' : 'Automatisch'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Profil() {
  const { f } = useThema();
  const s = useZustand((z) => z);
  const { konto, pro, abo, erinnerung, merk } = s;
  const zahlen = { uebungen: uebungen(s).length, offen: offenFuerMich(s), serie: serieWochen(s) };

  const allgemein = (
    <>
      <Zeile titel="Erinnerung" wert={erinnerungText(erinnerung)} onPress={() => router.push('/erinnerung')} />
      <Zeile titel="Für Eltern" wert="Lesen" onPress={() => router.push('/eltern')} />
      <Zeile titel="Datenschutz" wert="Lesen" onPress={() => router.push('/datenschutz')} />
      <Zeile titel="Nutzungsbedingungen" wert="Lesen" onPress={() => router.push('/bedingungen')} />
      <Zeile titel="Impressum" wert="km1-training.de" onPress={() => Linking.openURL(LINKS.impressum)} letzte={!konto} />
    </>
  );

  if (!konto) {
    return (
      <Seite>
        <View>
          <Ueberzeile>Gast</Ueberzeile>
          <Titel>{'Du schaust\nohne Konto zu.'}</Titel>
        </View>
        <Panel>
          <Notiz>Kostenlos</Notiz>
          <Knopf titel="Konto anlegen" onPress={() => router.push('/anmelden?modus=neu')} />
          <Knopf titel="Anmelden" art="geist" onPress={() => router.push('/anmelden?modus=alt')} />
        </Panel>
        <Darstellung />
        <Zeilen>{allgemein}</Zeilen>
      </Seite>
    );
  }

  const l = ebene(konto.ebene), farbe = f.lv[konto.ebene - 1];
  const trainer = konto.rolle === 'trainer';
  return (
    <Seite>
      {konto.geburtsjahr == null && !trainer && (
        <Panel traegt style={{ borderWidth: 1.5, borderColor: f.accentLine }}>
          <Notiz>Noch ein Schritt</Notiz>
          <Leise style={{ color: f.ink }}>Sag uns dein Alter. Unter 16 Jahren legen die Eltern das Konto an.</Leise>
          <Knopf titel="Alter angeben" onPress={() => router.push('/anmelden?modus=alter')} />
        </Panel>
      )}

      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: f.surface,
        borderRadius: RADIUS.karte, paddingVertical: 14, paddingHorizontal: 16 }, schwebt(f)]}>
        {trainer
          ? <Image source={BILDER.coach} style={{ width: 52, height: 52, borderRadius: 99 }} accessibilityLabel="Kader" />
          : <Initialen name={konto.vorname} farbe={farbe} />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, color: f.ink }}>{konto.vorname}</Text>
          <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 13, color: f.ink2, marginTop: 2 }}>
            {`${l.nm} · seit ${monatText(konto.seit)}`}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[[zahlen.uebungen, 'Übungen'], [zahlen.offen, 'Offen'], [zahlen.serie, 'Wochen­serie']].map(([v, k]) => (
          <View key={String(k)} style={[{ flex: 1, paddingTop: 15, paddingBottom: 13, paddingHorizontal: 11, gap: 3,
            backgroundColor: f.surface, borderRadius: RADIUS.bild }, schwebt(f)]}>
            <Text style={{ fontFamily: SCHRIFT.display, fontSize: 30, lineHeight: 32, color: farbe }}>{v}</Text>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12, color: f.ink2 }}>{k}</Text>
          </View>
        ))}
      </View>

      {pro ? (
        <Panel>
          <Notiz style={{ color: f.lv[1] }}>KM1 Pro aktiv</Notiz>
          <Leise>{abo?.preis ? `Gratis bis ${datumText(abo.bis)}, danach ${preisText(abo.preis)}. Kündbar bis 24 Stunden vorher.`
            : abo ? `Läuft bis ${datumText(abo.bis)}.` : 'Läuft.'}</Leise>
        </Panel>
      ) : !trainer && (
        <Druck onPress={() => router.push('/abo')} accessibilityRole="button"
          style={{ borderRadius: RADIUS.karte, padding: 22, gap: 14, backgroundColor: f.accent }}>
          <Text style={{ fontFamily: SCHRIFT.monoFett, fontSize: 11.5, letterSpacing: 1.7, color: 'rgba(255,255,255,0.82)' }}>KM1 PRO</Text>
          <Text style={{ fontFamily: SCHRIFT.display, fontSize: 27, color: '#FFFFFF' }}>DIE PROFI-EINHEITEN</Text>
          <Text style={{ fontFamily: SCHRIFT.text, fontSize: 14.5, color: 'rgba(255,255,255,0.9)' }}>Ab 6,99 € im Monat.</Text>
          <Knopf titel="Pro ansehen" art="weiss" onPress={() => router.push('/abo')} />
        </Druck>
      )}

      {trainer && (
        <Panel>
          <Abschnitt>Trainerbereich</Abschnitt>
          <Leise>Du siehst alle Videos, auch die Profi-Einheiten. Hochgeladen wird vorerst im Supabase-Dashboard; der Upload in der App kommt mit dem Web-Bereich für Trainer.</Leise>
        </Panel>
      )}

      <Darstellung />

      <Zeilen>
        <Zeile titel="Merkliste" wert={String(Object.keys(merk).length)} onPress={() => router.push('/merkliste')} />
        {allgemein}
        <Zeile titel="Abmelden" wert={konto.vorname} onPress={async () => { await abmelden(); haptik('leicht'); }} />
        <Zeile titel="Konto löschen" gefahr letzte onPress={() => loeschenFragen()} />
      </Zeilen>
    </Seite>
  );
}
