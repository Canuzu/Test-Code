/* Die Trainingserinnerung als echte Mitteilung auf dem Handy. Sie läuft
   komplett auf dem Gerät: kein Server, kein Push-Dienst, keine Adresse,
   die irgendwo gespeichert wird. Einmal pro gewähltem Wochentag.

   Der Text nennt das nächste Video. Deshalb wird neu geplant, wenn sich
   der Fortschritt ändert. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ohneTrennung, tagNummer, type Tag } from './zeit';
import { minutenText } from './zeit';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true,
  }),
});

const KANAL = 'training';

export type Ergebnis = 'geplant' | 'aus' | 'verweigert' | 'nicht-verfuegbar';

export async function erinnerungPlanen(
  e: { an: boolean; tage: Tag[]; zeit: string },
  naechstes: { titel: string; dauer_sek: number } | null,
  fragen = true,
): Promise<Ergebnis> {
  if (Platform.OS === 'web') return 'nicht-verfuegbar';
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!e.an || !e.tage.length) return 'aus';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(KANAL, {
      name: 'Trainingserinnerung',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && fragen) status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'verweigert';

  const [stunde, minute] = e.zeit.split(':').map(Number);
  const text = naechstes
    ? `Heute ist Trainingstag. Als Nächstes: ${ohneTrennung(naechstes.titel)}, ${minutenText(naechstes.dauer_sek)}.`
    : 'Heute ist Trainingstag. Zwanzig Minuten mit dem Ball reichen.';

  for (const tag of e.tage) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'KM1 Training', body: text },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        // expo-notifications zählt ab Sonntag = 1.
        weekday: tagNummer(tag) + 1,
        hour: stunde, minute,
        channelId: KANAL,
      },
    });
  }
  return 'geplant';
}

export const vorschauText = (naechstes: { titel: string; dauer_sek: number } | null) => naechstes
  ? `Heute ist Trainingstag. Als Nächstes: ${ohneTrennung(naechstes.titel)}, ${minutenText(naechstes.dauer_sek)}.`
  : 'Heute ist Trainingstag. Zwanzig Minuten mit dem Ball reichen.';
