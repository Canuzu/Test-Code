// Prüft die Regeln der Gemeinschaft: Haken, Einladungen, Familie, Teams,
// Videos mit Freigabe, Nachrichten, Laufbahn, Scouting, Meldungen, Pläne
// und Camps. Dieselbe Geschichte wie in der App: Luis (12) und Finn (12)
// in der U13, Luis' Mutter Sandra, Finns Mutter Anja, Trainer Tim, die
// Akademie Rheinblick, der FC Rheinstadt mit Torwart Niklas Hartwig,
// Scout Marco, Jannik (17) und Kader für KM1. Alle Namen sind erfunden.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const lies = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const db = new PGlite();

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
const wert = async (wer, sql, p) => Object.values(await eins(wer, sql, p))[0];

const jahr = new Date().getFullYear();
async function nutzer(daten = {}) {
  const r = await db.query('insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id',
    [(daten.vorname || 'x').replace(/\s/g, '') + Math.random().toString(36).slice(2, 6) + '@beispiel.de', JSON.stringify(daten)]);
  return r.rows[0].id;
}
const kind = (vorname, alter) => nutzer({ vorname, geburtsjahr: jahr - alter, eltern_einwilligung: true, einwilligung_fassung: '2026-09' });
const videoId = async (slug) => (await db.query('select id from public.videos where slug = $1', [slug])).rows[0].id;

let kader, luis, finn, jannik, sandra, anja, tim, rheinblick, rheinstadt, marco, hartwig, fan, fremde, team;

before(async () => {
  await db.exec(lies('./supabase-attrappe.sql'));
  await db.exec(lies('../migrations/20260923120000_grundlage.sql'));
  await db.exec(lies('../migrations/20260927120000_gemeinschaft.sql'));
  await db.exec(lies('../seed.sql'));
  kader = await nutzer({ vorname: 'Kader', geburtsjahr: jahr - 35 });
  await db.query("update public.profiles set rolle = 'km1' where id = $1", [kader]);
  luis = await kind('Luis', 12);
  finn = await kind('Finn', 12);
  jannik = await nutzer({ vorname: 'Jannik', geburtsjahr: jahr - 17, eltern_einwilligung: true });
  sandra = await nutzer({ vorname: 'Sandra', rolle: 'eltern' });
  anja = await nutzer({ vorname: 'Anja', rolle: 'eltern' });
  fremde = await nutzer({ vorname: 'Fremde', rolle: 'eltern' });
  tim = await nutzer({ vorname: 'Tim', rolle: 'trainer', geburtsjahr: jahr - 34 });
  rheinblick = await nutzer({ vorname: 'Akademie Rheinblick', rolle: 'akademie' });
  rheinstadt = await nutzer({ vorname: 'FC Rheinstadt', rolle: 'verein' });
  marco = await nutzer({ vorname: 'Marco', rolle: 'scout', geburtsjahr: jahr - 41 });
  hartwig = await nutzer({ vorname: 'Niklas', rolle: 'profi', geburtsjahr: jahr - 27 });
  fan = await nutzer({ vorname: 'Fan', geburtsjahr: jahr - 25 });
});

test('Rolle kommt aus der Anmeldung, KM1 wählt niemand selbst', async () => {
  await assert.rejects(nutzer({ vorname: 'Hacker', rolle: 'km1' }), /Rolle/);
  assert.equal(await wert(tim, 'select rolle from public.profiles where id = auth.uid()'), 'trainer');
  assert.equal(await wert(tim, 'select geprueft_am from public.profiles where id = auth.uid()'), null);
  await assert.rejects(als(tim, "update public.profiles set geprueft_am = now() where id = auth.uid()"), /permission denied/);
  await assert.rejects(als(tim, "update public.profiles set rolle = 'km1' where id = auth.uid()"), /permission denied/);
});

