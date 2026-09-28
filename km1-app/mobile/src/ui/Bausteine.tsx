/* Die Bausteine der Oberfläche, übernommen aus dem Prototyp. */
import { useEffect, useState } from 'react';
import {
  Animated, Image, Pressable, ScrollView, Text, View,
  type PressableProps, type ScrollViewProps, type StyleProp, type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { ebene, KAT, type Video } from '@/daten/katalog';
import { useZustand } from '@/daten/zustand';
import { gesperrt } from '@/daten/aktionen';
import { fmtZeit } from '@/lib/zeit';
import { Kreide } from './Kreide';
import { Haken as HakenSymbol, Play, Schloss, Weiter } from './Symbole';

export const BILDER: Record<string, number> = {
  pitch: require('../../assets/img/pitch.jpg'),
  goal: require('../../assets/img/goal.jpg'),
  ladder: require('../../assets/img/ladder.jpg'),
  coach: require('../../assets/img/coach.jpg'),
};

/* Eine Seite zum Scrollen, mit dem Abstand aus dem Prototyp. */
export function Seite({ children, style, ...r }: ScrollViewProps & { children: React.ReactNode }) {
  const { f } = useThema();
  return (
    <ScrollView {...r} style={[{ flex: 1, backgroundColor: f.canvas }, style]}
      contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 22, width: '100%', maxWidth: 760, alignSelf: 'center' }}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

/* Drücken macht die Fläche einen Hauch kleiner, wie im Prototyp. */
export function Druck({ style, children, ...r }: PressableProps & { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <Pressable {...r} style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.985 }], opacity: 0.94 }]}>
      {children}
    </Pressable>
  );
}

/* Knöpfe als Pillen wie bei Apple. Rot ohne Leuchten für den einen
   Schritt, der zählt; grau mit roter Schrift für den zweiten; nur Schrift
   für „Später" und Ähnliches. */
type KnopfArt = 'haupt' | 'geist' | 'erledigt' | 'weiss' | 'text';
export function Knopf({ titel, onPress, art = 'haupt', symbol, deaktiviert, style, beschriftung, klein }: {
  titel: string; onPress?: () => void; art?: KnopfArt; symbol?: React.ReactNode;
  deaktiviert?: boolean; style?: StyleProp<ViewStyle>; beschriftung?: string; klein?: boolean;
}) {
  const { f } = useThema();
  const farbe = { haupt: f.onAccent, geist: f.accentInk, erledigt: f.gruen, weiss: f.accent2, text: f.accentInk }[art];
  const grund = { haupt: f.accent, geist: f.surface3, erledigt: f.surface3, weiss: '#FFFFFF', text: 'transparent' }[art];
  return (
    <Druck onPress={onPress} disabled={deaktiviert} accessibilityRole="button" accessibilityLabel={beschriftung ?? titel}
      accessibilityState={{ disabled: !!deaktiviert }}
      style={[{
        minHeight: klein ? 38 : art === 'text' ? 44 : 50, borderRadius: 99, paddingHorizontal: klein ? 18 : 22, paddingVertical: klein ? 8 : 12,
        backgroundColor: grund, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: deaktiviert ? 0.5 : 1,
      }, style]}>
      {symbol}
      {titel ? <Text style={{ fontFamily: art === 'text' ? SCHRIFT.text : SCHRIFT.fett, fontSize: klein ? 15 : 17, letterSpacing: -0.3, color: farbe, textAlign: 'center' }}>{titel}</Text> : null}
    </Druck>
  );
}

export function Chip({ titel, an, onPress, farbe }: { titel: string; an: boolean; onPress: () => void; farbe?: string }) {
  const { f } = useThema();
  const grund = an ? (farbe ?? f.ink) : f.surface3;
  return (
    <Druck onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: an }}
      hitSlop={{ top: 4, bottom: 4 }}
      style={{ minHeight: 36, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 99, backgroundColor: grund }}>
      <Text style={{ fontFamily: SCHRIFT.mittel, fontSize: 15, letterSpacing: -0.2, color: an ? (farbe ? f.onLv : f.canvas) : f.ink }}>{titel}</Text>
    </Druck>
  );
}

/* Ein Raster mit gleich breiten Zellen, auch in der letzten Reihe. */
export function Raster({ spalten, abstand = 8, children }: { spalten: number; abstand?: number; children: React.ReactNode[] }) {
  const reihen: React.ReactNode[][] = [];
  children.forEach((k, i) => { if (i % spalten === 0) reihen.push([]); reihen[reihen.length - 1].push(k); });
  return (
    <View style={{ gap: abstand }}>
      {reihen.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: abstand }}>
          {r.map((k, j) => <View key={j} style={{ flex: 1 }}>{k}</View>)}
          {Array.from({ length: spalten - r.length }, (_, j) => <View key={'x' + j} style={{ flex: 1 }} />)}
        </View>
      ))}
    </View>
  );
}

