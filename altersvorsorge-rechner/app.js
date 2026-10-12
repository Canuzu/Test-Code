/* =========================================================================
   Debeka Global Shares – Altersvorsorge-Rechner  ·  Vanilla JS, keine Abh.
   -------------------------------------------------------------------------
   Rechnet mit dem Debeka Global Shares in der Debeka Fondspolice (Tarif
   CA6I, Kombination „Chance Invest“).

   Rechenmodell (monatlich):
     · Fondsentwicklung = erwartete Rendite − laufende Fondskosten
     · Abschlusskosten (% der Beitragssumme, 5 Jahre gezillmert) und
       Verwaltungskosten (% je Beitrag) laut § 17, kalibriert auf Debeka
     · Aufschubzeit in ganzen Jahren: Rentenalter − Eintrittsalter
     · Kapitalabfindung: Hälfte des Gewinns × persönlicher Steuersatz
     · Lebenslange Rente = Fondsguthaben / 10.000 × Rentenfaktor
   ========================================================================= */

/* --------------------- Fonds-Stammdaten (öffentlich) ------------------- */
/* Quelle: Debeka-Produktinformation/Factsheet „Debeka Global Shares“.     */
const FUND = {
  name: "Debeka Global Shares",
  sub: "Globaler Aktien-Dachfonds · ESG · Debeka Fondspolice",
  paSince: 10.00,       // % p.a. seit Auflegung 22.04.2016
  totalSince: 165.16,   // % Gesamtentwicklung seit Auflegung
  runningCost: 0.30,    // % p.a. laufende Fondskosten (0,025 %/Monat)
  since: 2016,
  sinceDate: "22.04.2016",
  updatedAt: "17.07.2026",
  // Öffentliche Wertentwicklung laut Debeka (Anteilswert, netto).
  // Diese Werte sind der Fallback; zur Laufzeit werden sie – wenn erreichbar –
  // aus fund-data.json überschrieben (siehe loadFundData()).
  perf: [
    { label: "1 Jahr", v: 24.34 },
    { label: "3 Jahre", v: 57.30 },
    { label: "5 Jahre", v: 60.74 },
    { label: "seit Auflage", v: 165.16 },
  ],
};

/* Renditeszenarien, mit denen gerechnet werden kann. */
const RENDITE_PRESETS = [
  { key: "hist", label: "Ø seit 2016 · 10 %", v: 10 },
  { key: "solide", label: "Solide 7 %", v: 7 },
  { key: "vorsichtig", label: "Vorsichtig 5 %", v: 5 },
];

/* ---------------------- Produkt-/Tarif-Hintergrund --------------------- */
/* Grundlage: Allgemeine Bedingungen der Debeka Rentenversicherung mit auf-
   geschobener Rentenzahlung und Fondskomponenten, Tarif CA6I (BLV 86,
   Stand 01.07.2026). Wird für die Modellierung/Tooltips genutzt.
   Kostenarten (§ 17, § 48):
     · Abschluss- und Vertriebskosten (im Tarif enthalten, Verrechnung § 4 DeckRV)
     · Verwaltungskosten (laufend, im Tarif enthalten)
     · Fondsverwaltungskosten (§ 48: fester %-Satz p. M. des Fondsguthabens)
   Die konkreten Werte stehen in den persönlichen Vertragsinformationen
   (§ 48 Abs. 2); sie werden hier über "Effektivkosten der Police" abgebildet.
   Auszahlung: lebenslange Rente über einen garantierten Rentenfaktor
   (§ 34/§ 47). Todesfall vor Rentenbeginn: Fondsguthaben an Hinterbliebene
   (§ 35). Kapitalwahlrecht bei Rentenbeginn (§ 45). */
const POLICY = {
  tarif: "CA6I",
  bedingungen: "BLV 86 (01.07.2026)",
  // Kostensätze kalibriert auf zwei Debeka-Musterrechnungen (50 €/Monat, 5 %):
  //   34 Jahre → Kapitalabfindung 43.758,23 €  |  35 Jahre → 46.316,12 €.
  // Beide werden damit auf < 1 € genau getroffen. Exakte Werte stehen im
  // persönlichen Angebot; alle Felder sind frei anpassbar.
  abschlussPct: 2.84,   // Abschluss-/Vertriebskosten in % der Beitragssumme (§ 17), 5-J.-Zillmer
  verwaltungPct: 5.88,  // Verwaltungskosten in % je Beitrag (§ 17)
  rentenfaktor: 29.09,  // € mtl. je 10.000 € Fondsguthaben (§ 34/§ 47) – variiert je Vertrag
};

const SOLI = 1.055;
const ABGELT = 0.25;
const TAX_RATE = ABGELT * SOLI; // = 0,26375
const TEILFREISTELLUNG = { aktien: 0.30, misch: 0.15, none: 0.0 };

/* ----------------------------- Datum --------------------------------- */
function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function parseDate(s) { const d = new Date(s + "T00:00:00"); return isNaN(d) ? null : d; }
function addYears(d, y) { return new Date(d.getFullYear() + y, d.getMonth(), d.getDate()); }
function monthsBetween(a, b) {
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return m;
}
function formatYM(months) {
  if (!months || months <= 0) return "0 J.";
  const y = Math.floor(months / 12), mo = months % 12;
  return mo ? `${y} J. ${mo} Mon.` : `${y} J.`;
}

/* ---------------------------- State ---------------------------------- */
const state = {
  startkapital: 5000,
  sparrate: 200,
  dynamik: 2,
  geburtsdatum: "1992-01-01",
  vertragsbeginn: todayISO(),
  rentenalter: 67,
  rendite: 10,                // Voreinstellung ≈ Ø-Rendite p.a. seit Auflegung
  ter: FUND.runningCost,      // laufende Fondskosten (0,30 %)
  abschluss: POLICY.abschlussPct,   // Abschlusskosten in % der Beitragssumme
  verwaltung: POLICY.verwaltungPct, // Verwaltungskosten in % je Beitrag
  inflation: 2,
  beitragsdauer: 33,          // Jahre, in denen Beiträge gezahlt werden
  garantiezeit: 15,           // Rentengarantiezeit in Jahren (informativ)
  steuersatz: 30,             // persönlicher Steuersatz (Halbeinkünfte b. Kapitalabfindung)
  entnahmeJahre: 25,
  renditeRente: 3,
  rentensteigerung: 0,        // jährliche Rentensteigerung (steigende Rente)
  rentenfaktor: POLICY.rentenfaktor, // € mtl. je 10.000 € (lebenslange Rente)
  realView: false,
};

