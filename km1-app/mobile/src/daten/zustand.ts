/* Der Zustand der App an einer Stelle. Bewusst ohne Bibliothek: ein
   Objekt, ein Satz Zuhörer, und useSyncExternalStore für React.

   Was auf dem Gerät bleibt (Darstellung, Erinnerung, wo ein Video stehen
   blieb), wird immer gespeichert. Konto und Fortschritt nur im
   Vorschau-Modus; mit Server gehören sie dem Server. */
import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';
import { VORSCHAU_KATALOG, type Video } from './katalog';
import type { Tag } from '@/lib/zeit';

/* Die Rollen wie auf dem Server. Kader ist 'km1' und sieht alles;
   'trainer' ist der Trainer einer Mannschaft. */
export type Rolle = 'spieler' | 'eltern' | 'trainer' | 'akademie' | 'verein' | 'profi' | 'scout' | 'km1';

/* Der laufende Trainingsplan. Die Schlüssel in done sind Woche und
   Einheit, beide ab null gezählt: '0-2' ist die dritte Einheit der
   ersten Woche. */
export type LaufenderPlan = { id: string; ab: number; done: Record<string, number> };

export type CampKind = { vorname: string; jahrgang: number; hinweise: string };
export type Buchung = { nr: string; kinder: CampKind[]; summe: number; am: number };

export type Konto = {
  id: string;
  vorname: string;
  email: string | null;
  ebene: number;
  rolle: Rolle;
  seit: number;
  geburtsjahr: number | null;
  eltern: boolean;          // hat ein Elternteil eingewilligt
  lokal: boolean;           // Vorschau-Konto ohne Server
};

export type Erinnerung = { an: boolean; tage: Tag[]; zeit: string };

export type Zustand = {
  bereit: boolean;
  katalog: Video[];
  katalogFehler: string | null;
  konto: Konto | null;
  done: Record<string, number>;       // slug → Zeitpunkt des Abhakens
  stelle: Record<string, number>;     // slug → Sekunde, an der es stehen blieb
  zuletzt: string | null;
  merk: Record<string, number>;
  challenges: Record<string, number>;
  pro: boolean;
  /* preis ist leer, solange der Server den Tarif nicht kennt (bis RevenueCat). */
  abo: { preis: 'monat' | 'jahr' | null; bis: number } | null;
  thema: 'hell' | 'dunkel' | 'auto';
  erinnerung: Erinnerung;
  hinweis: { text: string; nr: number } | null;
  /* Filter der Videothek. Nicht gespeichert: beim nächsten Start ist alles offen. */
  filter: { kat: string; ebene: number; suche: string };
  /* Die drei Fragen beim ersten Start: ob sie gestellt wurden und was
     geantwortet wurde. Bleibt auf dem Gerät, auch ohne Konto. */
  ersterStart: boolean;
  vorlieben: { rolle: Rolle | null; jahrgang: number | null };
  startSicht: 'fuerdich' | 'folge';
  plan: LaufenderPlan | null;
  buchungen: Record<string, Buchung>;
  campWunsch: boolean;
  /* Nicht gespeichert: ob das Handy gerade Netz hat. */
  offline: boolean;
};

const SCHLUESSEL = 'km1-zustand-v1';

function anfang(): Zustand {
  return {
    bereit: false, katalog: VORSCHAU_KATALOG, katalogFehler: null,
    konto: null, done: {}, stelle: {}, zuletzt: null, merk: {}, challenges: {},
    pro: false, abo: null, thema: 'auto',
    erinnerung: { an: true, tage: ['mi', 'sa'], zeit: '17:00' },
    hinweis: null,
    filter: { kat: 'alle', ebene: 0, suche: '' },
    ersterStart: false, vorlieben: { rolle: null, jahrgang: null }, startSicht: 'fuerdich',
    plan: null, buchungen: {}, campWunsch: false, offline: false,
  };
}

let z: Zustand = anfang();
const hoerer = new Set<() => void>();

export const lies = () => z;

export function setze(teil: Partial<Zustand> | ((z: Zustand) => Partial<Zustand>)) {
  z = { ...z, ...(typeof teil === 'function' ? teil(z) : teil) };
  speichern();
  hoerer.forEach((h) => h());
}

/* Nur Auswahlfunktionen, die ein Feld des Zustands zurückgeben (oder eine
   Zahl, einen Text). Wer daraus Listen baut, tut das mit useMemo. */
export function useZustand<T>(auswahl: (z: Zustand) => T): T {
  return useSyncExternalStore(
    (h) => { hoerer.add(h); return () => hoerer.delete(h); },
    () => auswahl(z),
    () => auswahl(z),
  );
}

let lokalesGeraet = true;   // mit Server false: Konto und Fortschritt nicht lokal speichern
export function geraetSpeichertKonto(ja: boolean) { lokalesGeraet = ja; }

function speichern() {
  const immer = {
    thema: z.thema, erinnerung: z.erinnerung, stelle: z.stelle, zuletzt: z.zuletzt,
    ersterStart: z.ersterStart, vorlieben: z.vorlieben, startSicht: z.startSicht, campWunsch: z.campWunsch,
  };
  const vorschau = lokalesGeraet
    ? { konto: z.konto, done: z.done, merk: z.merk, challenges: z.challenges, pro: z.pro, abo: z.abo,
        plan: z.plan, buchungen: z.buchungen }
    : {};
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify({ ...immer, ...vorschau })); } catch {}
}

export function laden() {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return;
    const g = JSON.parse(roh);
    const immer: (keyof Zustand)[] = ['thema', 'erinnerung', 'stelle', 'zuletzt', 'ersterStart', 'vorlieben', 'startSicht', 'campWunsch'];
    const erlaubt: (keyof Zustand)[] = lokalesGeraet
      ? [...immer, 'konto', 'done', 'merk', 'challenges', 'pro', 'abo', 'plan', 'buchungen']
      : immer;
    const teil: Partial<Zustand> = {};
    for (const k of erlaubt) if (g[k] !== undefined) (teil as any)[k] = g[k];
    // Frühere Fassungen kannten Kader als 'trainer'.
    if (teil.konto && (teil.konto.rolle as string) === 'trainer' && /kader|km1-training/i.test(teil.konto.email ?? '')) {
      teil.konto = { ...teil.konto, rolle: 'km1' };
    }
    z = { ...z, ...teil };
  } catch {}
}

export function zuruecksetzenNachAbmelden() {
  setze({ konto: null, done: {}, merk: {}, challenges: {}, pro: false, abo: null, plan: null, buchungen: {} });
}

let hinweisNr = 0;
export function hinweis(text: string) { setze({ hinweis: { text, nr: ++hinweisNr } }); }