/* Die Auswahl in einer Pille, wie im Kontrollzentrum: Hell, Dunkel,
   Automatisch oder Für dich, Folge ich. */
export function Wahl<T extends string | number>({ werte, wert, onWahl, beschriftung }: {
  werte: [T, string][]; wert: T; onWahl: (w: T) => void; beschriftung?: string;
}) {
  const { f, dunkel } = useThema();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={beschriftung}
      style={{ flexDirection: 'row', gap: 2, padding: 3, backgroundColor: f.surface3, borderRadius: 99 }}>
      {werte.map(([w, t]) => {
        const an = wert === w;
        return (
          <Pressable key={String(w)} onPress={() => onWahl(w)} accessibilityRole="tab" accessibilityState={{ selected: an }}
            style={[{ flex: 1, minHeight: 38, borderRadius: 99, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
              an && { backgroundColor: dunkel ? '#4A5852' : '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }]}>
            <Text numberOfLines={1} style={{ fontFamily: an ? SCHRIFT.fett : SCHRIFT.mittel, fontSize: 15, letterSpacing: -0.2, color: f.ink }}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Panel({ children, style, traegt }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; traegt?: boolean }) {
  const { f } = useThema();
  return (
    <View style={[{ backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 20, gap: 12 }, traegt ? schwebt(f) : null, style]}>
      {children}
    </View>
  );
}

/* Gruppierte Listen liegen flach, nur mit Trennlinien. */
export function Zeilen({ children }: { children: React.ReactNode }) {
  const { f } = useThema();
  return <View style={{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }}>{children}</View>;
}
export function Zeile({ titel, wert, onPress, letzte, gefahr, symbol }: {
  titel: string; wert?: string; onPress: () => void; letzte?: boolean; gefahr?: boolean; symbol?: React.ReactNode;
}) {
  const { f } = useThema();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={wert ? `${titel}, ${wert}` : titel}
      style={({ pressed }) => [{
        minHeight: 52, paddingLeft: 16, paddingRight: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      }, pressed && { backgroundColor: f.surface3 }]}>
      {symbol}
      <Text style={{ flex: 1, fontFamily: SCHRIFT.text, fontSize: 17, letterSpacing: -0.35, color: gefahr ? f.accentInk : f.ink }}>{titel}</Text>
      {wert ? <Text numberOfLines={1} style={{ maxWidth: '48%', fontFamily: SCHRIFT.text, fontSize: 17, letterSpacing: -0.35, color: f.ink2 }}>{wert}</Text> : null}
      {gefahr ? null : <Weiter farbe={f.ink3} />}
      {letzte ? null : <View style={{ position: 'absolute', left: symbol ? 58 : 16, right: 0, bottom: 0, height: 0.5, backgroundColor: f.line2 }} />}
    </Pressable>
  );
}

/* Ein Schalter in einer Zeile. */
export function SchalterZeile({ titel, an, onPress, letzte }: { titel: string; an: boolean; onPress: () => void; letzte?: boolean }) {
  const { f } = useThema();
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: an }} accessibilityLabel={titel}
      style={{ minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ flex: 1, fontFamily: SCHRIFT.text, fontSize: 16, lineHeight: 22, letterSpacing: -0.3, color: f.ink }}>{titel}</Text>
      <View style={{ width: 51, height: 31, borderRadius: 99, padding: 2, backgroundColor: an ? f.gruen : f.surface3, alignItems: an ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 27, height: 27, borderRadius: 99, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} />
      </View>
      {letzte ? null : <View style={{ position: 'absolute', left: 16, right: 0, bottom: 0, height: 0.5, backgroundColor: f.line2 }} />}
    </Pressable>
  );
}

export function HakenListe({ zeilen }: { zeilen: string[] }) {
  const { f } = useThema();
  return (
    <View style={{ gap: 14 }}>
      {zeilen.map((t) => (
        <View key={t} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ marginTop: 3 }}><HakenSymbol farbe={f.accent} /></View>
          <Text style={{ flex: 1, fontFamily: SCHRIFT.text, fontSize: 16, lineHeight: 23, color: f.inkBody }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

export function Leer({ symbol, text, children }: { symbol: React.ReactNode; text: string; children?: React.ReactNode }) {
  const { f } = useThema();
  return (
    <View style={[{ alignItems: 'center', gap: 12, paddingVertical: 46, paddingHorizontal: 24, borderRadius: RADIUS.karte, backgroundColor: f.surface }, schwebt(f)]}>
      {symbol}
      <Text style={{ fontFamily: SCHRIFT.text, fontSize: 15.5, lineHeight: 23, color: f.ink2, textAlign: 'center', maxWidth: 280 }}>{text}</Text>
      {children}
    </View>
  );
}

/* Fortschritt als Striche. */
export function Striche({ an, gesamt, farbe }: { an: number; gesamt: number; farbe: string }) {
  const { f } = useThema();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`${an} von ${gesamt}`}>
      {Array.from({ length: gesamt }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 7, borderRadius: 99, backgroundColor: i < an ? farbe : f.surface3 }} />
      ))}
    </View>
  );
}

function Schild({ text, art }: { text: string; art: 'pro' | 'konto' | 'neu' | 'dauer' }) {
  const { f } = useThema();
  const grund = { pro: f.accent, konto: 'rgba(3,7,6,0.72)', neu: 'rgba(244,247,243,0.94)', dauer: 'rgba(3,7,6,0.72)' }[art];
  const farbe = { pro: '#FFFFFF', konto: f.onMedia, neu: '#0A1411', dauer: f.onMedia }[art];
  const lage: ViewStyle = art === 'dauer' ? { right: 10, bottom: 10 } : { left: 10, top: 10 };
  return (
    <View style={[{ position: 'absolute', zIndex: 2, paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.schild, backgroundColor: grund }, lage]}>
      <Text style={{ fontFamily: art === 'dauer' ? SCHRIFT.monoMittel : SCHRIFT.fett, fontSize: 11, letterSpacing: art === 'dauer' ? 0.2 : 0.7, color: farbe }}>
        {art === 'dauer' ? text : text.toUpperCase()}
      </Text>
    </View>
  );
}

/* Das Bild eines Videos: Foto, sonst Kreidezeichnung, mit Verlauf. */
export function Poster({ v, verhaeltnis = 16 / 10, radius = RADIUS.bild, kinder }: {
  v: Video; verhaeltnis?: number; radius?: number; kinder?: React.ReactNode;
}) {
  const { f } = useThema();
  return (
    <View style={{ aspectRatio: verhaeltnis, borderRadius: radius, overflow: 'hidden', backgroundColor: f.surface3 }}>
      {v.bild && BILDER[v.bild]
        ? <Image source={BILDER[v.bild]} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
        : <Kreide kategorie={v.kategorie} ebene={v.ebene} />}
      <LinearGradient colors={['rgba(3,7,6,0)', 'rgba(3,7,6,0.72)']} locations={[0.46, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none" />
      {kinder}
    </View>
  );
}

export function VideoKarte({ v, breite }: { v: Video; breite?: number }) {
  const { f } = useThema();
  useZustand((z) => z.konto); useZustand((z) => z.pro);   // neu zeichnen, wenn sich der Zugang ändert
  const zu = gesperrt(v);
  const lv = ebene(v.ebene);
  const schild = v.zugang === 'pro' ? <Schild text="Profi" art="pro" />
    : (v.zugang === 'konto' && zu) ? <Schild text="Konto" art="konto" />
    : v.neu ? <Schild text="Neu" art="neu" /> : null;
  return (
    <Druck onPress={() => router.push(`/video/${v.slug}`)} accessibilityRole="button"
      accessibilityLabel={`${v.titel.replace(/­/g, '')}, ${lv.nm}, ${KAT[v.kategorie]}${zu ? ', gesperrt' : ''}`}
      style={[{ width: breite, backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 8 }, schwebt(f), !breite && { flex: 1 }]}>
      <Poster v={v} kinder={<>
        {zu && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: v.zugang === 'konto' ? 'rgba(3,7,6,0.34)' : 'rgba(3,7,6,0.5)' }}>
            <View style={{ width: 46, height: 46, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,7,6,0.55)', borderWidth: 1, borderColor: 'rgba(244,247,243,0.28)' }}>
              <Schloss farbe={f.onMedia} />
            </View>
          </View>
        )}
        {schild}
        <Schild text={fmtZeit(v.dauer_sek)} art="dauer" />
      </>} />
      <View style={{ paddingTop: 12, paddingHorizontal: 8, paddingBottom: 8, gap: 7 }}>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 15.5, lineHeight: 20, color: f.ink }} textBreakStrategy="highQuality" android_hyphenationFrequency="full">{v.titel}</Text>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 12.5, lineHeight: 17, color: f.ink2 }}>
          <Text style={{ color: f.lv[v.ebene - 1] }}>●  </Text>{lv.nm} · {KAT[v.kategorie]}
        </Text>
      </View>
    </Druck>
  );
}

