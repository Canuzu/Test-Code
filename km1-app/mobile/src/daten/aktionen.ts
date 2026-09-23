/* Alles, was die App tut: Anmelden, Abhaken, Merken, Löschen. Mit Server
   geht jede Änderung an Supabase, ohne Server bleibt sie auf dem Gerät.
   Die Bildschirme rufen nur diese Funktionen auf und wissen nicht, wo
   die Daten liegen. */
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TAG_MS, wochenStart } from '@/lib/zeit';
import { EINWILLIGUNG_FASSUNG, VORSCHAU_KATALOG, type Video } from './katalog';
import {
  geraetSpeichertKonto, hinweis, laden, lies, setze, zuruecksetzenNachAbmelden,
  type Konto, type Zustand,
} from './zustand';

WebBrowser.maybeCompleteAuthSession();

/* Bis Kaders Videos hochgeladen sind, spielt jedes Video dieses Testvideo:
   ein öffentlicher HLS-Strom, der die Qualität dem Netz anpasst. */
export const TESTVIDEO = process.env.EXPO_PUBLIC_TESTVIDEO_URL
  ?? 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

// ---------------------------------------------------------------------
// Abgeleitetes. Reine Funktionen über dem Zustand.
// ---------------------------------------------------------------------
export const istTrainer = (s: Zustand) => s.konto?.rolle === 'trainer';

export function gesperrt(v: Video, s: Zustand = lies()) {
  if (istTrainer(s)) return false;
  if (v.zugang === 'pro') return !s.pro;
  if (v.zugang === 'konto') return !s.konto;
  return false;
}

export const videoFuer = (slug: string, s: Zustand = lies()) => s.katalog.find((v) => v.slug === slug);

/* Abgehakte Übungen. Challenges zählen nicht dazu. */
export const uebungen = (s: Zustand) => Object.keys(s.done).filter((k) => s.katalog.some((v) => v.slug === k));

export function dieseWoche(s: Zustand) {
  const ab = wochenStart();
  return uebungen(s).filter((k) => s.done[k] >= ab).length;
}

/* Wochen am Stück mit mindestens einer Übung. Die laufende Woche bricht
   die Serie nicht, solange sie noch läuft. */
export function serieWochen(s: Zustand) {
  const wochen = new Set(uebungen(s).map((k) => wochenStart(s.done[k])));
  let ab = wochenStart(), n = 0;
  if (!wochen.has(ab)) ab = wochenStart(ab - TAG_MS);
  while (wochen.has(ab)) { n++; ab = wochenStart(ab - TAG_MS); }
  return n;
}

export const offenFuerMich = (s: Zustand) => s.katalog.filter((v) => !gesperrt(v, s) && !s.done[v.slug]).length;

export function pfad(s: Zustand, nr: number) {
  return s.katalog.filter((v) => v.ebene === nr && v.woche != null).sort((a, b) => (a.woche ?? 0) - (b.woche ?? 0));
}
export function lvFortschritt(s: Zustand, nr: number) {
  const p = pfad(s, nr);
  return { fertig: p.filter((v) => s.done[v.slug]).length, gesamt: p.length };
}

export function naechstesVideo(s: Zustand): Video | null {
  const lv = s.konto ? s.konto.ebene : 1;
  const offen = s.katalog.filter((v) => !gesperrt(v, s) && !s.done[v.slug]);
  return offen.find((v) => v.ebene === lv) ?? offen[0] ?? null;
}

/* Woran das Kind gerade arbeitet: das angefangene Video, sonst das nächste. */
export function geradeDran(s: Zustand): Video | null {
  if (!s.konto) return null;
  const z = s.zuletzt ? videoFuer(s.zuletzt, s) : undefined;
  if (z && s.stelle[z.slug] && !s.done[z.slug] && !gesperrt(z, s)) return z;
  return naechstesVideo(s);
}

// ---------------------------------------------------------------------
// Start und Sitzung
// ---------------------------------------------------------------------
const VIDEO_FELDER = 'id,slug,titel,beschreibung,fehler,kategorie,ebene,woche,dauer_sek,zugang,gast,neu,bild,pfad,reihenfolge,video_schritte(nr,text,sekunde)';

async function katalogVomServer(): Promise<Video[]> {
  const { data, error } = await supabase!.from('videos').select(VIDEO_FELDER)
    .eq('status', 'live').order('reihenfolge');
  if (error) throw error;
  return (data ?? []).map(({ video_schritte, ...v }: any) => ({
    ...v,
    schritte: [...(video_schritte ?? [])].sort((a, b) => a.nr - b.nr),
  }));
}

