/* Eingabefelder, Umschalter und das Häkchen zum Einwilligen. */
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { RADIUS, SCHRIFT, schwebt, useThema } from '@/lib/thema';
import { haptik } from '@/lib/haptik';
import { Haken } from './Symbole';

export function Feld({ titel, hilfe, ...r }: TextInputProps & { titel: string; hilfe?: string }) {
  const { f } = useThema();
  return (
    <View style={{ gap: 9 }}>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13.5, color: f.ink2 }}>{titel}</Text>
      <TextInput placeholderTextColor={f.ink3} accessibilityLabel={titel} {...r}
        style={[{ minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, borderRadius: RADIUS.knopf,
          backgroundColor: f.field, color: f.ink, fontFamily: SCHRIFT.mittel, fontSize: 16,
          borderWidth: 1, borderColor: f.line }, schwebt(f)]} />
      {hilfe ? <Text style={{ fontFamily: SCHRIFT.text, fontSize: 13, lineHeight: 19, color: f.ink3 }}>{hilfe}</Text> : null}
    </View>
  );
}

export function Umschalter<T extends string>({ wahl, optionen, onWahl }: {
  wahl: T; optionen: [T, string][]; onWahl: (w: T) => void;
}) {
  const { f } = useThema();
  return (
    <View style={{ flexDirection: 'row', gap: 6, padding: 6, backgroundColor: f.surface3, borderRadius: RADIUS.knopf }}>
      {optionen.map(([w, text]) => {
        const an = wahl === w;
        return (
          <Pressable key={w} onPress={() => { onWahl(w); haptik('tick'); }} accessibilityRole="button" accessibilityState={{ selected: an }}
            style={[{ flex: 1, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
              an && [{ backgroundColor: f.surface }, schwebt(f)]]}>
            <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 14, color: an ? f.ink : f.inkBody, textAlign: 'center' }}>{text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Einwilligung({ an, onWechsel, children }: { an: boolean; onWechsel: (an: boolean) => void; children: React.ReactNode }) {
  const { f } = useThema();
  return (
    <Pressable onPress={() => { onWechsel(!an); haptik('tick'); }} accessibilityRole="checkbox" accessibilityState={{ checked: an }}
      style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 4 }}>
      <View style={{ width: 26, height: 26, borderRadius: 7, marginTop: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: an ? f.accent : f.field, borderWidth: 2, borderColor: an ? f.accent : f.line2 }}>
        {an && <Haken farbe="#FFFFFF" groesse={16} dicke={3} />}
      </View>
      <Text style={{ flex: 1, fontFamily: SCHRIFT.text, fontSize: 14.5, lineHeight: 22, color: f.inkBody }}>{children}</Text>
    </Pressable>
  );
}
