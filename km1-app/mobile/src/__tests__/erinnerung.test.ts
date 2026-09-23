/* Die Trainingserinnerung plant echte Mitteilungen. Geprüft wird mit
   einem nachgebildeten expo-notifications, weil es Mitteilungen nur auf
   einem Gerät gibt. jest.mock wird vor die Importe gehoben. */
import * as N from 'expo-notifications';
import { erinnerungPlanen } from '@/lib/erinnerung';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
  AndroidImportance: { DEFAULT: 3 },
}));

const naechstes = { titel: 'Die erste Berührung aus dem Körper heraus', dauer_sek: 295 };

beforeEach(() => jest.clearAllMocks());

test('plant eine Mitteilung pro Trainingstag, wöchentlich, zur gewählten Uhrzeit', async () => {
  const r = await erinnerungPlanen({ an: true, tage: ['mi', 'sa'], zeit: '17:30' }, naechstes);
  expect(r).toBe('geplant');
  expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  const aufrufe = (N.scheduleNotificationAsync as jest.Mock).mock.calls.map((c) => c[0]);
  // expo-notifications zählt ab Sonntag = 1: Mittwoch ist 4, Samstag 7.
  expect(aufrufe.map((a) => a.trigger)).toEqual([
    { type: 'weekly', weekday: 4, hour: 17, minute: 30, channelId: 'training' },
    { type: 'weekly', weekday: 7, hour: 17, minute: 30, channelId: 'training' },
  ]);
  expect(aufrufe[0].content.body).toBe('Heute ist Trainingstag. Als Nächstes: Die erste Berührung aus dem Körper heraus, fünf Minuten.');
});

test('Sonntag ist 1, Montag 2', async () => {
  await erinnerungPlanen({ an: true, tage: ['so', 'mo'], zeit: '09:00' }, null);
  const tage = (N.scheduleNotificationAsync as jest.Mock).mock.calls.map((c) => c[0].trigger.weekday);
  expect(tage).toEqual([1, 2]);
});

test('ausgeschaltet oder ohne Tage: alles abbestellt, nichts geplant', async () => {
  expect(await erinnerungPlanen({ an: false, tage: ['mi'], zeit: '17:00' }, naechstes)).toBe('aus');
  expect(await erinnerungPlanen({ an: true, tage: [], zeit: '17:00' }, naechstes)).toBe('aus');
  expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);
  expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('ohne Erlaubnis: nichts geplant, und ohne Nachfrage wird nicht gefragt', async () => {
  (N.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  (N.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  expect(await erinnerungPlanen({ an: true, tage: ['mi'], zeit: '17:00' }, naechstes, false)).toBe('verweigert');
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(await erinnerungPlanen({ an: true, tage: ['mi'], zeit: '17:00' }, naechstes, true)).toBe('verweigert');
  expect(N.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
});