test('Prüfung: einreichen darf, wer mit Kindern arbeitet, entscheiden nur KM1', async () => {
  for (const org of [rheinblick, rheinstadt]) {
    await als(org, "insert into public.pruefungen (user_id, belege) values (auth.uid(), array['Vereinsregister','Kinderschutzkonzept'])");
  }
  await assert.rejects(als(luis, "insert into public.pruefungen (user_id, belege) values (auth.uid(), array['x'])"), /row-level security/);
  const p = await wert(kader, 'select id from public.pruefungen where user_id = $1', [rheinblick]);
  await assert.rejects(als(rheinblick, 'select public.pruefung_entscheiden($1, true)', [p]), /Nur KM1/);
  assert.equal((await zeilen(fan, 'select * from public.pruefungen')).length, 0, 'Fremde Prüfungen sieht niemand');
  await als(kader, 'select public.pruefung_entscheiden($1, true)', [p]);
  await als(kader, 'select public.pruefung_entscheiden($1, true)', [await wert(kader, 'select id from public.pruefungen where user_id = $1', [rheinstadt])]);
  assert.equal(await wert(null, 'select public.ist_geprueft($1)', [rheinblick]), true);
  assert.equal(await wert(null, "select geprueft_ueber from public.profiles where id = $1", [rheinblick]), 'belege');
});

test('Einladung: nur geprüfte Vereine, nur mit Bestätigung, einmal und für eine Rolle', async () => {
  await assert.rejects(als(tim, "select public.einladung_erstellen('trainer', 'x', true)"), /Vereine und Akademien/);
  await assert.rejects(als(rheinblick, "select public.einladung_erstellen('trainer', 'x', false)"), /Bestätigung/);
  await assert.rejects(als(rheinblick, "select public.einladung_erstellen('profi', 'x', true)"), /nicht einladen/);
  const code = await wert(rheinblick, "select public.einladung_erstellen('trainer', 'Trainer U13', true)");
  assert.match(code, /^AKA-T-[A-Z2-9]{4}$/);
  await assert.rejects(als(marco, 'select public.einladung_einloesen($1)', [code]), /andere Rolle/);
  assert.equal(await wert(tim, 'select public.einladung_einloesen($1)', [code.toLowerCase().replace(/-/g, ' ')]), 'Akademie Rheinblick');
  const p = await eins(null, 'select geprueft_ueber, buerge from public.profiles where id = $1', [tim]);
  assert.deepEqual(p, { geprueft_ueber: 'einladung', buerge: rheinblick });
  const zweiter = await nutzer({ vorname: 'Zweiter', rolle: 'trainer' });
  await assert.rejects(als(zweiter, 'select public.einladung_einloesen($1)', [code]), /schon benutzt/);
  await assert.rejects(als(zweiter, "select public.einladung_einloesen('GIBT-ES-NICHT')"), /gibt es nicht/);
  assert.equal((await zeilen(zweiter, 'select * from public.einladungen')).length, 0);
  assert.equal((await zeilen(rheinblick, 'select * from public.einladungen')).length, 1);
  await assert.rejects(als(rheinblick, "insert into public.einladungen (code, von, rolle, bestaetigt) values ('X', auth.uid(), 'trainer', 'fuehrungszeugnis')"), /permission denied/);
});

test('KM1 entzieht den Haken, der Code ist dann verbraucht', async () => {
  const scoutCode = await wert(rheinstadt, "select public.einladung_erstellen('scout', 'Scout U17', true)");
  await als(marco, 'select public.einladung_einloesen($1)', [scoutCode]);
  assert.equal(await wert(null, 'select public.ist_geprueft($1)', [marco]), true);
  await assert.rejects(als(rheinstadt, 'select public.haken_entziehen($1, $2)', [marco, 'x']), /Nur KM1/);
  await als(kader, 'select public.haken_entziehen($1, $2)', [marco, 'Nach einer Meldung']);
  assert.equal(await wert(null, 'select public.ist_geprueft($1)', [marco]), false);
  assert.ok(await wert(null, 'select entzogen_am from public.einladungen where code = $1', [scoutCode]));
  // Für die weiteren Tests bekommt Marco einen neuen Code.
  await als(marco, 'select public.einladung_einloesen($1)', [await wert(rheinstadt, "select public.einladung_erstellen('scout', 'Scout', true)")]);
  await als(hartwig, 'select public.einladung_einloesen($1)', [await wert(rheinstadt, "select public.einladung_erstellen('profi', 'Tor', true)")]);
  assert.equal(await wert(null, "select bestaetigt from public.einladungen where genutzt_von = $1", [hartwig]), 'profikader');
});

