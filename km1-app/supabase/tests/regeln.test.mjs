// Prüft die Regeln der Datenbank: wer was sehen, schreiben und löschen
// darf. Läuft in PGlite, einer echten Postgres-Datenbank im Prozess,
// ohne Supabase-Konto:  npm test
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const lies = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const db = new PGlite();

// Als wer eine Abfrage läuft: Gast, angemeldeter Nutzer oder der
// Betreiber (ohne Rolle, also über allen Regeln).
async function als(wer, sql, params) {
  await db.exec('reset role');
  if (wer === 'gast') {
    await db.exec("select set_config('request.jwt.claim.sub', '', false); set role anon");
  } else if (wer) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [wer]);
    await db.exec('set role authenticated');
  }
  try { return await db.query(sql, params); }
  finally { await db.exec('reset role'); }
}
const zeilen = async (wer, sql, p) => (await als(wer, sql, p)).rows;
const eins = async (wer, sql, p) => (await zeilen(wer, sql, p))[0];

async function nutzer(daten = {}) {
  const r = await db.query('insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id',
    [(daten.vorname || 'x') + '@beispiel.de', JSON.stringify(daten)]);
  return r.rows[0].id;
}
const videoId = async (slug) => (await db.query('select id from public.videos where slug = $1', [slug])).rows[0].id;
const jahr = new Date().getFullYear();

let luis, lena, kader;

before(async () => {
  await db.exec(lies('./supabase-attrappe.sql'));
  await db.exec(lies('../migrations/20260923120000_grundlage.sql'));
  await db.exec(lies('../seed.sql'));
  luis = await nutzer({ vorname: 'Luis', geburtsjahr: jahr - 30 });
  lena = await nutzer({ vorname: 'Lena', geburtsjahr: jahr - 30 });
  kader = await nutzer({ vorname: 'Kader', geburtsjahr: jahr - 35 });
  await db.query("update public.profiles set rolle = 'trainer' where id = $1", [kader]);
  await db.query("insert into storage.objects (bucket_id, name) values ('videos-geschuetzt', 'ballmitnahme.mp4'), ('videos-geschuetzt', 'profi-freistoss.mp4')");
  await db.query("update public.videos set pfad = slug || '.mp4'");
});

test('Startdaten: 26 Videos, alle live, Pfad mit fünf Wochen je Ebene', async () => {
  const n = await eins(null, "select count(*)::int n, count(*) filter (where woche is not null)::int pfad from public.videos where status = 'live'");
  assert.equal(n.n, 26);
  assert.equal(n.pfad, 20);
});

test('Gast sieht alle Karten, aber nur die Schritte der offenen Stufe', async () => {
  const karten = await zeilen('gast', 'select zugang from public.videos');
  assert.equal(karten.length, 26);
  const stufen = await zeilen('gast', 'select distinct v.zugang from public.video_schritte s join public.videos v on v.id = s.video_id');
  assert.deepEqual(stufen.map(r => r.zugang), ['offen']);
});

test('Mit Konto: Schritte von offen und konto, nicht von pro', async () => {
  const stufen = (await zeilen(luis, 'select distinct v.zugang from public.video_schritte s join public.videos v on v.id = s.video_id order by 1')).map(r => r.zugang);
  assert.deepEqual(stufen, ['konto', 'offen']);
});

test('Mit laufendem Abo auch pro, mit abgelaufenem nicht mehr', async () => {
  await db.query("insert into public.abos (user_id, aktiv, bis, quelle) values ($1, true, now() + interval '7 days', 'app_store')", [lena]);
  let s = (await zeilen(lena, "select count(*)::int n from public.video_schritte s join public.videos v on v.id = s.video_id where v.zugang = 'pro'"))[0].n;
  assert.ok(s > 0);
  await db.query("update public.abos set bis = now() - interval '1 day' where user_id = $1", [lena]);
  s = (await zeilen(lena, "select count(*)::int n from public.video_schritte s join public.videos v on v.id = s.video_id where v.zugang = 'pro'"))[0].n;
  assert.equal(s, 0);
});

test('Fortschritt: eigener ja, für gesperrte Videos nicht, fremder unsichtbar', async () => {
  await als(luis, 'insert into public.fortschritt (user_id, video_id, abgehakt_am) values (auth.uid(), $1, now())', [await videoId('ballmitnahme')]);
  await assert.rejects(als(luis, 'insert into public.fortschritt (user_id, video_id) values (auth.uid(), $1)', [await videoId('profi-freistoss')]), /row-level security/);
  await assert.rejects(als(luis, 'insert into public.fortschritt (user_id, video_id) values ($1, $2)', [lena, await videoId('leiter')]), /row-level security/);
  assert.equal((await zeilen(lena, 'select * from public.fortschritt')).length, 0);
  await assert.rejects(als('gast', 'insert into public.fortschritt (user_id, video_id) values ($1, $2)', [luis, await videoId('leiter')]));
});