/* --------------------------- Formatting ------------------------------ */
const eur0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const num2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dtf = new Intl.DateTimeFormat("de-DE", { month: "2-digit", year: "numeric" });
const pct1 = (v) => num1.format(v) + " %";
const money = (v) => eur0.format(Math.round(v));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------- Kernberechnung ---------------------------- */
function compute(s) {
  // Alter & Zeiträume exakt aus Geburtsdatum und Vertragsbeginn.
  const geb = parseDate(s.geburtsdatum);
  const start = parseDate(s.vertragsbeginn);
  const MS_YEAR = 365.25 * 86400000;
  const ageAtStart = geb && start ? (start - geb) / MS_YEAR : 0;
  // Debeka rechnet die Aufschubzeit in ganzen Jahren: Rentenalter minus dem
  // bei Vertragsbeginn zurueckgelegten (abgerundeten) Alter. Beispiel:
  // Rentenalter 67, Eintrittsalter 32 -> 35 Jahre Aufschubzeit.
  const eintrittsalter = geb && start ? Math.floor(ageAtStart) : 0;
  const aufschubYears = Math.max(0, s.rentenalter - eintrittsalter);
  const totalMonths = start ? aufschubYears * 12 : 0;
  // Rentenbeginn = Vertragsbeginn + Aufschubzeit (ganze Jahre, wie Debeka).
  const rentenDate = start ? addYears(start, aufschubYears) : null;
  const years = totalMonths / 12; // Aufschubzeit in Jahren

  const fundNet = (s.rendite - s.ter) / 100;      // Fondsentwicklung minus Fondskosten
  const rMonth = Math.pow(1 + fundNet, 1 / 12) - 1;

  const beitragsMonths = Math.min(Math.round(s.beitragsdauer * 12), totalMonths);
  const zillmerMonths = Math.min(60, beitragsMonths) || 1;

  // Beitragssumme (inkl. Dynamik) als Basis der Abschlusskosten (§ 17).
  let bs = 0, pm = s.sparrate;
  for (let m = 1; m <= beitragsMonths; m++) { bs += pm; if (m % 12 === 0) pm *= 1 + s.dynamik / 100; }
  const abschlussPerMonth = ((s.abschluss / 100) * bs) / zillmerMonths;

  let balance = s.startkapital;
  let contributed = s.startkapital;
  let kosten = 0;
  let monthly = s.sparrate;
  const premiums = [];
  const series = [{ age: ageAtStart, year: 0, contributed, balance, real: balance }];

  for (let m = 1; m <= totalMonths; m++) {
    const paying = m <= beitragsMonths;
    let spar = 0;
    if (paying) {
      const verw = (s.verwaltung / 100) * monthly;              // Verwaltungskosten (§ 17)
      const absch = m <= zillmerMonths ? abschlussPerMonth : 0; // Abschlusskosten (§ 17, Zillmer)
      spar = Math.max(0, monthly - verw - absch);               // investierter Sparanteil
      kosten += monthly - spar;
      contributed += monthly;
      premiums.push({ m, p: monthly });
    }
    balance = balance * (1 + rMonth) + spar;
    if (paying && m % 12 === 0) monthly *= 1 + s.dynamik / 100; // Dynamik jährlich
    if (m % 12 === 0 || m === totalMonths) {
      const ye = m / 12;
      const real = balance / Math.pow(1 + s.inflation / 100, ye);
      series.push({ age: ageAtStart + ye, year: ye, contributed, balance, real });
    }
  }

  const brutto = balance;                       // Kapitalabfindung inkl. Fondsguthaben (brutto)
  const gewinn = Math.max(0, brutto - contributed);
  const effAnnual = irr(premiums, s.startkapital, totalMonths, brutto) * 100; // Rendite nach allen Kosten

  // Steuer bei Kapitalauszahlung: ab Alter 62 und ≥ 12 Jahren Laufzeit ist nur
  // die Hälfte des Gewinns mit dem persönlichen Steuersatz zu versteuern (§ 20 EStG).
  const steuer = gewinn * 0.5 * (s.steuersatz / 100);
  const netto = brutto - steuer;

  // Lebenslange Rente aus dem Fondsguthaben über den Rentenfaktor (§ 34/§ 47).
  const lebensrente = (brutto / 10000) * s.rentenfaktor;

  // Alternative: Kapitalverzehr über die Auszahldauer.
  const nMonths = Math.max(1, Math.round(s.entnahmeJahre * 12));
  const rR = Math.pow(1 + s.renditeRente / 100, 1 / 12) - 1;
  const monatsrente = Math.abs(rR) < 1e-9
    ? brutto / nMonths
    : (brutto * rR) / (1 - Math.pow(1 + rR, -nMonths));

  // Steigende Rente (Kapitalverzehr): Startbetrag einer jährlich steigenden Rente.
  let steigStart = 0;
  const g = s.rentensteigerung / 100;
  if (g > 0) {
    const gm = Math.pow(1 + g, 1 / 12) - 1;
    const q = Math.pow((1 + gm) / (1 + rR), nMonths);
    steigStart = Math.abs(rR - gm) < 1e-9 ? brutto / nMonths : (brutto * (rR - gm)) / (1 - q);
  }

  return {
    years, ageAtStart, eintrittsalter, totalMonths, beitragsMonths, rentenDate,
    effAnnual, series, brutto, contributed, gewinn, kosten, steuer, netto,
    monatsrente, steigStart, lebensrente, nMonths,
  };
}

// Geldgewichtete Jahresrendite nach allen Kosten (Bisektion).
function irr(premiums, startkapital, totalMonths, target) {
  if (!(target > 0) || totalMonths <= 0) return 0;
  const fv = (gy) => {
    const gm = Math.pow(1 + gy, 1 / 12) - 1;
    let v = startkapital * Math.pow(1 + gm, totalMonths);
    for (const { m, p } of premiums) v += p * Math.pow(1 + gm, totalMonths - m);
    return v;
  };
  let lo = -0.9, hi = 1.0;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (fv(mid) > target) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}

/* ============================ UI ===================================== */
const $ = (id) => document.getElementById(id);
const ICON = {
  sun: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5V4M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  chev: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
  up: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
};
const SPAR_CHIPS = [50, 100, 200, 300, 500];
const PRESET_SUB = { hist: "Ø seit " + FUND.since, solide: "Solide", vorsichtig: "Vorsichtig" };