test('Familie: Eltern verbinden sich mit dem Code aus der App ihres Kindes', async () => {
  const code = await wert(luis, 'select code from public.kind_codes');
  assert.match(code, /^[0-9A-F]{8}$/);
  assert.equal((await zeilen(sandra, 'select * from public.kind_codes')).length, 0, 'Den Code liest nur das Kind');
  assert.equal((await zeilen(tim, 'select * from public.kind_codes')).length, 0);
  await assert.rejects(als(tim, 'select public.kind_verbinden($1)', [code]), /Elternkonto/);
  await assert.rejects(als(sandra, "select public.kind_verbinden('FALSCH')"), /gibt es nicht/);
  await als(sandra, 'select public.kind_verbinden($1)', [code.toLowerCase()]);
  await als(anja, 'select public.kind_verbinden($1)', [await wert(finn, 'select code from public.kind_codes')]);
  assert.equal((await zeilen(luis, 'select * from public.familie')).length, 1);
  assert.equal((await zeilen(fremde, 'select * from public.familie')).length, 0);
  await assert.rejects(als(fremde, 'insert into public.familie (eltern_id, kind_id) values (auth.uid(), $1)', [luis]), /permission denied/);
});

test('Team: nur ein Trainer mit Haken legt an, aufnehmen muss er selbst', async () => {
  const ohne = await nutzer({ vorname: 'Ohne', rolle: 'trainer' });
  await assert.rejects(als(ohne, "insert into public.teams (name, trainer_id) values ('U9', auth.uid())"), /row-level security/);
  team = await wert(tim, "insert into public.teams (name, verein, trainer_id) values ('U13', 'SC Rheinblick', auth.uid()) returning id");
  const code = await wert(tim, 'select code from public.teams where id = $1', [team]);
  await assert.rejects(als(sandra, 'select public.team_beitreten($1)', [code]), /Nur Spieler|nur Spieler/i);
  for (const s of [luis, finn]) await als(s, 'select public.team_beitreten($1)', [code]);
  assert.equal(await wert(null, 'select public.im_team($1, $2)', [luis, team]), false, 'Mit Code ist man angefragt, nicht drin');
  await assert.rejects(als(luis, 'select public.mitglied_entscheiden($1, $2, true)', [team, luis]), /Trainer/);
  for (const s of [luis, finn]) await als(tim, 'select public.mitglied_entscheiden($1, $2, true)', [team, s]);
  assert.equal(await wert(null, 'select public.selbes_team($1, $2)', [luis, finn]), true);
  assert.equal(await wert(null, 'select public.selbes_team($1, $2)', [luis, tim]), true);
  assert.equal((await zeilen(sandra, 'select * from public.teams')).length, 1, 'Eltern sehen die Mannschaft ihres Kindes');
  assert.equal((await zeilen(fremde, 'select * from public.teams')).length, 0);
});

test('Hausaufgaben: der Trainer gibt auf, die Mannschaft und ihre Eltern sehen sie', async () => {
  await als(tim, "insert into public.hausaufgaben (team_id, video_id, bis, notiz) values ($1, $2, current_date + 5, 'Jeden Tag fünf Minuten')", [team, await videoId('uebersteiger')]);
  assert.equal((await zeilen(luis, 'select * from public.hausaufgaben')).length, 1);
  assert.equal((await zeilen(anja, 'select * from public.hausaufgaben')).length, 1);
  assert.equal((await zeilen(fan, 'select * from public.hausaufgaben')).length, 0);
  await assert.rejects(als(luis, "insert into public.hausaufgaben (team_id, video_id, bis) values ($1, $2, current_date)", [team, await videoId('leiter')]), /row-level security/);
});

