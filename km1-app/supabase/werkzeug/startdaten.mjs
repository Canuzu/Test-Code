// Schreibt aus den Videos des Prototyps (app/index.html) zwei Dateien:
//   supabase/seed.sql               die Startdaten für die Datenbank
//   mobile/src/daten/katalog.json   derselbe Katalog für die App, solange
//                                   sie ohne Server läuft (Vorschau-Modus)
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
console.log('seed.sql:', VIDEOS.length, 'Videos,', zeilen.length, 'Schritte');