function shell() {
  const presets = RENDITE_PRESETS.map((p) =>
    `<button type="button" data-v="${p.v}" aria-pressed="false"><b>${p.v} %</b><small>${PRESET_SUB[p.key] || p.label}</small></button>`).join("");
  const chips = SPAR_CHIPS.map((v) =>
    `<button type="button" class="chip" data-chip="${v}" aria-pressed="false">${v} €</button>`).join("");

  return `
  <header class="band" id="band">
    <canvas class="band-canvas" id="bandCanvas" aria-hidden="true"></canvas>
    <div class="band-inner">
      <nav class="topbar">
        <span class="wordmark" role="img" aria-label="Debeka">Debeka</span>
        <span class="topbar-sep" aria-hidden="true"></span>
        <span class="topbar-title">Vorsorge-Rechner</span>
        <button class="theme-btn" id="themeBtn" type="button"><span id="themeIcon"></span><span id="themeTxt">Dunkel</span></button>
      </nav>
      <div class="band-grid">
        <div class="band-copy">
          <p class="eyebrow rise" style="--d:.05s">Fondspolice · Tarif ${POLICY.tarif} · Chance Invest</p>
          <h1 class="band-title rise" style="--d:.12s">Debeka <span>Global Shares</span></h1>
          <p class="band-lead rise" style="--d:.2s">Rechne live durch, was aus deinem Sparplan bis zur Rente wird – mit den aktuellen Fondsdaten und den Kosten des Tarifs, abgestimmt auf die Debeka-Musterrechnung.</p>
          <dl class="band-facts rise" style="--d:.28s">
            <div><dt>Rendite p. a. seit ${FUND.since}</dt><dd id="fPa">–</dd></div>
            <div><dt>Seit Auflegung ${FUND.sinceDate}</dt><dd id="fTotal">–</dd></div>
            <div><dt>Laufende Fondskosten</dt><dd id="fTer">–</dd></div>
          </dl>
        </div>
        <aside class="perf-card rise" style="--d:.36s" aria-label="Historische Wertentwicklung">
          <div class="perf-head"><span>Wertentwicklung</span><span class="perf-stand">Stand ${FUND.updatedAt}</span></div>
          ${perfBars()}
          <p class="perf-note">Anteilswert netto laut Debeka. Vergangene Wertentwicklung ist keine Garantie für die Zukunft.</p>
        </aside>
      </div>
    </div>
  </header>

  <main class="cockpit">
    <section class="card inputs rise" style="--d:.3s" aria-label="Eingaben">
      <div class="inputs-head">
        <div><h2>Dein Sparplan</h2><p>Ändere einen Wert – alles rechnet sofort mit.</p></div>
        <span class="live"><i></i>Live</span>
      </div>

      ${acc("plan", "Beitrag", true, `
        <div class="field">
          ${label("Monatlicher Beitrag", "Dein monatlicher Beitrag in die Fondspolice (Inkassobeitrag). Er fließt nach Kosten in den Debeka Global Shares.", "in_sparrate")}
          <div class="inp xl"><input id="in_sparrate" inputmode="decimal" autocomplete="off" data-key="sparrate" data-kind="money" /><span class="unit">€ / Monat</span></div>
          <div class="chips" role="group" aria-label="Schnellauswahl Beitrag">${chips}</div>
        </div>
        ${field("Startkapital", "startkapital", "€", "Optionaler Einmalbetrag, mit dem du heute startest.", "money")}
        ${slider("Jährliche Dynamik", "dynamik", 0, 10, 0.5, "%", "Um diesen Prozentsatz steigt dein Beitrag jedes Jahr – z. B. als Ausgleich für Gehalts- und Preissteigerungen.")}
      `)}

      ${acc("zeit", "Zeitraum", true, `
        ${dateField("Geburtsdatum", "geburtsdatum", "Daraus ergibt sich dein Eintrittsalter bei Vertragsbeginn (zurückgelegte volle Jahre).")}
        <div class="split">
          ${dateField("Vertragsbeginn", "vertragsbeginn", "Ab wann der Vertrag läuft – meist der Erste des nächsten Monats.")}
          ${field("Rente ab", "rentenalter", "Jahren", "Alter, mit dem die Rente beginnt. Die Aufschubzeit rechnet Debeka in ganzen Jahren: Rentenalter minus Eintrittsalter.", "int")}
        </div>
        ${field("Beitragszahlungsdauer", "beitragsdauer", "Jahre", "So lange zahlst du Beiträge. Danach bleibt das Guthaben bis zum Rentenbeginn investiert. Höchstens die Aufschubzeit.", "int")}
      `)}

      ${acc("rendite", "Rendite", true, `
        <div class="field">
          <div class="f-label"><span>Renditeannahme</span>${info("Womit möchtest du rechnen? 10 % entspricht der Wertentwicklung des Debeka Global Shares seit Auflegung 2016. Niedrigere Werte sind vorsichtiger – die Zukunft ist nicht garantiert.")}</div>
          <div class="seg seg-presets" id="renditePreset" role="group" aria-label="Renditeannahme"><span class="seg-ind" aria-hidden="true"></span>${presets}</div>
        </div>
        ${slider("Erwartete Rendite p. a.", "rendite", 1, 12, 0.1, "%", "Angenommene durchschnittliche Wertentwicklung des Fonds pro Jahr, vor Fondskosten.")}
        ${slider("Inflation p. a.", "inflation", 0, 5, 0.1, "%", "Erwartete Geldentwertung. Sie bestimmt die Kaufkraft-Ansicht im Diagramm.")}
      `)}

      ${acc("kosten", "Kosten & Tarif", false, `
        <div class="field">
          <div class="f-label"><span>Garantie-/Fondskombination</span>${info("„Chance Invest“ ist die chancenorientierte Kombination der Debeka Fondspolice: volle Anlage im Debeka Global Shares, ohne Beitragsgarantie.")}</div>
          <div class="ro-field"><span>Chance Invest</span><span class="tag">Fonds pur</span></div>
        </div>
        ${selectField("Rentengarantiezeit", "garantiezeit", "Stirbst du nach Rentenbeginn, läuft die Rente bis zum Ende dieser Zeit an deine Hinterbliebenen weiter.", [[0, "keine"], [5, "5 Jahre"], [10, "10 Jahre"], [15, "15 Jahre"], [20, "20 Jahre"]])}
        ${slider("Laufende Fondskosten", "ter", 0, 2, 0.05, "%", "Kosten des Debeka Global Shares, rund 0,30 % pro Jahr. Sie mindern die Fondsentwicklung direkt.")}
        ${slider("Abschlusskosten", "abschluss", 0, 4, 0.1, "%", "Abschluss- und Vertriebskosten (§ 17) in % der Beitragssumme, verteilt auf die ersten 5 Jahre. Voreingestellt auf die Debeka-Musterrechnung.")}
        ${slider("Verwaltungskosten", "verwaltung", 0, 15, 0.1, "%", "Laufende Verwaltungskosten (§ 17) als Anteil jedes Beitrags. Voreingestellt auf die Debeka-Musterrechnung.")}
      `)}

      ${acc("steuer", "Steuern", false, `
        ${slider("Persönlicher Steuersatz", "steuersatz", 0, 45, 1, "%", "Dein Einkommensteuersatz im Alter. Bei Kapitalauszahlung ab 62 und mindestens 12 Jahren Laufzeit wird nur die Hälfte des Gewinns damit besteuert (§ 20 EStG).")}
        <div class="taxbox">
          <div class="taxbox-row"><span>Kapitalabfindung (ab 62, ≥ 12 J.)</span><b>½ Gewinn × Satz</b></div>
          <div class="taxbox-row"><span>Lebenslange Rente</span><b>nur Ertragsanteil</b></div>
          <p class="hint">So entsteht das Netto-Endvermögen oben. Die lebenslange Rente wird nur mit dem niedrigen Ertragsanteil besteuert.</p>
        </div>
      `)}

      ${acc("rente", "Rentenphase", false, `
        ${field("Rentenfaktor", "rentenfaktor", "€ je 10.000 €", "Pro 10.000 € Fondsguthaben zahlt der Vertrag diese Monatsrente lebenslang (§ 34/§ 47). Den garantierten Wert findest du in deinem Angebot.", "money")}
        ${selectField("Steigende Rente", "rentensteigerung", "Optional: Die Rente startet niedriger und steigt dann jedes Jahr um den gewählten Satz.", [[0, "keine (konstante Rente)"], [1, "+1 % pro Jahr"], [2, "+2 % pro Jahr"], [3, "+3 % pro Jahr"]])}
        ${slider("Auszahldauer (Kapitalverzehr)", "entnahmeJahre", 5, 40, 1, "J.", "Für die Alternative Kapitalverzehr: über wie viele Jahre das Kapital ausgezahlt würde.")}
        ${slider("Rendite in der Rente", "renditeRente", 0, 7, 0.1, "%", "Verzinsung des Restkapitals während der Auszahlung.")}
      `)}
    </section>

    <section class="result rise" id="resultCard" style="--d:.38s" aria-label="Ergebnis">
      <div class="result-glow" aria-hidden="true"></div>
      <div class="result-top">
        <span class="result-label">Netto-Endvermögen mit <b id="rAge">67</b></span>
        <span class="result-chip" id="rDate">–</span>
      </div>
      <div class="result-main">
        <div>
          <div class="result-amount" id="rNetto" aria-live="polite">–</div>
          <div class="result-gain"><span class="up" aria-hidden="true">${ICON.up}</span><span><span id="rGain">–</span> Gewinn</span></div>
          <p class="result-mult">Aus jedem eingezahlten Euro werden <b id="rMult">–</b></p>
        </div>
        <div class="ring-wrap">
          <svg class="ring" viewBox="0 0 140 140" aria-hidden="true">
            <circle class="ring-track" cx="70" cy="70" r="58"/>
            <circle class="ring-con" id="ringCon" cx="70" cy="70" r="58"/>
            <circle class="ring-gain" id="ringGain" cx="70" cy="70" r="58"/>
          </svg>
          <div class="ring-center"><b id="ringPct">–</b><span>Gewinnanteil</span></div>
          <div class="ring-legend"><span><i class="sw con-dark"></i>Eigenleistung</span><span><i class="sw gain-dark"></i>Gewinn</span></div>
        </div>
      </div>
      <dl class="result-stats">
        <div><dt>Eingezahlt gesamt</dt><dd id="rContrib">–</dd></div>
        <div><dt>Brutto-Endvermögen</dt><dd class="gain" id="rBrutto">–</dd></div>
        <div><dt>Steuern bei Auszahlung</dt><dd id="rTax">–</dd></div>
        <div><dt>Rendite nach Kosten</dt><dd class="gain" id="rEff">–</dd></div>
      </dl>
      <div class="result-rente">
        <span>Lebenslange Rente ab <b id="rAge2">67</b></span>
        <strong><span id="rRente">–</span><small> / Monat</small></strong>
      </div>
    </section>

    <section class="card pad chart-card rise" style="--d:.46s" aria-label="Vermögensentwicklung">
      <div class="card-head">
        <div><h3>Vermögensentwicklung bis zur Rente</h3><p class="card-sub" id="chartSub">Jahr für Jahr – fahre über die Kurve.</p></div>
        <div class="seg" id="viewSeg" role="group" aria-label="Ansicht"><span class="seg-ind" aria-hidden="true"></span><button type="button" data-view="nom" aria-pressed="true">Nominal</button><button type="button" data-view="real" aria-pressed="false">Kaufkraft</button></div>
      </div>
      <div class="legend"><span><i class="sw gain"></i><span id="lgBal">Fondsguthaben</span></span><span><i class="sw con"></i>Eingezahlt</span></div>
      <div class="chart-wrap" id="chartWrap">
        <svg class="chart" id="chart" role="img" aria-label="Diagramm der Vermögensentwicklung"></svg>
        <div class="chart-tip" id="chartTip"></div>
      </div>
    </section>

    <section class="card pad timeline-card" aria-label="Vertragsverlauf">
      <div class="card-head"><div><h3>Dein Vertrag im Zeitverlauf</h3><p class="card-sub">Aufschubzeit in ganzen Jahren, wie im Debeka-System</p></div></div>
      <div class="tl" id="tl">
        <div class="tl-mark top start"><em>Vertragsbeginn</em><b id="tlStartAge">–</b><span id="tlStartDate">–</span></div>
        <div class="tl-mark top end" style="left:80%"><em>Rentenbeginn</em><b id="tlRbAge">–</b><span id="tlRbDate">–</span></div>
        <div class="tl-mark bottom mid" id="tlEnd"><em>Beitragsende</em><b id="tlEndAge">–</b><span id="tlEndDate">–</span></div>
        <div class="tl-track">
          <span class="tl-seg pay" id="tlPay"><em>Beitragsphase</em></span>
          <span class="tl-seg rest" id="tlRest"><em>beitragsfrei</em></span>
          <span class="tl-seg rente"><em>Rente</em></span>
        </div>
      </div>
      <dl class="facts">
        <div><dt>Alter bei Start</dt><dd id="mAge">–</dd></div>
        <div><dt>Aufschubzeit</dt><dd id="mAuf">–</dd></div>
        <div><dt>Beitragsdauer</dt><dd id="mBd">–</dd></div>
        <div><dt>Garantiezeit</dt><dd id="mGz">–</dd></div>
      </dl>
    </section>

    <section class="card pad options-card" aria-label="Optionen bei Rentenbeginn">
      <div class="card-head"><div><h3>Deine Wahl bei Rentenbeginn mit <span id="pAge">67</span></h3><p class="card-sub">Kapitalwahlrecht (§ 45): Du entscheidest erst, wenn es so weit ist.</p></div></div>
      <div class="opts" id="opts" data-n="3">
        <article class="opt featured"><span class="opt-badge">Garantiert lebenslang</span><h4>Lebenslange Rente</h4><div class="opt-v"><span id="pLebens">–</span><small>/ Monat</small></div><p id="pLebensSub">–</p></article>
        <article class="opt"><h4>Kapitalabfindung</h4><div class="opt-v" id="pKapital">–</div><p id="pKapitalSub">–</p></article>
        <article class="opt"><h4>Kapitalverzehr über <span id="pJahre">25</span> Jahre</h4><div class="opt-v"><span id="pRente">–</span><small>/ Monat</small></div><p id="pRenteSub">–</p></article>
        <article class="opt" id="pSteigBox" hidden><h4>Steigende Rente · Start</h4><div class="opt-v"><span id="pSteig">–</span><small>/ Monat</small></div><p id="pSteigSub">–</p></article>
      </div>
      <ul class="opt-notes">
        <li>Todesfall vor Rentenbeginn: Das aktuelle Fondsguthaben geht an deine Hinterbliebenen (§ 35).</li>
        <li>„Chance Invest“ ist die volle Fondsanlage – ohne Garantierente und ohne garantierte Kapitalabfindung.</li>
      </ul>
    </section>

    <footer class="fineprint">
      <p><strong>So rechnet der Rechner:</strong> Modell auf Basis Tarif ${POLICY.tarif} (Bedingungen ${POLICY.bedingungen}) mit Abschluss-, Verwaltungs- und Fondskosten. Die Kostensätze sind auf die Debeka-Musterrechnung kalibriert (50 € im Monat, 5 % p. a.: 35 Jahre → 46.316 €, 34 Jahre → 43.758 €) und frei anpassbar. Die Aufschubzeit zählt wie bei Debeka in ganzen Jahren.</p>
      <p>Unabhängige, unverbindliche Modellrechnung – keine Anlage- oder Steuerberatung und kein Angebot der Debeka. Maßgeblich sind die Versicherungsbedingungen und dein persönliches Angebot. Fondsdaten: Debeka, Stand <span id="fundStand">${FUND.updatedAt}</span>. Erträge schwanken; vergangene Wertentwicklungen sind kein verlässlicher Indikator für die Zukunft.</p>
    </footer>
  </main>

  <div class="dock" id="dock" aria-hidden="true">
    <span class="dock-k">Netto<span class="dock-hide"> mit <span id="dAge">67</span></span></span>
    <b class="dock-v" id="dNetto">–</b>
    <span class="dock-sep" aria-hidden="true"></span>
    <span class="dock-k">Rente</span>
    <b class="dock-v gain" id="dRente">–</b>
    <button class="dock-up" id="dockUp" type="button" tabindex="-1" aria-label="Zum Ergebnis">${ICON.up}</button>
  </div>
  <div class="tip-pop" id="tipPop" role="tooltip"></div>`;
}