test('Video eines Kindes wartet auf die Eltern und ist nie für Gäste', async () => {
  const u = await wert(luis, "insert into public.uploads (von, team_id, sicht, titel, eltern_status) values (auth.uid(), $1, 'team', 'Übersteiger', 'frei') returning id", [team]);
  assert.equal(await wert(null, 'select eltern_status from public.uploads where id = $1', [u]), 'wartet', 'Das Kind kann die Freigabe nicht selbst setzen');
  const sieht = async (wer) => (await zeilen(wer, 'select id from public.uploads where id = $1', [u])).length === 1;
  assert.equal(await sieht(finn), false);
  assert.equal(await sieht(tim), false);
  assert.equal(await sieht(sandra), true, 'Die Eltern sehen es, um es freizugeben');
  await assert.rejects(als(anja, 'select public.upload_freigeben($1, true)', [u]), /Eltern/);
  await als(sandra, 'select public.upload_freigeben($1, true)', [u]);
  assert.equal(await sieht(finn), true);
  assert.equal(await sieht(tim), true);
  assert.equal(await sieht(anja), true, 'Eltern aus der Mannschaft');
  assert.equal(await sieht(fan), false);
  assert.equal(await sieht(marco), false, 'Ein Teamvideo sieht auch ein Scout nicht');
  assert.equal(await sieht('gast'), false);
  await assert.rejects(als(luis, "update public.uploads set eltern_status = 'frei'"), /permission denied/);
});

test('Wer ein Video sieht: nur Trainer, Profil, ab 16 und KM1', async () => {
  const trainerVid = await wert(sandra, "insert into public.uploads (von, team_id, sicht, titel) values ($1, $2, 'trainer', 'Nur für Tim') returning id", [luis, team]);
  assert.equal(await wert(null, 'select eltern_status from public.uploads where id = $1', [trainerVid]), 'frei', 'Laden die Eltern hoch, ist es frei');
  const sieht = async (wer, id) => (await zeilen(wer, 'select id from public.uploads where id = $1', [id])).length === 1;
  assert.equal(await sieht(tim, trainerVid), true);
  assert.equal(await sieht(finn, trainerVid), false);
  const profil = await wert(sandra, "insert into public.uploads (von, sicht, titel) values ($1, 'profil', 'Auf dem Profil') returning id", [luis]);
  assert.equal(await sieht(marco, profil), true, 'Geprüfte Konten sehen Profilvideos');
  assert.equal(await sieht(fan, profil), false, 'Unter 16 nicht für alle');
  const gross = await wert(jannik, "insert into public.uploads (von, sicht, titel) values (auth.uid(), 'profil', 'Ab 16') returning id");
  assert.equal(await sieht(fan, gross), true, 'Ab 16 für alle in KM1');
  assert.equal(await sieht('gast', gross), false, 'Nie im offenen Netz');
  const anKm1 = await wert(sandra, "insert into public.uploads (von, sicht, titel) values ($1, 'km1', 'Profi-Feedback') returning id", [luis]);
  assert.equal(await sieht(kader, anKm1), true);
  assert.equal(await sieht(tim, anKm1), false);
  await assert.rejects(als(fan, "insert into public.uploads (von, sicht) values ($1, 'profil')", [luis]), /row-level security/);
});

test('Feedback nur vom eigenen Trainer, die Zahl bestätigt nur er', async () => {
  const u = await wert(sandra, "insert into public.uploads (von, team_id, sicht, titel, zahl) values ($1, $2, 'team', 'Challenge', 44) returning id", [luis, team]);
  await als(tim, "insert into public.feedback (upload_id, sekunde, text) values ($1, 12, 'Stark gezählt')", [u]);
  await assert.rejects(als(fan, "insert into public.feedback (upload_id, text) values ($1, 'Hallo')", [u]), /row-level security/);
  await assert.rejects(als(finn, "insert into public.feedback (upload_id, text) values ($1, 'Hi')", [u]), /row-level security/);
  assert.equal((await zeilen(luis, 'select text from public.feedback where upload_id = $1', [u]))[0].text, 'Stark gezählt');
  await assert.rejects(als(finn, 'select public.zahl_bestaetigen($1)', [u]), /Trainer/);
  await als(tim, 'select public.zahl_bestaetigen($1)', [u]);
  assert.equal(await wert(null, 'select zahl_bestaetigt from public.uploads where id = $1', [u]), true);
});

