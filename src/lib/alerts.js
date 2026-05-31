// Client-side price alerts.
//
// A static, no-backend site cannot send server email / web-push. What it CAN do
// reliably is watch prices whenever a fresh daily snapshot loads (or the app is
// opened) and fire an in-app toast + a Web Notification — which, once the app is
// installed as a PWA, behaves like a native local notification. The upgrade path
// to real email/server-push (needs a backend) is documented in the README.

export const newRule = ({ cardId, name, direction = 'above', target }) => ({
  id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  cardId,
  name,
  direction, // 'above' | 'below'
  target: Number(target) || 0,
  active: true,
  createdAt: Date.now(),
});

export const ruleHit = (rule, price) =>
  price != null && (rule.direction === 'above' ? price >= rule.target : price <= rule.target);

export const canNotify = () => typeof window !== 'undefined' && 'Notification' in window;

export const notifyPermission = () => (canNotify() ? Notification.permission : 'unsupported');

export const requestNotifyPermission = async () => {
  if (!canNotify()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

export const fireNotification = (evt) => {
  if (!canNotify() || Notification.permission !== 'granted') return;
  const dir = evt.direction === 'above' ? 'über' : 'unter';
  try {
    new Notification('🔔 Preis-Alert · Cartograph', {
      body: `${evt.name}: ${Number(evt.price).toFixed(2)} € (${dir} ${evt.target} €)`,
      tag: evt.ruleId,
      icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    });
  } catch {
    /* ignore */
  }
};
