/* Die Bausteine der Oberfläche, übernommen aus dem Prototyp. */
import { useEffect, useState } from 'react';
import {
  Animated, Image, Pressable, ScrollView, Text, View,
  type PressableProps, type ScrollViewProps, type StyleProp, type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

type KnopfArt = 'haupt' | 'geist' | 'erledigt' | 'weiss';
export function Knopf({ titel, onPress, art = 'haupt', symbol, deaktiviert, style, beschriftung }: {
  titel: string; onPress?: () => void; art?: KnopfArt; symbol?: React.ReactNode;
  deaktiviert?: boolean; style?: StyleProp<ViewStyle>; beschriftung?: string;
}) {
  const { f } = useThema();
  const farbe = { haupt: f.onAccent, geist: f.ink, erledigt: f.lv[1], weiss: f.accent2 }[art];
  const grund = { haupt: f.accent, geist: f.surface, erledigt: f.surface, weiss: '#FFFFFF' }[art];
  return (
    <Druck onPress={onPress} disabled={deaktiviert} accessibilityRole="button" accessibilityLabel={beschriftung ?? titel}
      accessibilityState={{ disabled: !!deaktiviert }}
      style={[{
        minHeight: 54, borderRadius: RADIUS.knopf, paddingHorizontal: 22, paddingVertical: 15,
        backgroundColor: grund, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        opacity: deaktiviert ? 0.5 : 1,
      }, art === 'haupt' ? { shadowColor: f.accent, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 } : schwebt(f),
      art === 'erledigt' && { borderWidth: 2, borderColor: f.lv[1] }, style]}>
      {symbol}
      {titel ? <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 16, color: farbe }}>{titel}</Text> : null}
    </Druck>
  );
}

export function Chip({ titel, an, onPress, farbe }: { titel: string; an: boolean; onPress: () => void; farbe?: string }) {
  const { f } = useThema();
  const grund = an ? (farbe ?? f.ink) : f.surface;
  return (
    <Druck onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: an }}
      hitSlop={{ top: 2, bottom: 2 }}
      style={[{ minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: RADIUS.chip, backgroundColor: grund }, !an && schwebt(f)]}>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: an ? (farbe ? f.onLv : f.canvas) : f.ink2 }}>{titel}</Text>
    </Druck>
  );
}

export function Panel({ children, style, traegt }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; traegt?: boolean }) {
  const { f } = useThema();
  return (
    <View style={[{ backgroundColor: f.surface, borderRadius: RADIUS.karte, padding: 20, gap: 14 }, traegt ? schwebt(f) : null, style]}>
      {children}
    </View>
  );
}

/* Gruppierte Listen liegen flach, nur mit Trennlinien. */
export function Zeilen({ children }: { children: React.ReactNode }) {
  const { f } = useThema();
  return <View style={{ backgroundColor: f.surface, borderRadius: RADIUS.karte, overflow: 'hidden' }}>{children}</View>;
}
export function Zeile({ titel, wert, onPress, letzte, gefahr }: {
  titel: string; wert?: string; onPress: () => void; letzte?: boolean; gefahr?: boolean;
}) {
  const { f } = useThema();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={wert ? `${titel}, ${wert}` : titel}
      style={({ pressed }) => [{
        minHeight: 58, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
        borderBottomWidth: letzte ? 0 : 1, borderBottomColor: f.line,
      }, pressed && { backgroundColor: f.surface2 }]}>
      <Text style={{ flex: 1, fontFamily: SCHRIFT.mittel, fontSize: 16, color: gefahr ? f.accentInk : f.ink }}>{titel}</Text>
      {wert ? <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: f.ink3 }}>{wert}</Text> : null}
      <Weiter farbe={f.ink3} />
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

/* Die große Karte oben auf der Startseite. */
export function Held({ v, oben, unten, anteil }: { v: Video; oben: string; unten: string; anteil?: number }) {
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
          <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13, color: 'rgba(244,247,243,0.86)' }}>{unten}</Text>
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