test('Nachrichten: kein Fremder schreibt einem Kind', async () => {
  const recht = async (a, b) => wert(null, 'select public.schreib_recht($1, $2)', [a, b]);
  assert.equal(await recht(hartwig, luis), 'nein');
  assert.equal(await recht(fan, luis), 'nein');
  assert.equal(await recht(marco, luis), 'nein');
  assert.equal(await recht(tim, luis), 'direkt');
  assert.equal(await recht(finn, luis), 'direkt');
  assert.equal(await recht(sandra, luis), 'direkt');
  assert.equal(await recht(anja, luis), 'nein', 'Andere Eltern schreiben nicht dem Kind');
  assert.equal(await recht(kader, luis), 'direkt');
  await assert.rejects(als(hartwig, 'select public.chat_starten($1)', [luis]), /nicht schreiben/);
  await assert.rejects(als(luis, "insert into public.chats (a, b, status) values (auth.uid(), $1, 'offen')", [hartwig]), /permission denied/);
});

test('Chat eines Kindes: die Eltern lesen mit, sonst niemand', async () => {
  const c = await wert(luis, 'select public.chat_starten($1)', [tim]);
  await als(luis, "insert into public.nachrichten (chat_id, text) values ($1, 'Komme ich morgen mit?')", [c]);
  await als(tim, "insert into public.nachrichten (chat_id, text) values ($1, 'Klar, 9:30')", [c]);
  assert.equal((await zeilen(sandra, 'select * from public.nachrichten where chat_id = $1', [c])).length, 2);
  assert.equal((await zeilen(anja, 'select * from public.nachrichten where chat_id = $1', [c])).length, 0);
  assert.equal((await zeilen(finn, 'select * from public.nachrichten where chat_id = $1', [c])).length, 0);
  await assert.rejects(als(finn, "insert into public.nachrichten (chat_id, text) values ($1, 'Hallo')", [c]), /row-level security/);
});

test('Profis: Fans schreiben nicht, Geprüfte fragen an, der Profi entscheidet', async () => {
  const recht = async (a, b) => wert(null, 'select public.schreib_recht($1, $2)', [a, b]);
  assert.equal(await recht(fan, hartwig), 'nein');
  assert.equal(await recht(tim, hartwig), 'anfrage');
  assert.equal(await recht(rheinstadt, hartwig), 'direkt');
  const c = await wert(tim, 'select public.chat_starten($1)', [hartwig]);
  assert.equal(await wert(null, 'select status from public.chats where id = $1', [c]), 'anfrage');
  await als(tim, "insert into public.nachrichten (chat_id, text) values ($1, 'Hättest du Zeit für ein Training?')", [c]);
  await assert.rejects(als(hartwig, "insert into public.nachrichten (chat_id, text) values ($1, 'Ja')", [c]), /row-level security/);
  await als(hartwig, 'select public.anfrage_entscheiden($1, true)', [c]);
  await als(hartwig, "insert into public.nachrichten (chat_id, text) values ($1, 'Gern')", [c]);
});

test('Eltern derselben Mannschaft schreiben sich, Fremde und 16- bis 17-Jährige nicht', async () => {
  const recht = async (a, b) => wert(null, 'select public.schreib_recht($1, $2)', [a, b]);
  assert.equal(await recht(sandra, anja), 'direkt');
  assert.equal(await recht(fremde, sandra), 'nein');
  assert.equal(await recht(sandra, tim), 'direkt', 'Eltern und der Trainer ihres Kindes');
  assert.equal(await recht(marco, jannik), 'nein', 'Unter 18 nur über Eltern oder Akademie');
  await als(luis, 'insert into public.blockiert (wen) values ($1)', [finn]);
  assert.equal(await recht(finn, luis), 'nein', 'Blockiert heißt blockiert');
});

test('Folgen: Kindern unter 16 folgt nur das eigene Team', async () => {
  await assert.rejects(als(fan, 'insert into public.folgen (seite) values ($1)', [luis]), /row-level security/);
  await als(finn, 'insert into public.folgen (seite) values ($1)', [luis]);
  await als(fan, 'insert into public.folgen (seite) values ($1)', [hartwig]);
  await als(luis, 'insert into public.folgen (seite) values ($1)', [hartwig]);
  assert.equal(await wert(fan, 'select public.follower($1)', [hartwig]), 2);
  assert.equal((await zeilen(fan, 'select * from public.folgen where seite = $1', [hartwig])).length, 1, 'Wer sonst folgt, bleibt verborgen');
});

