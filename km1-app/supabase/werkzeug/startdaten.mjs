// Schreibt aus den Videos, Plänen und dem Camp des Prototyps
// (app/index.html) drei Dateien:
//   supabase/seed.sql               die Startdaten für die Datenbank
//   mobile/src/daten/katalog.json   derselbe Katalog für die App, solange
//                                   sie ohne Server läuft (Vorschau-Modus)
//   mobile/src/daten/plaene.json    die Trainingspläne für die App
// So bleibt der Prototyp die eine Quelle, bis Kader die echten Videos
// hochlädt:  node supabase/werkzeug/startdaten.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(hier, '../../app/index.html'), 'utf8');

function block(anfang, ende) {
  const a = html.indexOf(anfang), e = html.indexOf(ende, a);
  if (a < 0 || e < 0) throw new Error('Nicht gefunden: ' + anfang);
  return html.slice(a + anfang.length - 1, e + 1);
}
const VIDEOS = new Function('return ' + block('var VIDEOS = [', '];\n\nvar PFAD'))();
const PFAD = new Function('return ' + block('var PFAD = {', '};\n'))();
const PLAENE = new Function('return ' + block('var PLAENE = [', '];\n'))();
const CAMP = new Function('return ' + block('var CAMP = {', '};\n'))();

const woche = {};
for (const lv of Object.keys(PFAD)) for (const u of PFAD[lv]) woche[u.id] = u.w;