test('Profil: Vorname änderbar, Rolle und Ebene nicht', async () => {
  await als(luis, "update public.profiles set vorname = 'Luisito' where id = auth.uid()");
  assert.equal((await eins(luis, 'select vorname from public.profiles')).vorname, 'Luisito');
  await assert.rejects(als(luis, "update public.profiles set rolle = 'trainer' where id = auth.uid()"), /permission denied/);
  await assert.rejects(als(luis, 'update public.profiles set ebene = 4 where id = auth.uid()'), /permission denied/);
  assert.equal((await zeilen(luis, 'select * from public.profiles')).length, 1);
});

test('Abo lässt sich nicht selbst eintragen', async () => {
  await assert.rejects(als(luis, "insert into public.abos (user_id, aktiv) values (auth.uid(), true)"), /permission denied/);
});

test('Unter 16 nur mit Einwilligung der Eltern', async () => {
  await assert.rejects(nutzer({ vorname: 'Tim', geburtsjahr: jahr - 11 }), /Eltern/);
  const tim = await nutzer({ vorname: 'Tim', geburtsjahr: jahr - 11, eltern_einwilligung: true, einwilligung_fassung: '2026-09' });
  const p = (await db.query('select eltern_einwilligung_am, eltern_einwilligung_fassung from public.profiles where id = $1', [tim])).rows[0];
  assert.ok(p.eltern_einwilligung_am);
  assert.equal(p.eltern_einwilligung_fassung, '2026-09');
});

test('Alter nachtragen (Anmeldung mit Google): unter 16 abgelehnt, erwachsen ja', async () => {
  const g = await nutzer({ vorname: 'Google' });
  await assert.rejects(als(g, 'select public.profil_ergaenzen($1, $2)', ['Mia', jahr - 12]), /Eltern/);
  await als(g, 'select public.profil_ergaenzen($1, $2)', ['Mia', jahr - 40]);
  assert.equal((await eins(g, 'select geburtsjahr from public.profiles')).geburtsjahr, jahr - 40);
});

test('Aufstieg erst, wenn der ganze Pfad abgehakt ist', async () => {
  const pfad = (await db.query('select id from public.videos where ebene = 1 and woche is not null order by woche')).rows.map(r => r.id);
  for (const id of pfad.slice(0, 4)) await als(lena, 'insert into public.fortschritt (user_id, video_id, abgehakt_am) values (auth.uid(), $1, now())', [id]);
  assert.equal((await eins(lena, 'select public.aufsteigen() e')).e, 1);
  await als(lena, 'insert into public.fortschritt (user_id, video_id, abgehakt_am) values (auth.uid(), $1, now())', [pfad[4]]);
  assert.equal((await eins(lena, 'select public.aufsteigen() e')).e, 2);
  assert.equal((await eins(lena, 'select ebene from public.profiles')).ebene, 2);
});

test('Speicher: signierter Link nur für die eigene Stufe', async () => {
  const sieht = async (wer) => (await zeilen(wer, 'select name from storage.objects order by name')).map(r => r.name);
  assert.deepEqual(await sieht('gast'), []);
  assert.deepEqual(await sieht(luis), ['ballmitnahme.mp4']);
  assert.deepEqual(await sieht(kader), ['ballmitnahme.mp4', 'profi-freistoss.mp4']);
});

test('Nur der Trainer legt Videos an', async () => {
  await assert.rejects(als(luis, "insert into public.videos (slug, titel, kategorie, ebene) values ('x', 'X', 'passen', 1)"), /row-level security/);
  await als(kader, "insert into public.videos (slug, titel, kategorie, ebene) values ('neu-vom-trainer', 'Neu', 'passen', 1)");
  assert.equal((await zeilen('gast', "select * from public.videos where slug = 'neu-vom-trainer'")).length, 0, 'Entwurf bleibt unsichtbar');
});

test('Konto löschen nimmt alles mit', async () => {
  const weg = await nutzer({ vorname: 'Weg', geburtsjahr: jahr - 30 });
  await als(weg, 'insert into public.merkliste (user_id, video_id) values (auth.uid(), $1)', [await videoId('leiter')]);
  await als(weg, 'insert into public.fortschritt (user_id, video_id) values (auth.uid(), $1)', [await videoId('leiter')]);
  await als(weg, 'select public.konto_loeschen()');
  for (const t of ['auth.users where id', 'public.profiles where id', 'public.merkliste where user_id', 'public.fortschritt where user_id']) {
    const n = (await db.query(`select count(*)::int n from ${t} = $1`, [weg])).rows[0].n;
    assert.equal(n, 0, t);
  }
  await assert.rejects(als('gast', 'select public.konto_loeschen()'), /permission denied/);
});