test('Beiträge: öffentlich posten nur Geprüfte, lesen nur Angemeldete', async () => {
  await assert.rejects(als(fan, "insert into public.beitraege (text) values ('Hallo')"), /row-level security/);
  await assert.rejects(als(luis, "insert into public.beitraege (text) values ('Hallo')"), /row-level security/);
  await als(hartwig, "insert into public.beitraege (text) values ('Torwart-Tipp: der erste Schritt')");
  assert.equal((await zeilen(fan, 'select * from public.beitraege')).length, 1);
  assert.equal((await zeilen('gast', 'select * from public.beitraege')).length, 0);
});

test('Profile: voll nur in der Familie und Mannschaft, sonst nur Name, Rolle, Haken', async () => {
  assert.equal((await zeilen(fan, 'select * from public.profiles where id = $1', [luis])).length, 0);
  assert.equal((await zeilen(finn, 'select * from public.profiles where id = $1', [luis])).length, 1);
  assert.equal((await zeilen(sandra, 'select * from public.profiles where id = $1', [luis])).length, 1);
  assert.deepEqual(await eins(fan, 'select vorname, rolle, geprueft from public.profil_kurz($1)', [hartwig]),
    { vorname: 'Niklas', rolle: 'profi', geprueft: true });
  assert.equal((await zeilen(fan, 'select * from public.profil_kurz($1)', [luis])).length, 0, 'Ein Kind bleibt verborgen');
});

test('Laufbahn: Eltern tragen ein, der Trainer bestätigt', async () => {
  const st = await wert(sandra, "insert into public.stationen (spieler_id, verein, team, von_jahr, quelle) values ($1, 'TuS Sonnenhang', 'U11', 2021, 'eltern') returning id", [luis]);
  await assert.rejects(als(luis, "insert into public.stationen (spieler_id, verein, von_jahr, quelle) values (auth.uid(), 'X', 2020, 'selbst')"), /row-level security/);
  await assert.rejects(als(fan, "insert into public.stationen (spieler_id, verein, von_jahr, quelle) values ($1, 'X', 2020, 'eltern')", [luis]), /row-level security/);
  await assert.rejects(als(sandra, "insert into public.stationen (spieler_id, verein, von_jahr, quelle, bestaetigt_am) values ($1, 'X', 2020, 'eltern', now())", [luis]), /row-level security/);
  await assert.rejects(als(fan, 'select public.station_bestaetigen($1, true)', [st]), /Trainer/);
  await als(tim, 'select public.station_bestaetigen($1, true)', [st]);
  assert.equal(await wert(null, 'select bestaetigt_von from public.stationen where id = $1', [st]), tim);
  await als(jannik, "insert into public.stationen (spieler_id, verein, von_jahr, quelle) values (auth.uid(), 'Akademie Rheinblick', 2022, 'selbst')");
});