function perfBars() {
  const max = Math.max(1, ...FUND.perf.map((p) => p.v));
  return FUND.perf.map((p, i) => {
    const w = Math.max(0, p.v / max).toFixed(3);
    const sign = p.v >= 0 ? "+" : "";
    return `<div class="perf-row"><span class="pr-lab">${p.label}</span>` +
      `<span class="pr-bar"><i style="--w:${w};--d:${(0.55 + i * 0.1).toFixed(2)}s"></i></span>` +
      `<span class="pr-val">${sign}${num2.format(p.v)} %</span></div>`;
  }).join("");
}

function info(tip) {
  return `<button type="button" class="info" data-tip="${tip}" aria-label="Erklärung: ${tip}"></button>`;
}
function label(text, tip, forId) {
  return `<div class="f-label"><label for="${forId}">${text}</label>${info(tip)}</div>`;
}
function field(lbl, key, unit, tip, kind) {
  return `<div class="field">${label(lbl, tip, "in_" + key)}
    <div class="inp"><input id="in_${key}" inputmode="${kind === "int" ? "numeric" : "decimal"}" autocomplete="off" data-key="${key}" data-kind="${kind}" /><span class="unit">${unit}</span></div></div>`;
}
function dateField(lbl, key, tip) {
  return `<div class="field">${label(lbl, tip, "in_" + key)}
    <div class="inp"><input type="date" id="in_${key}" data-key="${key}" data-kind="date" /></div></div>`;
}
function selectField(lbl, key, tip, opts) {
  const o = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  return `<div class="field">${label(lbl, tip, "in_" + key)}
    <div class="sel-wrap"><select class="sel" id="in_${key}" data-key="${key}" data-kind="select">${o}</select></div></div>`;
}
function slider(lbl, key, min, max, step, unit, tip) {
  return `<div class="field"><div class="slider-row">${label(lbl, tip, "in_" + key)}<output class="val" id="lbl_${key}" for="in_${key}"></output></div>
    <input type="range" id="in_${key}" data-key="${key}" data-kind="range" data-unit="${unit}" min="${min}" max="${max}" step="${step}" /></div>`;
}
function acc(id, title, open, body) {
  return `<div class="acc${open ? " open" : ""}">
    <button class="acc-head" type="button" aria-expanded="${open}" aria-controls="acc_${id}">
      <span class="acc-title">${title}</span><span class="acc-sum" id="sum_${id}"></span><span class="acc-chev" aria-hidden="true">${ICON.chev}</span>
    </button>
    <div class="acc-body" id="acc_${id}"${open ? "" : " inert"}><div class="acc-inner"><div class="acc-pad">${body}</div></div></div>
  </div>`;
}

