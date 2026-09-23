/* Plant die Erinnerung neu, damit sie immer das nächste Video nennt. */
import { erinnerungPlanen } from '@/lib/erinnerung';
import { naechstesVideo } from './aktionen';
import { lies } from './zustand';

export function erinnerungAktualisieren(fragen = false) {
  const s = lies();
  return erinnerungPlanen(s.erinnerung, naechstesVideo(s), fragen).catch(() => 'nicht-verfuegbar' as const);
}