test('Scouting: unter 16 nur mit Freigabe der Eltern, Kontakt nur über sie', async () => {
  assert.equal((await zeilen(marco, 'select * from public.stationen where spieler_id = $1', [luis])).length, 0);
  await assert.rejects(als(luis, 'select public.talentprofil_freigeben(auth.uid(), true)'), /Eltern/);
  await als(sandra, 'select public.talentprofil_freigeben($1, true)', [luis]);
  assert.equal((await zeilen(marco, 'select * from public.stationen where spieler_id = $1', [luis])).length, 1);
  assert.equal((await zeilen(marco, 'select * from public.stationen where spieler_id = $1', [jannik])).length, 1, 'Ab 16 ohne Freigabe');
  const ohne = await nutzer({ vorname: 'Ungeprüft', rolle: 'scout' });
  assert.equal((await zeilen(ohne, 'select * from public.talentprofile')).length, 0);
  await assert.rejects(als(ohne, 'insert into public.beobachtet (spieler_id) values ($1)', [luis]), /row-level security/);
  await als(marco, 'insert into public.beobachtet (spieler_id) values ($1)', [luis]);
  const k = await wert(marco, "insert into public.kontakt_anfragen (spieler_id, nachricht) values ($1, 'Probetraining?') returning id", [luis]);
  assert.equal((await zeilen(luis, 'select * from public.kontakt_anfragen')).length, 0, 'Das Kind selbst bekommt keine Anfrage');
  assert.equal((await zeilen(sandra, 'select * from public.kontakt_anfragen')).length, 1);
  await assert.rejects(als(marco, 'select public.kontakt_entscheiden($1, true)', [k]), /Eltern/);
  await als(sandra, 'select public.kontakt_entscheiden($1, true)', [k]);
  await als(marco, "insert into public.scout_berichte (spieler_id, text, empfehlung, geteilt) values ($1, 'Starke Annahme', 'probe', true)", [luis]);
  assert.equal((await zeilen(sandra, 'select * from public.scout_berichte')).length, 1, 'Geteilte Berichte sehen die Eltern');
  assert.equal((await zeilen(fan, 'select * from public.scout_berichte')).length, 0);
});

test('Meldungen: jeder meldet, nur KM1 liest und entscheidet', async () => {
  const b = await wert(kader, 'select id from public.beitraege limit 1');
  await als(fan, "insert into public.meldungen (ziel_art, ziel_id, grund) values ('beitrag', $1, 'Zeigt ein Kind ohne Zustimmung')", [b]);
  assert.equal((await zeilen(hartwig, 'select * from public.meldungen')).length, 0, 'Wer gemeldet hat, bleibt unbekannt');
  assert.equal((await zeilen(fan, 'select * from public.meldungen')).length, 1);
  // Wer meldet, entscheidet nicht selbst: die Änderung trifft keine Zeile.
  await als(fan, "update public.meldungen set entscheidung = 'bleibt'");
  assert.equal(await wert(null, 'select entscheidung from public.meldungen limit 1'), null);
  await als(kader, "update public.meldungen set entscheidung = 'entfernt', erledigt_am = now()");
  assert.equal(await wert(null, 'select entscheidung from public.meldungen limit 1'), 'entfernt');
});

test('Pläne: die erste Woche mit Konto, der Rest mit Pro oder über die Mannschaft', async () => {
  assert.equal((await zeilen('gast', 'select * from public.plaene')).length, 3);
  assert.equal((await zeilen('gast', 'select * from public.plan_einheiten')).length, 9, 'Als Vorgeschmack die erste Woche');
  assert.equal((await zeilen(fan, 'select * from public.plan_einheiten')).length, 9);
  await als(fan, "insert into public.plan_laufend (user_id, plan_id) values (auth.uid(), 'dribbling')");
  await als(fan, "insert into public.plan_fortschritt (plan_id, woche, nr) values ('dribbling', 1, 1)");
  await assert.rejects(als(fan, "insert into public.plan_fortschritt (plan_id, woche, nr) values ('dribbling', 2, 1)"), /row-level security/);
  await db.query("insert into public.abos (user_id, aktiv, quelle) values ($1, true, 'app_store')", [fan]);
  assert.equal((await zeilen(fan, 'select * from public.plan_einheiten')).length, 54);
  await als(fan, "insert into public.plan_fortschritt (plan_id, woche, nr) values ('dribbling', 2, 1)");
  // KM1 Team: das Abo des Trainers gilt für die ganze Mannschaft.
  assert.equal((await zeilen(luis, 'select * from public.plan_einheiten')).length, 9);
  await db.query("insert into public.abos (user_id, aktiv, quelle, art) values ($1, true, 'app_store', 'team')", [tim]);
  assert.equal((await zeilen(luis, 'select * from public.plan_einheiten')).length, 54);
  const pro = (await zeilen(luis, "select count(*)::int n from public.video_schritte s join public.videos v on v.id = s.video_id where v.zugang = 'pro'"))[0].n;
  assert.ok(pro > 0, 'Profi-Einheiten für die Mannschaft frei');
  assert.equal((await zeilen(finn, 'select * from public.plan_fortschritt')).length, 0, 'Fremder Fortschritt bleibt verborgen');
});