async function nutzerVomServer(user: User) {
  const sb = supabase!;
  const [p, f, m, c, a] = await Promise.all([
    sb.from('profiles').select('vorname,ebene,rolle,geburtsjahr,eltern_einwilligung_am,erstellt_am').eq('id', user.id).single(),
    sb.from('fortschritt').select('video_id,abgehakt_am'),
    sb.from('merkliste').select('video_id,am'),
    sb.from('challenge_ergebnisse').select('challenge,am'),
    sb.from('abos').select('aktiv,bis').maybeSingle(),
  ]);
  for (const r of [p, f, m, c, a]) if (r.error) throw r.error;
  const s = lies(), slug = (id: string) => s.katalog.find((v) => v.id === id)?.slug;
  const done: Record<string, number> = {}, merk: Record<string, number> = {}, challenges: Record<string, number> = {};
  for (const r of f.data ?? []) { const k = slug(r.video_id); if (k && r.abgehakt_am) done[k] = Date.parse(r.abgehakt_am); }
  for (const r of m.data ?? []) { const k = slug(r.video_id); if (k) merk[k] = Date.parse(r.am); }
  for (const r of c.data ?? []) challenges[r.challenge] = Date.parse(r.am);
  const abo = a.data;
  const konto: Konto = {
    id: user.id, email: user.email ?? null,
    vorname: p.data!.vorname, ebene: p.data!.ebene, rolle: p.data!.rolle,
    seit: Date.parse(p.data!.erstellt_am), geburtsjahr: p.data!.geburtsjahr,
    eltern: !!p.data!.eltern_einwilligung_am, lokal: false,
  };
  setze({
    konto, done, merk, challenges,
    pro: !!abo && abo.aktiv && (!abo.bis || Date.parse(abo.bis) > Date.now()),
    abo: abo?.bis ? { preis: null, bis: Date.parse(abo.bis) } : null,
  });
}

let sitzungNutzer: string | null | undefined;

async function sitzungWechsel(sitzung: Session | null, erzwingen = false) {
  const uid = sitzung?.user.id ?? null;
  if (uid === sitzungNutzer && !erzwingen) return;
  sitzungNutzer = uid;
  try {
    // Mit Anmeldung gibt der Server mehr Schritte heraus, also neu laden.
    setze({ katalog: await katalogVomServer(), katalogFehler: null });
    if (sitzung) await nutzerVomServer(sitzung.user);
    else zuruecksetzenNachAbmelden();
  } catch (e) {
    setze({ katalogFehler: meldung(e) });
  } finally {
    setze({ bereit: true });
  }
}

export async function start() {
  geraetSpeichertKonto(!supabase);
  laden();
  if (!supabase) { setze({ bereit: true }); return; }
  // Der Rückruf darf nicht selbst auf Supabase warten, sonst hängt die
  // Bibliothek. Deshalb über setTimeout.
  supabase.auth.onAuthStateChange((ereignis, sitzung) => {
    if (ereignis === 'TOKEN_REFRESHED') return;
    setTimeout(() => sitzungWechsel(sitzung, ereignis === 'USER_UPDATED'), 0);
  });
}

export async function neuLaden() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  await sitzungWechsel(data.session, true);
}

// ---------------------------------------------------------------------
// Konto
// ---------------------------------------------------------------------
/* Fehler vom Server in Sätze, die ein Kind oder ein Elternteil versteht. */
export function meldung(e: unknown): string {
  const t = String((e as any)?.message ?? e ?? '');
  if (/Invalid login credentials/i.test(t)) return 'E-Mail oder Passwort stimmt nicht.';
  if (/Email not confirmed/i.test(t)) return 'Bitte bestätige zuerst den Link in der E-Mail.';
  if (/already registered|already been registered/i.test(t)) return 'Für diese E-Mail gibt es schon ein Konto.';
  if (/Password should be at least/i.test(t)) return 'Das Passwort braucht mindestens 8 Zeichen.';
  if (/Eltern|Database error saving new user/i.test(t)) return 'Unter 16 Jahren legen die Eltern das Konto an.';
  if (/rate limit/i.test(t)) return 'Zu viele Versuche. Bitte in ein paar Minuten noch einmal.';
  if (/Network|fetch/i.test(t)) return 'Keine Verbindung. Bitte prüf das Netz und versuch es noch einmal.';
  return t || 'Das hat nicht geklappt.';
}

const trainerMail = (mail: string) => /kader|km1-training/i.test(mail);

function lokalesKonto(vorname: string, email: string, geburtsjahr: number | null, eltern: boolean): Konto {
  return {
    id: 'vorschau', vorname, email, ebene: 1, rolle: trainerMail(email) ? 'trainer' : 'spieler',
    seit: Date.now(), geburtsjahr, eltern, lokal: true,
  };
}

