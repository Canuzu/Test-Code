/* Haptik wie im Prototyp: ein Impuls bestätigt, was passiert ist. Was
   öfter als ein paarmal pro Minute vorkommt, schweigt. In der echten App
   spricht expo-haptics die Taptic Engine des iPhones direkt an. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type Muster = 'tick' | 'leicht' | 'mittel' | 'wand' | 'erfolg' | 'aufstieg' | 'fehler';

export function haptik(m: Muster) {
  if (Platform.OS === 'web') return;
  const H = Haptics;
  const los = {
    tick: () => H.selectionAsync(),
    leicht: () => H.impactAsync(H.ImpactFeedbackStyle.Light),
    mittel: () => H.impactAsync(H.ImpactFeedbackStyle.Medium),
    wand: () => H.impactAsync(H.ImpactFeedbackStyle.Rigid),
    erfolg: () => H.notificationAsync(H.NotificationFeedbackType.Success),
    aufstieg: () => H.notificationAsync(H.NotificationFeedbackType.Success)
      .then(() => new Promise((r) => setTimeout(r, 140)))
      .then(() => H.impactAsync(H.ImpactFeedbackStyle.Heavy)),
    fehler: () => H.notificationAsync(H.NotificationFeedbackType.Error),
  }[m];
  los().catch(() => {});
}