/* Ein Ring wie in Fitness. anteil liegt zwischen 0 und 1. Bei null bleibt
   nur die Spur stehen: ein Ring aus einem einzigen runden Ende sähe aus
   wie ein Fleck. */
export function Ring({ anteil, farbe, groesse = 26, spur = 'rgba(255,255,255,0.28)' }: {
  anteil: number; farbe: string; groesse?: number; spur?: string;
}) {
  const p = Math.round(Math.max(0, Math.min(1, anteil)) * 100);
  const u = 2 * Math.PI * 26;
  return (
    <Svg width={groesse} height={groesse} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="26" stroke={spur} strokeWidth={9} fill="none" />
      {p > 0 && (
        <Circle cx="32" cy="32" r="26" stroke={farbe} strokeWidth={9} fill="none" strokeLinecap="round"
          strokeDasharray={`${(p / 100) * u} ${u}`} transform="rotate(-90 32 32)" />
      )}
    </Svg>
  );
}

export type HeldZiel = { anteil: number; text: string; beschriftung: string };

/* Die große Karte oben auf der Startseite. Unten links das Wochenziel
   oder die Woche des Plans als kleiner Ring. */
export function Held({ v, oben, unten, anteil, ziel }: { v: Video; oben: string; unten: string; anteil?: number; ziel?: HeldZiel | null }) {
  const { f } = useThema();
  const lang = v.titel.split(/\s+/).some((w) => w.replace(/­/g, '').length > 15) || v.titel.length > 34;
  const groesse = lang ? 17 : v.titel.length > 24 ? 19.5 : 22.5;
  return (
    <Druck onPress={() => router.push(`/video/${v.slug}`)} accessibilityRole="button"
      accessibilityLabel={`${oben}: ${v.titel.replace(/­/g, '')}, ${unten}`}
      style={[{ borderRadius: RADIUS.karte, overflow: 'hidden', backgroundColor: f.surface }, schwebt(f, true)]}>
      <View style={{ aspectRatio: 16 / 9 }}>
        {v.bild && BILDER[v.bild]
          ? <Image source={BILDER[v.bild]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <Kreide kategorie={v.kategorie} ebene={v.ebene} />}
        <LinearGradient colors={['rgba(3,7,6,0.25)', 'rgba(3,7,6,0.04)', 'rgba(3,7,6,0.7)', 'rgba(3,7,6,0.97)']}
          locations={[0, 0.22, 0.52, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingLeft: 20, paddingRight: 92, paddingTop: 22, paddingBottom: 24, gap: 9 }}>
          <Text style={{ fontFamily: SCHRIFT.monoFett, fontSize: 11, letterSpacing: 2, color: '#FFFFFF', opacity: 0.92 }}>{oben.toUpperCase()}</Text>
          <Text numberOfLines={3} style={{ fontFamily: SCHRIFT.display, fontSize: groesse, lineHeight: groesse * 1.06, color: '#FFFFFF' }}>{v.titel.toUpperCase()}</Text>
          <Text numberOfLines={1} style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: 'rgba(244,247,243,0.86)' }}>{unten}</Text>
          {ziel ? (
            <View accessible accessibilityLabel={ziel.beschriftung} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Ring anteil={ziel.anteil} farbe="#34C759" groesse={22} />
              <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: '#FFFFFF' }}>{ziel.text}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ position: 'absolute', right: 18, bottom: 20, width: 56, height: 56, borderRadius: 99, backgroundColor: f.accent, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ marginLeft: 3 }}><Play farbe="#FFFFFF" /></View>
        </View>
        {anteil ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(244,247,243,0.22)' }}>
            <View style={{ width: `${anteil}%`, height: '100%', backgroundColor: f.accent }} />
          </View>
        ) : null}
      </View>
    </Druck>
  );
}