const sek = (d) => { const [m, s] = String(d).split(':'); return (+m) * 60 + (+s || 0); };
// Dieselbe Verteilung wie kapitelSek() im Prototyp, bis Kader die echte
// Sekunde einträgt.
const kapitel = (d, i, n) => { const los = Math.round(d * 0.06); return Math.round(los + (d - los) * (i / n)); };
const q = (s) => s == null ? 'null' : "'" + String(s).replace(/'/g, "''") + "'";

let sql = `-- Startdaten: die ${VIDEOS.length} Videos aus dem Prototyp.
-- Erzeugt von supabase/werkzeug/startdaten.mjs, nicht von Hand ändern.
--
-- Solange eine Zeile keinen „pfad" hat, spielt die App ein Testvideo.
-- Sobald Kader die Datei hochlädt, trägt er hier den Pfad ein.

insert into public.videos
  (slug, titel, beschreibung, fehler, kategorie, ebene, woche, dauer_sek,
   zugang, gast, neu, bild, status, reihenfolge)
values
`;
sql += VIDEOS.map((v, i) => '  (' + [
  q(v.id), q(v.t), q(v.be), q(v.fe), q(v.k), v.lv, woche[v.id] ?? 'null', sek(v.d),
  q(v.zg), q(v.gast || null), v.neu ? 'true' : 'false', q(v.img || null), "'live'", i + 1
].join(', ') + ')').join(',\n');
sql += `
on conflict (slug) do update set
  titel = excluded.titel, beschreibung = excluded.beschreibung, fehler = excluded.fehler,
  kategorie = excluded.kategorie, ebene = excluded.ebene, woche = excluded.woche,
  dauer_sek = excluded.dauer_sek, zugang = excluded.zugang, gast = excluded.gast,
  neu = excluded.neu, bild = excluded.bild, reihenfolge = excluded.reihenfolge;

delete from public.video_schritte
 where video_id in (select id from public.videos where slug in (${VIDEOS.map(v => q(v.id)).join(', ')}));

insert into public.video_schritte (video_id, nr, text, sekunde)
select v.id, s.nr, s.text, s.sekunde
from (values
`;
const zeilen = [];
for (const v of VIDEOS) {
  const d = sek(v.d), n = v.st.length;
  v.st.forEach((t, i) => zeilen.push(`  (${q(v.id)}, ${i + 1}, ${q(t)}, ${kapitel(d, i, n)})`));
}
sql += zeilen.join(',\n') + `
) as s(slug, nr, text, sekunde)
join public.videos v on v.slug = s.slug;
`;

// Die Trainingspläne: sechs Wochen, drei Einheiten, jede mit Aufgabe.
sql += `
insert into public.plaene (id, titel, ebene, fuer, satz, minuten, reihenfolge)
values
${PLAENE.map((p, i) => `  (${[q(p.id), q(p.t), p.lv, q(p.fuer), q(p.satz), p.min, i + 1].join(', ')})`).join(',\n')}
on conflict (id) do update set
  titel = excluded.titel, ebene = excluded.ebene, fuer = excluded.fuer,
  satz = excluded.satz, minuten = excluded.minuten, reihenfolge = excluded.reihenfolge;

delete from public.plan_einheiten where plan_id in (${PLAENE.map(p => q(p.id)).join(', ')});

insert into public.plan_einheiten (plan_id, woche, nr, video_id, aufgabe)
select e.plan_id, e.woche, e.nr, v.id, e.aufgabe
from (values
`;
const einheiten = [];
for (const p of PLAENE) p.wochen.forEach((w, wi) => w.forEach((e, ei) =>
  einheiten.push(`  (${q(p.id)}, ${wi + 1}, ${ei + 1}, ${q(e.v)}, ${q(e.a)})`)));
sql += einheiten.join(',\n') + `
) as e(plan_id, woche, nr, slug, aufgabe)
join public.videos v on v.slug = e.slug;
`;

// Das Camp. Die Jahrgänge rechnen vom Jahr des Camps aus, nicht von heute,
// damit die Datei jedes Jahr gleich bleibt.
const campJahr = +CAMP.von.slice(0, 4);
sql += `
insert into public.camps (id, titel, von, bis, preis_cent, geschwister_rabatt_cent, plaetze, jahrgang_von, jahrgang_bis)
values (${[q(CAMP.id), q(CAMP.t), q(CAMP.von), q(CAMP.bis), CAMP.preis * 100, CAMP.geschwister * 100, CAMP.plaetze,
           campJahr - 15, campJahr - 8].join(', ')})
on conflict (id) do update set
  titel = excluded.titel, von = excluded.von, bis = excluded.bis, preis_cent = excluded.preis_cent,
  geschwister_rabatt_cent = excluded.geschwister_rabatt_cent, plaetze = excluded.plaetze,
  jahrgang_von = excluded.jahrgang_von, jahrgang_bis = excluded.jahrgang_bis;
`;
fs.writeFileSync(path.join(hier, '../seed.sql'), sql);

const katalog = VIDEOS.map((v, i) => {
  const d = sek(v.d), n = v.st.length;
  return {
    slug: v.id, titel: v.t, beschreibung: v.be, fehler: v.fe, kategorie: v.k,
    ebene: v.lv, woche: woche[v.id] ?? null, dauer_sek: d, zugang: v.zg,
    gast: v.gast || null, neu: !!v.neu, bild: v.img || null, pfad: null, reihenfolge: i + 1,
    schritte: v.st.map((t, j) => ({ nr: j + 1, text: t, sekunde: kapitel(d, j, n) })),
  };
});
const ziel = path.join(hier, '../../mobile/src/daten/katalog.json');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, JSON.stringify(katalog, null, 1) + '\n');
// Die Pläne für die App, solange sie ohne Server läuft.
const plaene = PLAENE.map((p, i) => ({
  id: p.id, titel: p.t, ebene: p.lv, fuer: p.fuer, satz: p.satz, minuten: p.min, reihenfolge: i + 1,
  wochen: p.wochen.map(w => w.map(e => ({ slug: e.v, aufgabe: e.a }))),
}));
fs.writeFileSync(path.join(hier, '../../mobile/src/daten/plaene.json'), JSON.stringify(plaene, null, 1) + '\n');
console.log('seed.sql:', VIDEOS.length, 'Videos,', zeilen.length, 'Schritte,', PLAENE.length, 'Pläne mit', einheiten.length, 'Einheiten, 1 Camp');
