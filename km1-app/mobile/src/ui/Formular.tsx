/* Eingabefelder, Umschalter und das Häkchen zum Einwilligen. */
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { RADIUS, SCHRIFT, useThema } from '@/lib/thema';
import { haptik } from '@/lib/haptik';
import { Haken } from './Symbole';
import { Wahl } from './Bausteine';

export function Feld({ titel, hilfe, ...r }: TextInputProps & { titel: string; hilfe?: string }) {
  const { f } = useThema();
  return (
    <View style={{ gap: 9 }}>
      <Text style={{ fontFamily: SCHRIFT.fett, fontSize: 13.5, color: f.ink2 }}>{titel}</Text>
      <TextInput placeholderTextColor={f.ink3} accessibilityLabel={titel} {...r}
        style={{ minHeight: 50, paddingHorizontal: 16, paddingVertical: 13, borderRadius: RADIUS.feld,
          backgroundColor: f.field, color: f.ink, fontFamily: SCHRIFT.text, fontSize: 17,
          borderWidth: 1, borderColor: f.line2 }} />
      {hilfe ? <Text style={{ fontFamily: SCHRIFT.text, fontSize: 13, lineHeight: 19, color: f.ink3 }}>{hilfe}</Text> : null}
    </View>
  );
}

/* Der Umschalter ist dieselbe Pille wie überall in der App. */
export function Umschalter<T extends string>({ wahl, optionen, onWahl }: {
  wahl: T; optionen: [T, string][]; onWahl: (w: T) => void;
}) {
  return <Wahl werte={optionen} wert={wahl} onWahl={(w) => { onWahl(w); haptik('tick'); }} />;
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
