/* Eine Rückfrage vor Dingen, die sich nicht rückgängig machen lassen.
   Im Browser gibt es keinen Systemdialog mit Knöpfen, dort fragt confirm(). */
import { Alert, Platform } from 'react-native';

export function bestaetigen(titel: string, text: string, knopf: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${titel}\n\n${text}`) ?? false);
  return new Promise((ok) => Alert.alert(titel, text, [
    { text: 'Abbrechen', style: 'cancel', onPress: () => ok(false) },
    { text: knopf, style: 'destructive', onPress: () => ok(true) },
  ], { cancelable: true, onDismiss: () => ok(false) }));
}