export type Anmeldedaten = {
  vorname: string; email: string; passwort: string; geburtsjahr: number; eltern: boolean;
};

/* Gibt zurück, ob noch eine E-Mail bestätigt werden muss. */
export async function registrieren(d: Anmeldedaten): Promise<{ bestaetigen: boolean }> {
  if (!supabase) {
    setze({ konto: lokalesKonto(d.vorname, d.email, d.geburtsjahr, d.eltern) });
    return { bestaetigen: false };
  }
  const { data, error } = await supabase.auth.signUp({
    email: d.email.trim(),
    password: d.passwort,
    options: {
      emailRedirectTo: Linking.createURL('/anmelden'),
      data: {
        vorname: d.vorname.trim(), geburtsjahr: d.geburtsjahr,
        eltern_einwilligung: d.eltern, einwilligung_fassung: d.eltern ? EINWILLIGUNG_FASSUNG : null,
      },
    },
  });
  if (error) throw new Error(meldung(error));
  return { bestaetigen: !data.session };
}

export async function anmelden(email: string, passwort: string) {
  if (!supabase) {
    const alt = lies().konto;
    setze({ konto: alt ?? lokalesKonto(email.split('@')[0] || 'Spieler', email, null, false) });
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: passwort });
  if (error) throw new Error(meldung(error));
}

/* Anmeldung über Google: der Browser öffnet sich, Google schickt einen
   Code zurück, und Supabase tauscht ihn gegen eine Sitzung. */
export async function mitGoogle(): Promise<boolean> {
  if (!supabase) throw new Error('Die Anmeldung mit Google geht, sobald der Server verbunden ist.');
  const zurueck = makeRedirectUri({ path: 'anmelden' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: zurueck, skipBrowserRedirect: true },
  });
  if (error || !data?.url) throw new Error(meldung(error));
  const antwort = await WebBrowser.openAuthSessionAsync(data.url, zurueck);
  if (antwort.type !== 'success') return false;
  return codeEinloesen(antwort.url);
}

/* Links aus E-Mails (Bestätigung, neues Passwort) und aus der Google-
   Anmeldung bringen einen Code mit. */
export async function codeEinloesen(urlOderCode: string): Promise<boolean> {
  if (!supabase) return false;
  const url = urlOderCode.includes('=') ? urlOderCode : `km1://?code=${urlOderCode}`;
  const { params, errorCode } = getQueryParams(url);
  if (errorCode) throw new Error(meldung(params.error_description || errorCode));
  if (!params.code) return false;
  const { error } = await supabase.auth.exchangeCodeForSession(params.code);
  if (error) throw new Error(meldung(error));
  return true;
}

export async function passwortVergessen(email: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('/passwort'),
  });
  if (error) throw new Error(meldung(error));
}

export async function passwortSetzen(neu: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password: neu });
  if (error) throw new Error(meldung(error));
}

/* Wer sich mit Google angemeldet hat, trägt hier Vorname und Jahrgang nach. */
export async function profilErgaenzen(vorname: string, geburtsjahr: number) {
  const k = lies().konto;
  if (!k) return;
  if (supabase) {
    const { error } = await supabase.rpc('profil_ergaenzen', { p_vorname: vorname, p_geburtsjahr: geburtsjahr });
    if (error) throw new Error(meldung(error));
  }
  setze({ konto: { ...k, vorname: vorname.trim() || k.vorname, geburtsjahr } });
}

export async function abmelden() {
  if (supabase) await supabase.auth.signOut();
  zuruecksetzenNachAbmelden();
}

/* Löscht das Konto mit allem, was dranhängt. Auf dem Server nimmt die
   Datenbank Profil, Fortschritt, Merkliste und Abo mit. */
export async function kontoLoeschen() {
  if (supabase) {
    const { error } = await supabase.rpc('konto_loeschen');
    if (error) throw new Error(meldung(error));
    await supabase.auth.signOut({ scope: 'local' });
  }
  zuruecksetzenNachAbmelden();
  setze({ stelle: {}, zuletzt: null });
}

// ---------------------------------------------------------------------
// Fortschritt
// ---------------------------------------------------------------------
function pfadGeschafft(s: Zustand, lv: number) {
  const p = pfad(s, lv).filter((v) => !gesperrt(v, s));
  return p.length > 0 && p.every((v) => s.done[v.slug]);
}

/* Hakt ab oder nimmt den Haken zurück. Gibt zurück, ob der Nutzer dadurch
   aufgestiegen ist. */
