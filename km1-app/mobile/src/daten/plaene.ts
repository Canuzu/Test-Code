/* Die Trainingspläne: sechs Wochen, drei Einheiten pro Woche. Die erste
   Woche ist mit Konto frei, die übrigen gehören zu KM1 Pro. Die Pläne
   kommen aus plaene.json, das supabase/werkzeug/startdaten.mjs aus der
   App im Browser erzeugt; der Server hält dieselben Pläne und schützt die
   Videos dahinter. Hier stehen nur reine Funktionen, das Starten und
   Abhaken steht in aktionen.ts. */
import roh from './plaene.json';
import type { Zustand } from './zustand';

export type Einheit = { slug: string; aufgabe: string };
export type Plan = {
  id: string; titel: string; ebene: number; fuer: string; satz: string; minuten: number; reihenfolge: number;
  wochen: Einheit[][];
};

export const PLAENE = roh as Plan[];
export const EINHEITEN_PRO_WOCHE = 3;

export const planVon = (id: string) => PLAENE.find((p) => p.id === id);
export const planSchluessel = (w: number, e: number) => `${w}-${e}`;

/* Die erste Woche ist mit Konto frei, danach braucht es Pro. Kader sieht alles. */
export function planWocheFrei(w: number, s: Zustand) {
  if (s.konto?.rolle === 'km1') return true;
  return (w === 0 && !!s.konto) || s.pro;
}

export type PlanStand = {
  plan: Plan; fertig: number; gesamt: number;
  naechste: { w: number; e: number; einheit: Einheit } | null;
  woche: number;              // die Woche mit der nächsten offenen Einheit, ab null
  dieseWoche: number;         // erledigte Einheiten in dieser Planwoche
};

/* Wie weit der laufende Plan ist: erledigte Einheiten, die aktuelle
   Woche (die erste mit offener Einheit) und die nächste Einheit. */
export function planStand(s: Zustand): PlanStand | null {
  const lauf = s.plan, plan = lauf && planVon(lauf.id);
  if (!lauf || !plan) return null;
  let fertig = 0, naechste: PlanStand['naechste'] = null;
  plan.wochen.forEach((woche, w) => woche.forEach((einheit, e) => {
    if (lauf.done[planSchluessel(w, e)]) fertig++;
    else if (!naechste) naechste = { w, e, einheit };
  }));
  const n = naechste as PlanStand['naechste'];
  const woche = n ? n.w : plan.wochen.length - 1;
  const dieseWoche = plan.wochen[woche].filter((_, e) => lauf.done[planSchluessel(woche, e)]).length;
  return { plan, fertig, gesamt: plan.wochen.length * EINHEITEN_PRO_WOCHE, naechste: n, woche, dieseWoche };
}
