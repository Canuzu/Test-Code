/* Die Textrollen aus dem Prototyp. Wer Text setzt, nimmt eine davon und
   keine eigene Größe. */
import { Text, View, type TextProps } from 'react-native';
import { SCHRIFT, useThema } from '@/lib/thema';

type P = TextProps & { children: React.ReactNode };

/* Die rote Zeile über jeder Überschrift, mit dem kurzen Strich davor. */
export function Ueberzeile({ children, style, mitte, ...r }: P & { mitte?: boolean }) {
  const { f } = useThema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, justifyContent: mitte ? 'center' : 'flex-start' }}>
      <View style={{ width: 16, height: 2, borderRadius: 2, backgroundColor: f.accent }} />
      <Text {...r} style={[{ fontFamily: SCHRIFT.monoFett, fontSize: 11.5, letterSpacing: 1.9, color: f.accentInk, flexShrink: 1 }, style]}>
        {String(children).toUpperCase()}
      </Text>
    </View>
  );
}

export function Titel({ children, style, ...r }: P) {
  const { f } = useThema();
  return (
    <Text accessibilityRole="header" {...r}
      style={[{ fontFamily: SCHRIFT.display, fontSize: 33, lineHeight: 34, color: f.ink, marginTop: 6 }, style]}>
      {String(children).toUpperCase()}
    </Text>
  );
}

export function Abschnitt({ children, style, ...r }: P) {
  const { f } = useThema();
  return (
    <Text accessibilityRole="header" {...r}
      style={[{ fontFamily: SCHRIFT.display, fontSize: 23, lineHeight: 26, color: f.ink }, style]}>
      {String(children).toUpperCase()}
    </Text>
  );
}

/* Leise Überschrift für Einstellungen und kleine Etiketten. */
export function Notiz({ children, style, ...r }: P) {
  const { f } = useThema();
  return (
    <Text {...r} style={[{ fontFamily: SCHRIFT.monoFett, fontSize: 11.5, letterSpacing: 1.7, color: f.ink2 }, style]}>
      {String(children).toUpperCase()}
    </Text>
  );
}

export function Fliess({ children, style, ...r }: P) {
  const { f } = useThema();
  return <Text {...r} style={[{ fontFamily: SCHRIFT.text, fontSize: 17, lineHeight: 27, color: f.inkBody }, style]}>{children}</Text>;
}

export function Leise({ children, style, ...r }: P) {
  const { f } = useThema();
  return <Text {...r} style={[{ fontFamily: SCHRIFT.text, fontSize: 15.5, lineHeight: 24, color: f.ink2 }, style]}>{children}</Text>;
}

export function Klein({ children, style, ...r }: P) {
  const { f } = useThema();
  return <Text {...r} style={[{ fontFamily: SCHRIFT.text, fontSize: 13.5, lineHeight: 21, color: f.ink3 }, style]}>{children}</Text>;
}

/* Ein Verweis mitten im Satz: unterstrichen, leise. */
export function Verweis({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const { f } = useThema();
  return (
    <Text onPress={onPress} accessibilityRole="link"
      style={{ color: f.ink2, textDecorationLine: 'underline', fontFamily: SCHRIFT.mittel }}>
      {children}
    </Text>
  );
}
