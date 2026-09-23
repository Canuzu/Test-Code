/* Konto löschen, an jeder Stelle gleich: Rückfrage, dann sofort weg. */
import { router } from 'expo-router';
import { kontoLoeschen } from '@/daten/aktionen';
import { hinweis } from '@/daten/zustand';
import { bestaetigen } from '@/lib/fragen';
import { haptik } from '@/lib/haptik';

export async function loeschenFragen(sie = false) {
  const ok = await bestaetigen(
    'Konto löschen?',
    sie
      ? 'Das Konto Ihres Kindes wird mit Fortschritt und Merkliste sofort und endgültig gelöscht. Ein laufendes Abo kündigen Sie getrennt im App Store oder bei Google Play.'
      : 'Dein Konto wird mit Fortschritt und Merkliste sofort und endgültig gelöscht. Ein laufendes Abo kündigst du getrennt im App Store oder bei Google Play.',
    'Endgültig löschen',
  );
  if (!ok) return;
  try {
    await kontoLoeschen();
    haptik('mittel');
    hinweis(sie ? 'Das Konto ist gelöscht.' : 'Dein Konto ist gelöscht.');
    try { if (router.canDismiss()) router.dismissAll(); } catch {}
    router.replace('/');
  } catch (e) {
    haptik('fehler');
    hinweis((e as Error).message);
  }
}