test('Camp: nur Erwachsene buchen, die Plätze zählen', async () => {
  await assert.rejects(als(luis, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', false, 'karte')",
    [JSON.stringify([{ vorname: 'Luis', jahrgang: jahr - 12 }])]), /Erwachsener/);
  // Ein Kind ohne Einwilligung der Eltern bucht auch mit der Bestätigung nicht.
  const ohne = await nutzer({ vorname: 'Ohne', geburtsjahr: jahr - 17 });
  await assert.rejects(als(ohne, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', false, 'karte', true)",
    [JSON.stringify([{ vorname: 'Ohne', jahrgang: 2014 }])]), /Erwachsener/);
  // Das Konto von Luis läuft auf die E-Mail seiner Eltern. Mit der
  // Bestätigung, erziehungsberechtigt zu sein, bucht ein Elternteil darüber.
  const l = await eins(luis, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', false, 'karte', true)",
    [JSON.stringify([{ vorname: 'Luis', jahrgang: 2014 }])]);
  assert.equal(l.summe_cent, 24900);
  await db.query('delete from public.camp_buchungen');
  const b = await eins(sandra, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', false, 'paypal')",
    [JSON.stringify([{ vorname: 'Luis', jahrgang: 2014 }, { vorname: 'Mila', jahrgang: 2017, hinweise: 'Nussallergie' }])]);
  assert.equal(b.summe_cent, 2 * 24900 - 2000);
  assert.match(b.nr, /^HC-\d{4}-[0-9A-F]{4}$/);
  assert.equal((await zeilen(sandra, 'select * from public.camp_buchungen')).length, 1);
  assert.equal((await zeilen(anja, 'select * from public.camp_buchungen')).length, 0);
  assert.equal((await zeilen(kader, 'select * from public.camp_buchungen')).length, 1);
  await assert.rejects(als(anja, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', false, 'karte')",
    [JSON.stringify([{ vorname: 'Finn' }])]), /Jahrgang/);
  await assert.rejects(als(anja, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', false, 'karte')",
    [JSON.stringify([{ vorname: 'Finn', jahrgang: 2005 }])]), /Jahrgang/);
  await assert.rejects(als(anja, "insert into public.camp_buchungen (camp_id, eltern_id, nr, kinder, notfall, zahlung, summe_cent) values ('herbst-koeln', auth.uid(), 'X', '[{}]', '0221 123', 'karte', 1)"), /permission denied/);
  await db.query("update public.camps set plaetze = 3 where id = 'herbst-koeln'");
  assert.equal(await wert(anja, "select public.camp_plaetze_frei('herbst-koeln')"), 1);
  await assert.rejects(als(anja, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', false, 'karte')",
    [JSON.stringify([{ vorname: 'Finn', jahrgang: 2014 }, { vorname: 'Ida', jahrgang: 2016 }])]), /Plätze/);
  await als(anja, "select * from public.camp_buchen('herbst-koeln', $1, '0221 1234567', true, 'karte')", [JSON.stringify([{ vorname: 'Finn', jahrgang: 2014 }])]);
  assert.equal(await wert(anja, "select public.camp_plaetze_frei('herbst-koeln')"), 0);
});

test('Konto löschen nimmt die Gemeinschaft mit', async () => {
  const weg = await nutzer({ vorname: 'Weg', geburtsjahr: jahr - 30 });
  await als(weg, 'insert into public.folgen (seite) values ($1)', [hartwig]);
  await als(weg, "insert into public.uploads (von, sicht, titel) values (auth.uid(), 'profil', 'Weg')");
  await als(weg, "insert into public.meldungen (ziel_art, ziel_id, grund) values ('profil', $1, 'Test')", [hartwig]);
  await als(weg, 'select public.konto_loeschen()');
  for (const [tabelle, spalte] of [['folgen', 'fan'], ['uploads', 'von'], ['meldungen', 'von'], ['profiles', 'id']]) {
    assert.equal((await db.query(`select count(*)::int n from public.${tabelle} where ${spalte} = $1`, [weg])).rows[0].n, 0, tabelle);
  }
});