/* ============================ Animation ============================== */
const shown = {};
const tweens = new Map();
let rafId = 0;

function tween(key, to, apply, dur) {
  const from = key in shown ? shown[key] : 0;
  if (reduceMotion || !dur || from === to) {
    tweens.delete(key);
    shown[key] = to;
    apply(to);
    return;
  }
  tweens.set(key, { from, to, apply, start: performance.now(), dur });
  if (!rafId) rafId = requestAnimationFrame(stepTweens);
}
function stepTweens(now) {
  for (const [key, t] of tweens) {
    const p = Math.min(1, (now - t.start) / t.dur);
    const e = 1 - Math.pow(1 - p, 4);
    const v = t.from + (t.to - t.from) * e;
    shown[key] = v;
    t.apply(v);
    if (p >= 1) tweens.delete(key);
  }
  rafId = tweens.size ? requestAnimationFrame(stepTweens) : 0;
}
function setText(id, v) { const el = $(id); if (el && el.textContent !== v) el.textContent = v; }
function count(key, value, dur, fmt, ...ids) {
  tween(key, value, (v) => { const s = fmt(v); ids.forEach((id) => setText(id, s)); }, dur);
}

/* ============================ Rendering ============================== */
let R = null;
const fmtMY = (d) => (d ? dtf.format(d) : "–");
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

function refreshInputs() {
  document.querySelectorAll("[data-key]").forEach((el) => {
    const k = el.dataset.key, kind = el.dataset.kind;
    if (kind === "range") {
      el.value = state[k];
      const pos = ((state[k] - el.min) / (el.max - el.min)) * 100;
      el.style.setProperty("--fill", pos + "%");
      const disp = Number.isInteger(state[k]) ? String(state[k]) : num1.format(state[k]);
      setText("lbl_" + k, disp + " " + el.dataset.unit);
    } else if (kind === "select") {
      el.value = String(state[k]);
    } else if (kind === "date") {
      if (el.value !== state[k]) el.value = state[k];
    } else if (document.activeElement !== el) {
      el.value = new Intl.NumberFormat("de-DE").format(state[k]);
    }
  });
  document.querySelectorAll("#renditePreset button").forEach((b) =>
    b.setAttribute("aria-pressed", String(Math.abs(parseFloat(b.dataset.v) - state.rendite) < 0.001)));
  document.querySelectorAll("[data-chip]").forEach((b) =>
    b.setAttribute("aria-pressed", String(+b.dataset.chip === state.sparrate)));
  placeIndicators();
}

function placeIndicators() {
  document.querySelectorAll(".seg").forEach((seg) => {
    const ind = seg.querySelector(".seg-ind");
    const act = seg.querySelector('button[aria-pressed="true"]');
    if (!ind) return;
    if (!act) { ind.style.opacity = "0"; return; }
    ind.style.opacity = "1";
    ind.style.width = act.offsetWidth + "px";
    ind.style.transform = `translateX(${act.offsetLeft}px)`;
  });
}

function render(mode) {
  R = compute(state);
  refreshInputs();
  const dur = mode === "load" ? 1600 : mode === "drag" ? 340 : 760;

  count("netto", R.netto, dur, money, "rNetto", "dNetto");
  count("gewinn", R.gewinn, dur, money, "rGain");
  count("contrib", R.contributed, dur, money, "rContrib");
  count("brutto", R.brutto, dur, money, "rBrutto", "pKapital");
  count("steuer", R.steuer, dur, (v) => "−" + money(v), "rTax");
  count("eff", R.effAnnual, dur, (v) => num2.format(v) + " %", "rEff");
  count("mult", R.contributed > 0 ? R.brutto / R.contributed : 0, dur, (v) => num2.format(v) + " €", "rMult");
  count("rente", R.lebensrente, dur, money, "rRente", "pLebens");
  tween("dRente", R.lebensrente, (v) => setText("dRente", money(v)), dur);
  tween("ring", R.brutto > 0 ? R.gewinn / R.brutto : 0, paintRing, dur);

  [["rAge"], ["rAge2"], ["pAge"], ["dAge"]].forEach(([id]) => setText(id, String(state.rentenalter)));
  setText("rDate", "Rentenbeginn " + fmtMY(R.rentenDate));

  renderTimeline();
  renderOptions(dur);
  renderSummaries();
  updateChart(mode === "load" ? 1500 : dur);
}

const RING_C = 2 * Math.PI * 58;
function paintRing(g) {
  const gap = g > 0.01 && g < 0.99 ? 4 : 0;
  const conLen = Math.max(0, (1 - g) * RING_C - gap);
  const gainLen = Math.max(0, g * RING_C - gap);
  const con = $("ringCon"), gain = $("ringGain");
  con.setAttribute("stroke-dasharray", `${conLen.toFixed(2)} ${RING_C.toFixed(2)}`);
  gain.setAttribute("stroke-dasharray", `${gainLen.toFixed(2)} ${RING_C.toFixed(2)}`);
  gain.setAttribute("stroke-dashoffset", (-(1 - g) * RING_C).toFixed(2));
  setText("ringPct", Math.round(g * 100) + " %");
}

