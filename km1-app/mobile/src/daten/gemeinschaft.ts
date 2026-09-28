/* Was KM1 und andere melden. Mit Server die Neuigkeiten, die Kader
   schreibt (Tabelle neuigkeiten, für alle lesbar). Ohne Server nur, was
   in der App wirklich neu ist: die neueste Profi-Einheit, die Challenge
   des Monats und das Camp. Ausgedachte Meldungen gibt es hier nicht. */
import { supabase } from '@/lib/supabase';
import { CHALLENGES } from './katalog';
import { CAMP_DATEN } from './camp';
import type { Zustand } from './zustand';

export type Neuigkeit = { id: string; art: string; titel: string; text: string; ziel?: string };

const ART: Record<string, string> = { news: 'Neuigkeit', video: 'Neues Video', camp: 'Camp', erfolg: 'Erfolg' };

export function neuigkeitenVorschau(s: Zustand): Neuigkeit[] {
  const liste: Neuigkeit[] = [];
  const profi = s.katalog.find((v) => v.zugang === 'pro' && v.neu) ?? s.katalog.find((v) => v.zugang === 'pro');
  if (profi) {
    liste.push({ id: 'profi', art: 'Neue Profi-Einheit', titel: profi.titel.replace(/­/g, ''),
      text: profi.beschreibung, ziel: `/video/${profi.slug}` });
  }
  const ch = CHALLENGES[0];
  liste.push({ id: 'challenge', art: `Challenge im ${ch.m}`, titel: 'Schlag den Coach',
    text: `${ch.t}. Kader steht bei ${ch.marke}.`, ziel: '/challenge' });
  liste.push({ id: 'camp', art: 'Camp', titel: CAMP_DATEN.titel,
    text: 'Fünf Tage in den Herbstferien, vom 19. bis 23. Oktober.', ziel: '/camp' });
  return liste;
}

export async function neuigkeitenLaden(s: Zustand): Promise<Neuigkeit[]> {
  if (!supabase) return neuigkeitenVorschau(s);
  const { data, error } = await supabase.from('neuigkeiten').select('id,art,titel,text').order('erstellt_am', { ascending: false }).limit(5);
  if (error || !data?.length) return neuigkeitenVorschau(s);
  return data.map((n) => ({ id: n.id, art: ART[n.art] ?? 'Neuigkeit', titel: n.titel, text: n.text }));
}
