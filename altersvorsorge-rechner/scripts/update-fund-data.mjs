// Aktualisiert altersvorsorge-rechner/fund-data.json mit den Kennzahlen des
// Debeka Global Shares.
//
// Zwei Wege (best effort):
//   1) Manuell: Werte per Umgebungsvariablen INPUT_* übergeben (aus dem
//      workflow_dispatch-Formular). Zuverlässig, keine externe Quelle nötig.
//   2) Automatisch: das öffentliche Debeka-Factsheet (PDF) laden und die
//      Prozentwerte herauslesen. Kann fehlschlagen, wenn Debeka den Abruf
//      blockt oder das PDF-Layout sich ändert – dann bleibt die Datei
//      unverändert (es werden nie unplausible Werte geschrieben).
//
// Ausführung: node altersvorsorge-rechner/scripts/update-fund-data.mjs

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, "../fund-data.json");

const FACTSHEET_URL =
  "https://www.debeka.de/content/dam/de/webauftritt/sonstige/landingpages/fonds/produktinformation-debeka-global-shares.pdf";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const num = (s) => {
  if (s == null || s === "") return null;
  const v = parseFloat(String(s).trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
};
const sane = (v, lo, hi) => v != null && v >= lo && v <= hi;

/* ---- 1) Werte aus manuellen Eingaben (workflow_dispatch) ---------------- */
function fromInputs() {
  const e = process.env;
  const out = {};
  const map = {
    paSince: e.INPUT_PASINCE, totalSince: e.INPUT_TOTALSINCE,
    runningCost: e.INPUT_RUNNINGCOST, y1: e.INPUT_Y1, y3: e.INPUT_Y3, y5: e.INPUT_Y5,
  };
  let any = false;
  for (const [k, v] of Object.entries(map)) {
    const n = num(v);
    if (n != null) { out[k] = n; any = true; }
  }
  return any ? out : null;
}

/* ---- 2) Werte aus dem Factsheet-PDF ------------------------------------- */
async function fromFactsheet() {
  const res = await fetch(FACTSHEET_URL, {
    headers: { "User-Agent": UA, Accept: "application/pdf,*/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  let text = "";
  try {
    const pdf = require("pdf-parse");
    text = (await pdf(buf)).text || "";
  } catch (e) {
    throw new Error("PDF nicht lesbar (pdf-parse fehlt/Fehler: " + e.message + ")");
  }
  const t = text.replace(/\s+/g, " ");
  const grab = (re) => { const m = t.match(re); return m ? num(m[1]) : null; };
  return {
    paSince: grab(/p\.?\s?a\.?\s*(?:seit\s*Auflage)?[^0-9%-]{0,20}(-?\d{1,3}(?:,\d{1,2})?)\s*%/i),
    totalSince: grab(/seit\s*Auflage[^0-9%-]{0,20}(-?\d{1,4}(?:,\d{1,2})?)\s*%/i),
    y1: grab(/\b1\s*Jahr[^0-9%-]{0,20}(-?\d{1,3}(?:,\d{1,2})?)\s*%/i),
    y3: grab(/\b3\s*Jahre?[^0-9%-]{0,20}(-?\d{1,3}(?:,\d{1,2})?)\s*%/i),
    y5: grab(/\b5\s*Jahre?[^0-9%-]{0,20}(-?\d{1,3}(?:,\d{1,2})?)\s*%/i),
  };
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

async function main() {
  const cur = JSON.parse(await readFile(JSON_PATH, "utf8"));
  let src = fromInputs();
  if (src) {
    console.log("Quelle: manuelle Eingaben (workflow_dispatch).");
  } else {
    try {
      src = await fromFactsheet();
      console.log("Quelle: Debeka-Factsheet.");
    } catch (e) {
      console.log("Factsheet nicht abrufbar/parsebar (" + e.message + ") – fund-data.json unverändert.");
      return;
    }
  }

  const next = JSON.parse(JSON.stringify(cur));
  const setPerf = (label, v) => {
    if (v == null) return;
    const row = next.perf.find((p) => p.label === label);
    if (row) row.v = v;
  };

  if (sane(src.paSince, -20, 20)) next.paSince = src.paSince;
  if (sane(src.totalSince, -100, 2000)) { next.totalSince = src.totalSince; setPerf("seit Auflage", src.totalSince); }
  if (sane(src.runningCost, 0, 3)) next.runningCost = src.runningCost;
  if (sane(src.y1, -80, 200)) setPerf("1 Jahr", src.y1);
  if (sane(src.y3, -80, 400)) setPerf("3 Jahre", src.y3);
  if (sane(src.y5, -80, 600)) setPerf("5 Jahre", src.y5);

  if (JSON.stringify(next.perf) === JSON.stringify(cur.perf) &&
      next.paSince === cur.paSince && next.totalSince === cur.totalSince &&
      next.runningCost === cur.runningCost) {
    console.log("Keine Änderung der Kennzahlen – fund-data.json bleibt unverändert.");
    return;
  }

  next.updatedAt = today();
  await writeFile(JSON_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log("fund-data.json aktualisiert:", JSON.stringify({
    paSince: next.paSince, totalSince: next.totalSince, runningCost: next.runningCost,
    perf: next.perf, updatedAt: next.updatedAt,
  }));
}

main().catch((e) => { console.error("Fehler:", e.message); process.exit(0); });