const TL_SPAN = 80; // Anteil der Leiste für die Aufschubzeit (in %)
function renderTimeline() {
  const start = parseDate(state.vertragsbeginn);
  const pay = R.totalMonths ? R.beitragsMonths / R.totalMonths : 1;
  $("tlPay").style.width = TL_SPAN * pay + "%";
  $("tlRest").style.width = TL_SPAN * (1 - pay) + "%";
  setText("tlStartAge", R.eintrittsalter + " J.");
  setText("tlStartDate", fmtMY(start));
  setText("tlRbAge", R.eintrittsalter + Math.round(R.years) + " J.");
  setText("tlRbDate", fmtMY(R.rentenDate));
  const endEl = $("tlEnd");
  endEl.hidden = pay > 0.97 || !start;
  $("tl").classList.toggle("no-end", endEl.hidden);
  if (!endEl.hidden) {
    setText("tlEndAge", R.eintrittsalter + Math.round(R.beitragsMonths / 12) + " J.");
    setText("tlEndDate", fmtMY(addMonths(start, R.beitragsMonths)));
    positionEndMark(pay);
  }
  setText("mAge", formatYM(Math.round(R.ageAtStart * 12)));
  setText("mAuf", formatYM(R.totalMonths));
  setText("mBd", formatYM(R.beitragsMonths));
  setText("mGz", state.garantiezeit > 0 ? state.garantiezeit + " Jahre" : "keine");
}
function positionEndMark(pay) {
  const tl = $("tl"), el = $("tlEnd");
  const W = tl.clientWidth, w = el.offsetWidth;
  const x = (TL_SPAN / 100) * pay * W;
  const left = Math.max(0, Math.min(W - w, x - w / 2));
  el.style.left = left + "px";
  el.style.transform = "none";
  el.style.setProperty("--stem", Math.max(4, Math.min(w - 6, x - left - 1)) + "px");
}

function renderOptions(dur) {
  setText("pLebensSub", `Rentenfaktor ${num2.format(state.rentenfaktor)} € je 10.000 € · Garantiezeit ${state.garantiezeit > 0 ? state.garantiezeit + " J." : "keine"}`);
  setText("pKapitalSub", `einmalig ausgezahlt · nach Steuer ${money(R.netto)}`);
  setText("pJahre", String(state.entnahmeJahre));
  count("verzehr", R.monatsrente, dur, money, "pRente");
  setText("pRenteSub", `${state.entnahmeJahre} Jahre lang · ${pct1(state.renditeRente)} Restrendite`);
  const steig = state.rentensteigerung > 0;
  $("pSteigBox").hidden = !steig;
  $("opts").dataset.n = steig ? "4" : "3";
  if (steig) {
    count("steig", R.steigStart, dur, money, "pSteig");
    setText("pSteigSub", `steigt danach jedes Jahr um ${state.rentensteigerung} %`);
  }
}

function renderSummaries() {
  setText("sum_plan", money(state.sparrate) + " / Monat");
  setText("sum_zeit", formatYM(R.totalMonths) + " bis zur Rente");
  setText("sum_rendite", pct1(state.rendite) + " p. a.");
  setText("sum_kosten", `${num2.format(state.ter)} · ${num1.format(state.abschluss)} · ${num1.format(state.verwaltung)} %`);
  setText("sum_steuer", state.steuersatz + " % Steuersatz");
  setText("sum_rente", "Faktor " + num2.format(state.rentenfaktor));
}

/* ============================ Chart ================================= */
const N = 96;
let G = null, chartShown = null;

function niceMax(v) {
  if (v <= 0) return 1000;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const s of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * pow >= v) return s * pow;
  return 10 * pow;
}
function compactEur(v) {
  if (v >= 1e6) return num1.format(v / 1e6).replace(",0", "") + " Mio. €";
  if (v >= 1000) return Math.round(v / 1000) + " Tsd. €";
  return Math.round(v) + " €";
}

function chartTarget() {
  const s = R.series, n = s.length;
  const bal = s.map((p) => (state.realView ? p.real : p.balance));
  const con = s.map((p, i) => Math.min(p.contributed, bal[i]));
  const resample = (arr) => {
    const out = new Array(N);
    for (let j = 0; j < N; j++) {
      const t = (j / (N - 1)) * (n - 1);
      const i0 = Math.floor(t), i1 = Math.min(n - 1, i0 + 1), f = t - i0;
      out[j] = arr[i0] + (arr[i1] - arr[i0]) * f;
    }
    return out;
  };
  return {
    bal: resample(bal), con: resample(con),
    maxY: niceMax(Math.max(...bal) * 1.14),
    age0: R.eintrittsalter, years: R.years,
    beFrac: R.totalMonths ? R.beitragsMonths / R.totalMonths : 1,
  };
}
function lerpChart(a, b, p) {
  const L = (x, y) => x + (y - x) * p;
  return {
    bal: b.bal.map((v, j) => L(a.bal[j], v)),
    con: b.con.map((v, j) => L(a.con[j], v)),
    maxY: L(a.maxY, b.maxY), age0: L(a.age0, b.age0),
    years: L(a.years, b.years), beFrac: L(a.beFrac, b.beFrac),
  };
}
function updateChart(dur) {
  const target = chartTarget();
  if (!chartShown) chartShown = { ...target, bal: target.bal.map(() => 0), con: target.con.map(() => 0) };
  const from = { ...chartShown, bal: chartShown.bal.slice(), con: chartShown.con.slice() };
  shown.chart = 0;
  tween("chart", 1, (p) => { chartShown = lerpChart(from, target, p); paintChart(chartShown); }, dur);
}