export async function abhaken(slug: string): Promise<{ abgehakt: boolean; aufstieg: boolean }> {
  const vorher = lies(), k = vorher.konto;
  if (!k) throw new Error('Kein Konto');
  const v = videoFuer(slug, vorher);
  const war = !!vorher.done[slug];
  const done = { ...vorher.done };
  if (war) delete done[slug]; else done[slug] = Date.now();
  setze({ done });

  if (supabase && v?.id) {
    const { error } = await supabase.from('fortschritt').upsert({
      user_id: k.id, video_id: v.id, abgehakt_am: war ? null : new Date().toISOString(),
      geaendert: new Date().toISOString(),
    });
    if (error) { setze({ done: vorher.done }); throw new Error(meldung(error)); }
    if (!war) {
      const { data, error: e2 } = await supabase.rpc('aufsteigen');
      if (!e2 && typeof data === 'number' && data > k.ebene) {
        setze({ konto: { ...k, ebene: data } });
        return { abgehakt: true, aufstieg: true };
      }
    }
    return { abgehakt: !war, aufstieg: false };
  }

  if (!war && k.ebene < 4 && pfadGeschafft(lies(), k.ebene)) {
    setze({ konto: { ...k, ebene: k.ebene + 1 } });
    return { abgehakt: true, aufstieg: true };
  }
  return { abgehakt: !war, aufstieg: false };
}

export async function merken(slug: string): Promise<boolean> {
  const vorher = lies(), k = vorher.konto;
  if (!k) throw new Error('Kein Konto');
  const v = videoFuer(slug, vorher);
  const war = !!vorher.merk[slug];
  const merk = { ...vorher.merk };
  if (war) delete merk[slug]; else merk[slug] = Date.now();
  setze({ merk });
  if (supabase && v?.id) {
    const r = war
      ? await supabase.from('merkliste').delete().eq('user_id', k.id).eq('video_id', v.id)
      : await supabase.from('merkliste').insert({ user_id: k.id, video_id: v.id });
    if (r.error) { setze({ merk: vorher.merk }); throw new Error(meldung(r.error)); }
  }
  return !war;
}

export async function challengeUmschalten(id: string): Promise<boolean> {
  const vorher = lies(), k = vorher.konto;
  if (!k) throw new Error('Kein Konto');
  const war = !!vorher.challenges[id];
  const challenges = { ...vorher.challenges };
  if (war) delete challenges[id]; else challenges[id] = Date.now();
  setze({ challenges });
  if (supabase) {
    const r = war
      ? await supabase.from('challenge_ergebnisse').delete().eq('user_id', k.id).eq('challenge', id)
      : await supabase.from('challenge_ergebnisse').insert({ user_id: k.id, challenge: id });
    if (r.error) { setze({ challenges: vorher.challenges }); throw new Error(meldung(r.error)); }
  }
  return !war;
}

/* Wo ein Video stehen blieb. Ganz am Anfang und fast am Ende zählt nicht,
   sonst steht oben auf der Startseite ein Video, das man schon kennt. */
export function stelleMerken(slug: string, sek: number, dauer: number) {
  const s = lies();
  const stelle = { ...s.stelle };
  if (sek < 5 || (dauer > 0 && sek / dauer > 0.95)) {
    if (!(slug in stelle)) return;
    delete stelle[slug];
    setze({ stelle });
    return;
  }
  if (Math.abs((stelle[slug] ?? 0) - sek) < 1 && s.zuletzt === slug) return;
  stelle[slug] = sek;
  setze({ stelle, zuletzt: slug });
}

/* Ohne Store-Konto gibt es noch keinen echten Kauf. Im Vorschau-Modus
   lässt sich Pro trotzdem ansehen, damit die Profi-Einheiten testbar sind. */
export function proVorschau(preis: 'monat' | 'jahr') {
  setze({ pro: true, abo: { preis, bis: Date.now() + 7 * TAG_MS } });
}

// ---------------------------------------------------------------------
// Die Videodatei
// ---------------------------------------------------------------------
/* Der Abspiellink. Die offene Stufe liegt im öffentlichen Speicher; die
   anderen bekommen einen signierten Link, der eine Stunde gilt — und den
   gibt der Server nur heraus, wenn die Stufe passt. */
export async function quelle(v: Video): Promise<string> {
  if (!supabase || !v.pfad) return TESTVIDEO;
  if (v.zugang === 'offen') return supabase.storage.from('videos-offen').getPublicUrl(v.pfad).data.publicUrl;
  const { data, error } = await supabase.storage.from('videos-geschuetzt').createSignedUrl(v.pfad, 3600);
  if (error || !data) throw new Error('Das Video lässt sich gerade nicht laden.');
  return data.signedUrl;
}

export { hinweis, VORSCHAU_KATALOG };