/* Kurzer Hinweis unten, verschwindet von allein. */
export function Hinweis() {
  const { f } = useThema();
  const h = useZustand((z) => z.hinweis);
  const [sicht] = useState(() => new Animated.Value(0));
  const text = h?.text ?? '';
  useEffect(() => {
    if (!h) return;
    Animated.timing(sicht, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const t = setTimeout(() => Animated.timing(sicht, { toValue: 0, duration: 260, useNativeDriver: true }).start(), 2300);
    return () => clearTimeout(t);
  }, [h, sicht]);
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 110, alignItems: 'center', opacity: sicht,
        transform: [{ translateY: sicht.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      <View style={[{ maxWidth: '84%', backgroundColor: f.ink, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 99 }, schwebt(f, true)]}>
        <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: f.canvas, textAlign: 'center' }}>{text}</Text>
      </View>
    </Animated.View>
  );
}

/* Anfangsbuchstaben statt Foto. Nur Kader hat eines. */
export function Initialen({ name, farbe }: { name: string; farbe: string }) {
  const { f } = useThema();
  const teile = name.replace(/[^\p{L}\s-]/gu, '').trim().split(/[\s-]+/);
  const zeichen = ((teile[0]?.[0] ?? '?') + (teile[1]?.[0] ?? '')).toUpperCase();
  return (
    <View style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: farbe, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
      <Text style={{ fontFamily: SCHRIFT.display, fontSize: 21, color: f.onLv, letterSpacing: 0.6 }}>{zeichen}</Text>
    </View>
  );
}