function buildChart() {
  const wrap = $("chartWrap"), svg = $("chart");
  const W = Math.max(260, Math.round(wrap.clientWidth));
  const H = W < 520 ? 250 : W < 760 ? 300 : 340;
  G = { W, H, l: 2, r: 2, t: 30, b: 30 };
  const ih = H - G.t - G.b;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  let grid = "", ylab = "", xlab = "";
  for (let k = 0; k <= 4; k++) {
    const y = G.t + ih - (ih * k) / 4;
    grid += `<line class="c-grid${k === 0 ? " base" : ""}" x1="${G.l}" x2="${W - G.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    if (k > 0) ylab += `<text class="c-ylab" id="cy${k}" x="${G.l + 2}" y="${(y - 7).toFixed(1)}"></text>`;
  }
  for (let k = 0; k <= 5; k++) {
    const x = G.l + (k / 5) * (W - G.l - G.r);
    const anchor = k === 0 ? "start" : k === 5 ? "end" : "middle";
    xlab += `<text class="c-xlab" id="cx${k}" x="${x.toFixed(1)}" y="${H - 8}" text-anchor="${anchor}"></text>`;
  }
  svg.innerHTML = `
    <defs>
      <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-gain-a"/><stop offset="1" class="st-gain-b"/></linearGradient>
      <linearGradient id="gCon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-con-a"/><stop offset="1" class="st-con-b"/></linearGradient>
    </defs>
    ${grid}
    <path id="cAreaBal" fill="url(#gBal)"/>
    <path id="cAreaCon" fill="url(#gCon)"/>
    <path id="cLineCon" class="c-con"/>
    <path id="cLineBal" class="c-bal"/>
    ${ylab}${xlab}
    <g id="cBe"><line class="c-be" id="cBeL" y1="${G.t}" y2="${G.t + ih}"/><text class="c-bet" id="cBeT" y="${G.t + ih - 8}" text-anchor="end">Beitragsende</text></g>
    <g>
      <circle class="c-end-halo" id="cEndH" r="7"/>
      <circle class="c-end-dot" id="cEndD" r="6"/>
      <rect class="c-end-pill" id="cEndP" rx="10" height="26"/>
      <text class="c-end-text" id="cEndT"></text>
    </g>
    <g class="c-hov" id="cHov"><line class="c-hline" id="cHL" y1="${G.t}" y2="${G.t + ih}"/><circle class="c-hdot-c" id="cHC" r="5"/><circle class="c-hdot-b" id="cHB" r="6.5"/></g>`;
}

function paintChart(c) {
  if (!G) return;
  const iw = G.W - G.l - G.r, ih = G.H - G.t - G.b;
  const X = (j) => G.l + (j / (N - 1)) * iw;
  const Y = (v) => G.t + (1 - Math.max(0, v) / c.maxY) * ih;
  let dB = "", dC = "";
  for (let j = 0; j < N; j++) {
    const x = X(j).toFixed(1);
    dB += (j ? "L" : "M") + x + "," + Y(c.bal[j]).toFixed(1);
    dC += (j ? "L" : "M") + x + "," + Y(c.con[j]).toFixed(1);
  }
  const base = `L${X(N - 1).toFixed(1)},${(G.t + ih).toFixed(1)}L${X(0).toFixed(1)},${(G.t + ih).toFixed(1)}Z`;
  $("cAreaBal").setAttribute("d", dB + base);
  $("cAreaCon").setAttribute("d", dC + base);
  $("cLineBal").setAttribute("d", dB);
  $("cLineCon").setAttribute("d", dC);

  for (let k = 1; k <= 4; k++) setText("cy" + k, compactEur((c.maxY * k) / 4));
  for (let k = 0; k <= 5; k++) {
    const age = Math.round(c.age0 + (k / 5) * c.years);
    setText("cx" + k, k === 0 ? "Alter " + age : String(age));
  }

  const be = $("cBe");
  if (c.beFrac < 0.97) {
    const bx = G.l + c.beFrac * iw;
    be.style.display = "";
    $("cBeL").setAttribute("x1", bx.toFixed(1));
    $("cBeL").setAttribute("x2", bx.toFixed(1));
    $("cBeT").setAttribute("x", (bx - 6).toFixed(1));
  } else {
    be.style.display = "none";
  }

  const ex = X(N - 1), ey = Y(c.bal[N - 1]);
  ["cEndH", "cEndD"].forEach((id) => { $(id).setAttribute("cx", ex.toFixed(1)); $(id).setAttribute("cy", ey.toFixed(1)); });
  const t = $("cEndT");
  setText("cEndT", money(c.bal[N - 1]));
  const tw = t.getComputedTextLength() + 22;
  const px = Math.max(G.l, ex - tw - 12);
  const py = Math.max(2, ey - 40);
  const pill = $("cEndP");
  pill.setAttribute("x", px.toFixed(1));
  pill.setAttribute("y", py.toFixed(1));
  pill.setAttribute("width", tw.toFixed(1));
  t.setAttribute("x", (px + 11).toFixed(1));
  t.setAttribute("y", (py + 17.5).toFixed(1));
}

function bindChartHover() {
  const svg = $("chart"), tip = $("chartTip");
  const hide = () => { $("cHov") && $("cHov").classList.remove("on"); tip.classList.remove("on"); };
  const move = (clientX) => {
    if (!R || !G || !chartShown) return;
    const rect = svg.getBoundingClientRect();
    const scale = G.W / rect.width;
    const iw = G.W - G.l - G.r, ih = G.H - G.t - G.b;
    const s = R.series, n = s.length;
    const px = (clientX - rect.left) * scale;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - G.l) / iw) * (n - 1))));
    const p = s[i];
    const bal = state.realView ? p.real : p.balance;
    const con = Math.min(p.contributed, bal);
    const X = G.l + (n > 1 ? i / (n - 1) : 1) * iw;
    const Y = (v) => G.t + (1 - v / chartShown.maxY) * ih;
    $("cHL").setAttribute("x1", X); $("cHL").setAttribute("x2", X);
    $("cHB").setAttribute("cx", X); $("cHB").setAttribute("cy", Y(bal));
    $("cHC").setAttribute("cx", X); $("cHC").setAttribute("cy", Y(con));
    $("cHov").classList.add("on");
    const year = Math.round(p.year);
    tip.innerHTML = `
      <div class="tt-h">Alter ${R.eintrittsalter + year} <span>· nach ${year} Jahr${year === 1 ? "" : "en"}</span></div>
      <div class="tt-r"><span><i class="sw gain"></i>${state.realView ? "Kaufkraft" : "Fondsguthaben"}</span><b>${money(bal)}</b></div>
      <div class="tt-r"><span><i class="sw con"></i>Eingezahlt</span><b>${money(p.contributed)}</b></div>
      <div class="tt-r gain"><span>Gewinn</span><b>+${money(Math.max(0, bal - p.contributed))}</b></div>`;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const xPx = X / scale, yPx = Y(bal) / scale;
    let left = xPx + 18;
    if (left + tw > rect.width) left = xPx - tw - 18;
    const top = Math.max(0, Math.min(rect.height - th, yPx - th / 2));
    tip.style.transform = `translate(${Math.max(0, left)}px, ${top}px)`;
    tip.classList.add("on");
  };
  svg.addEventListener("pointermove", (e) => move(e.clientX));
  svg.addEventListener("pointerdown", (e) => move(e.clientX));
  svg.addEventListener("pointerleave", hide);
}

/* ======================= Kopfband-Animation ========================== */
function bandFx() {
  const cv = $("bandCanvas"), band = $("band");
  const ctx = cv.getContext && cv.getContext("2d");
  if (!ctx) return;
  let w = 0, h = 0, raf = 0, visible = true;
  const lines = Array.from({ length: 8 }, (_, i) => ({
    k: 0.3 + i * 0.075, g: 2.1 + (i % 3) * 0.45, amp: 5 + i * 1.6,
    ph: i * 1.9, sp: 0.18 + (i % 4) * 0.05, a: 0.07 + (i % 3) * 0.035,
  }));
  const dots = Array.from({ length: 10 }, (_, i) => ({
    line: i % lines.length, off: (i * 0.137) % 1, v: 0.016 + (i % 5) * 0.004, green: i % 3 === 0,
  }));
  const size = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const yAt = (L, x, t) => {
    const u = x / w;
    const growth = (Math.exp(L.g * u) - 1) / (Math.exp(L.g) - 1);
    return h * (1.02 - L.k * growth) + Math.sin(u * 5.5 + t * L.sp + L.ph) * L.amp;
  };
  const draw = (now) => {
    const t = now / 1000;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.3;
    for (const L of lines) {
      ctx.beginPath();
      for (let x = 0; x <= w + 8; x += 8) {
        const y = yAt(L, x, t);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255,255,255,${L.a})`;
      ctx.stroke();
    }
    for (const d of dots) {
      const L = lines[d.line];
      const u = (d.off + t * d.v) % 1;
      const x = u * w, y = yAt(L, x, t);
      const r = 10 + u * 10;
      const rgb = d.green ? "150,245,190" : "255,255,255";
      const fade = Math.sin(u * Math.PI);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${rgb},${0.85 * fade})`);
      grad.addColorStop(0.18, `rgba(${rgb},${0.35 * fade})`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
  const start = () => { if (!raf && visible && !document.hidden && !reduceMotion) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  size();
  draw(4000);
  if (reduceMotion) return;
  new ResizeObserver(() => { size(); draw(performance.now()); }).observe(band);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(band);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
}

/* ============================ Events ================================ */
function parseNum(str) {
  const cleaned = String(str).replace(/\./g, "").replace(/[^0-9,\-]/g, "").replace(",", ".");
  const v = parseFloat(cleaned);
  return isNaN(v) ? 0 : v;
}
const LIMITS = {
  startkapital: [0, 10000000], sparrate: [0, 100000], dynamik: [0, 10],
  rentenalter: [30, 90], rendite: [1, 12], ter: [0, 2],
  abschluss: [0, 4], verwaltung: [0, 15], inflation: [0, 5],
  entnahmeJahre: [5, 40], renditeRente: [0, 7], rentenfaktor: [10, 50],
  steuersatz: [0, 45],
};
function clamp(k, v) { const [lo, hi] = LIMITS[k] || [-Infinity, Infinity]; return Math.min(hi, Math.max(lo, v)); }

function bind() {
  const app = $("app");

  app.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.key) return;
    const k = el.dataset.key, kind = el.dataset.kind;
    if (kind === "range") { state[k] = clamp(k, parseFloat(el.value)); render("drag"); }
    else if (kind === "select") { state[k] = parseFloat(el.value); render("change"); }
    else if (kind === "date") { if (el.value) { state[k] = el.value; render("change"); } }
    else {
      let v = parseNum(el.value);
      if (kind === "int") v = Math.round(v);
      state[k] = v;
      render("drag");
    }
  });

  app.addEventListener("blur", (e) => {
    const el = e.target, kind = el.dataset && el.dataset.kind;
    if (el.dataset && el.dataset.key && kind !== "range" && kind !== "select" && kind !== "date") {
      state[el.dataset.key] = clamp(el.dataset.key, state[el.dataset.key]);
      render("change");
    }
  }, true);

  app.addEventListener("click", (e) => {
    const head = e.target.closest(".acc-head");
    if (head) {
      const accEl = head.parentElement, open = !accEl.classList.contains("open");
      accEl.classList.toggle("open", open);
      head.setAttribute("aria-expanded", String(open));
      accEl.querySelector(".acc-body").inert = !open;
      if (open) requestAnimationFrame(placeIndicators);
      return;
    }
    const chip = e.target.closest("[data-chip]");
    if (chip) { state.sparrate = +chip.dataset.chip; render("change"); return; }
    const preset = e.target.closest("#renditePreset button");
    if (preset) { state.rendite = clamp("rendite", parseFloat(preset.dataset.v)); render("change"); return; }
    const view = e.target.closest("#viewSeg button");
    if (view) {
      state.realView = view.dataset.view === "real";
      document.querySelectorAll("#viewSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b === view)));
      setText("lgBal", state.realView ? "Kaufkraft in heutigen Euro" : "Fondsguthaben");
      setText("chartSub", state.realView
        ? `Bereinigt um ${pct1(state.inflation)} Inflation pro Jahr.`
        : "Jahr für Jahr – fahre über die Kurve.");
      placeIndicators();
      updateChart(800);
    }
  });

  $("themeBtn").addEventListener("click", toggleTheme);
  $("dockUp").addEventListener("click", () =>
    $("resultCard").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));

  const dock = $("dock");
  new IntersectionObserver(([e]) => {
    const show = e.intersectionRatio < 0.12;
    dock.classList.toggle("show", show);
    dock.setAttribute("aria-hidden", String(!show));
    $("dockUp").tabIndex = show ? 0 : -1;
  }, { threshold: [0, 0.12, 0.3] }).observe($("resultCard"));

  let lastW = 0;
  new ResizeObserver(() => {
    const w = $("chartWrap").clientWidth;
    if (w && w !== lastW) {
      lastW = w;
      buildChart();
      if (chartShown) paintChart(chartShown);
    }
    placeIndicators();
    if (R && !$("tlEnd").hidden) positionEndMark(R.totalMonths ? R.beitragsMonths / R.totalMonths : 1);
  }).observe($("app"));

  bindChartHover();
  bindTips();
}

function bindTips() {
  const pop = $("tipPop");
  let cur = null;
  const place = (el) => {
    const r = el.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left + r.width / 2 - pw / 2));
    let top = r.top - ph - 10;
    if (top < 8) top = r.bottom + 10;
    pop.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };
  const show = (el) => { cur = el; pop.textContent = el.dataset.tip; pop.classList.add("show"); place(el); };
  const hide = () => { cur = null; pop.classList.remove("show"); };
  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest && e.target.closest(".info");
    if (el && e.pointerType === "mouse") show(el);
  });
  document.addEventListener("pointerout", (e) => {
    const el = e.target.closest && e.target.closest(".info");
    if (el && e.pointerType === "mouse" && !el.contains(e.relatedTarget)) hide();
  });
  document.addEventListener("click", (e) => {
    const el = e.target.closest && e.target.closest(".info");
    if (el) { if (cur === el && e.pointerType !== "mouse") hide(); else show(el); }
    else if (cur) hide();
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest && e.target.closest(".info");
    if (el && el.matches(":focus-visible")) show(el);
  });
  document.addEventListener("focusout", (e) => { if (e.target === cur) hide(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
  window.addEventListener("scroll", () => cur && hide(), { passive: true, capture: true });
}

/* ============================ Theme ================================= */
const darkMQ = matchMedia("(prefers-color-scheme: dark)");
function isDark() {
  const a = document.documentElement.getAttribute("data-theme");
  return a ? a === "dark" : darkMQ.matches;
}
function updateThemeBtn() {
  const d = isDark();
  $("themeIcon").innerHTML = d ? ICON.sun : ICON.moon;
  setText("themeTxt", d ? "Hell" : "Dunkel");
  $("themeBtn").setAttribute("aria-label", d ? "Helles Design einschalten" : "Dunkles Design einschalten");
}
function toggleTheme(ev) {
  const next = isDark() ? "light" : "dark";
  const apply = () => {
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("av-theme", next); } catch (e) { /* Speicher gesperrt */ }
    updateThemeBtn();
  };
  if (!document.startViewTransition || reduceMotion) { apply(); return; }
  const x = ev && ev.clientX ? ev.clientX : window.innerWidth - 60;
  const y = ev && ev.clientY ? ev.clientY : 40;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const vt = document.startViewTransition(apply);
  vt.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => {});
}

/* ============================ Init ================================= */
/* Lädt die aktuellen Fondszahlen aus fund-data.json (GitHub Pages). Offline
   oder in der Artifact-Vorschau schlägt der Abruf fehl – dann bleiben die
   eingebauten Werte stehen. */
async function loadFundData() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("fund-data.json", { cache: "no-store", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return;
    const d = await res.json();
    const ok = (x) => typeof x === "number" && isFinite(x);
    if (ok(d.paSince)) FUND.paSince = d.paSince;
    if (ok(d.totalSince)) FUND.totalSince = d.totalSince;
    if (ok(d.runningCost)) FUND.runningCost = d.runningCost;
    if (d.sinceDate) FUND.sinceDate = d.sinceDate;
    if (ok(d.since)) FUND.since = d.since;
    if (d.updatedAt) FUND.updatedAt = d.updatedAt;
    if (Array.isArray(d.perf) && d.perf.length &&
        d.perf.every((p) => p && ok(p.v) && typeof p.label === "string")) {
      FUND.perf = d.perf;
    }
  } catch (e) {
    /* offline / CSP → eingebaute Werte behalten */
  }
}

async function init() {
  try {
    const t = localStorage.getItem("av-theme");
    if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
  } catch (e) { /* Speicher gesperrt */ }
  await loadFundData();
  state.ter = FUND.runningCost;
  $("app").innerHTML = shell();
  updateThemeBtn();
  darkMQ.addEventListener && darkMQ.addEventListener("change", updateThemeBtn);
  buildChart();
  bind();
  render("load");
  count("fPa", FUND.paSince, 1400, (v) => num2.format(v) + " %", "fPa");
  count("fTotal", FUND.totalSince, 1600, (v) => "+" + num2.format(v) + " %", "fTotal");
  count("fTer", FUND.runningCost, 1200, (v) => num2.format(v) + " %", "fTer");
  bandFx();
}

init();
