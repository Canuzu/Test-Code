/* =========================================================================
   Debeka Global Shares – Altersvorsorge-Rechner  ·  Vanilla JS, keine Abh.
   -------------------------------------------------------------------------
   Rechnet primär mit dem Debeka Global Shares (globaler Aktien-Dachfonds,
   ESG, internes Sondervermögen der Debeka Fondspolice).

   Rechenmodell (monatliche Verzinsung):
     · effektive Rendite p.a. = erwartete Rendite − laufende Fondskosten
       − optionale Effektivkosten der Police
     · Sparrate kann jährlich dynamisch steigen (z. B. Inflationsausgleich)
     · Steuer bei Auszahlung: Abgeltungsteuer 25 % + Soli = 26,375 % auf den
       Kursgewinn, gemindert um die Teilfreistellung (Aktienfonds 30 %)
     · reale Kaufkraft = Netto-Endvermögen / (1 + Inflation)^Jahre
     · Entnahmephase: nachschüssige Rentenformel über die gewünschte Dauer
   ========================================================================= */

/* --------------------- Fonds-Stammdaten (öffentlich) ------------------- */
/* Quelle: Debeka-Produktinformation/Factsheet „Debeka Global Shares“.     */
const FUND = {
  name: "Debeka Global Shares",
  sub: "Globaler Aktien-Dachfonds · ESG · Debeka Fondspolice",
  paSince: 9.99,        // % p.a. seit Auflegung 22.04.2016
  totalSince: 164.42,   // % Gesamtentwicklung seit Auflegung
  runningCost: 0.30,    // % p.a. laufende Fondskosten (0,025 %/Monat)
  since: 2016,
  sinceDate: "22.04.2016",
  updatedAt: "10.07.2026",
  // Öffentliche Wertentwicklung laut Debeka (Anteilswert, netto).
  // Diese Werte sind der Fallback; zur Laufzeit werden sie – wenn erreichbar –
  // aus fund-data.json überschrieben (siehe loadFundData()).
  perf: [
    { label: "1 Jahr", v: 24.77 },
    { label: "3 Jahre", v: 58.71 },
    { label: "5 Jahre", v: 61.99 },
    { label: "seit Auflage", v: 164.42 },
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
  // Beispiel-Rentenfaktor (€ mtl. je 10.000 € Kapital); exakter, garantierter
  // Wert steht im persönlichen Angebot. Nur Vorbelegung, frei anpassbar.
  rentenfaktorBeispiel: 27,
};

const SOLI = 1.055;
const ABGELT = 0.25;
const TAX_RATE = ABGELT * SOLI; // = 0,26375
const TEILFREISTELLUNG = { aktien: 0.30, misch: 0.15, none: 0.0 };

/* ---------------------------- State ---------------------------------- */
const state = {
  startkapital: 5000,
  sparrate: 200,
  dynamik: 2,
  alter: 34,
  rentenalter: 67,
  rendite: 10,                // Voreinstellung ≈ Ø-Rendite p.a. seit Auflegung
  ter: FUND.runningCost,      // laufende Fondskosten
  policy: 0,                  // Effektivkosten der Police (variiert je Vertrag)
  inflation: 2,
  fondstyp: "aktien",
  beitragsdauer: 33,          // Jahre, in denen Beiträge gezahlt werden
  garantiezeit: 15,           // Rentengarantiezeit in Jahren (informativ)
  entnahmeJahre: 25,
  renditeRente: 3,
  rentensteigerung: 0,        // jährliche Rentensteigerung (steigende Rente)
  rentenfaktor: POLICY.rentenfaktorBeispiel, // € mtl. je 10.000 € (lebenslange Rente)
  realView: false,
};

/* --------------------------- Formatting ------------------------------ */
const eur0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const num2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct1 = (v) => num1.format(v) + " %";
const money = (v) => eur0.format(Math.round(v));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------- Kernberechnung ---------------------------- */
function compute(s) {
  const years = Math.max(0, Math.round(s.rentenalter - s.alter));
  const effAnnual = (s.rendite - s.ter - s.policy) / 100;
  const rMonth = Math.pow(1 + effAnnual, 1 / 12) - 1;

  let balance = s.startkapital;
  let contributed = s.startkapital;
  let monthly = s.sparrate;
  const beitragsJahre = Math.min(s.beitragsdauer, years); // Beiträge max. bis Rentenbeginn

  const series = [{ age: s.alter, year: 0, contributed, balance, real: balance }];

  for (let y = 1; y <= years; y++) {
    const paying = y <= beitragsJahre;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + rMonth) + (paying ? monthly : 0);
      if (paying) contributed += monthly;
    }
    const real = balance / Math.pow(1 + s.inflation / 100, y);
    series.push({ age: s.alter + y, year: y, contributed, balance, real });
    if (paying) monthly *= 1 + s.dynamik / 100;
  }

  const brutto = balance;
  const gewinn = Math.max(0, brutto - contributed);
  const tf = TEILFREISTELLUNG[s.fondstyp] ?? 0;
  const steuer = gewinn * (1 - tf) * TAX_RATE;
  const netto = brutto - steuer;

  const nMonths = Math.max(1, Math.round(s.entnahmeJahre * 12));
  const rR = Math.pow(1 + s.renditeRente / 100, 1 / 12) - 1;
  let monatsrente;
  if (Math.abs(rR) < 1e-9) monatsrente = netto / nMonths;
  else monatsrente = (netto * rR) / (1 - Math.pow(1 + rR, -nMonths));

  // Steigende Rente: Startbetrag einer jährlich um g % wachsenden Rente,
  // sodass das Netto-Kapital über die Auszahldauer aufgebraucht wird.
  let steigStart = 0;
  const g = s.rentensteigerung / 100;
  if (g > 0) {
    const gm = Math.pow(1 + g, 1 / 12) - 1;
    const q = Math.pow((1 + gm) / (1 + rR), nMonths);
    steigStart = Math.abs(rR - gm) < 1e-9
      ? netto / nMonths
      : (netto * (rR - gm)) / (1 - q);
  }

  // Lebenslange Rente über den (garantierten) Rentenfaktor: € je 10.000 €
  // Netto-Kapital pro Monat (§ 34/§ 47).
  const lebensrente = (netto / 10000) * s.rentenfaktor;

  return {
    years, beitragsJahre, effAnnual: effAnnual * 100,
    series, brutto, contributed, gewinn, steuer, netto,
    monatsrente, steigStart, lebensrente, nMonths,
  };
}

/* ============================ UI Markup ============================== */
function shell() {
  const presets = RENDITE_PRESETS
    .map((p) => `<button type="button" data-preset="${p.key}" data-v="${p.v}">${p.label}</button>`)
    .join("");

  return `
  <div class="wrap">
    <header class="masthead">
      <div class="brand">
        <div class="brand-mark">
          <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 48 L26 32 L37 40 L54 16" fill="none" stroke="#ecfeff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="54" cy="16" r="5.5" fill="#fde68a"/></svg>
        </div>
        <div>
          <h1>Vorsorge-Rechner</h1>
          <p>Debeka Global Shares · Endvermögen, Steuern &amp; Monatsrente – live</p>
        </div>
      </div>
      <div class="mast-right">
        <span class="debeka-word" role="img" aria-label="Debeka">Debeka</span>
        <button class="theme-toggle" id="themeBtn" type="button" aria-label="Design wechseln">
          <span id="themeIcon"></span><span id="themeTxt">Dunkel</span>
        </button>
      </div>
    </header>

    <div class="grid">
      <!-- ======== Eingaben ======== -->
      <section class="card panel" aria-label="Eingaben">
        <div class="section-title">Dein Sparplan</div>

        ${field("Monatliche Sparrate", "sparrate", "€", "Dein monatlicher Beitrag in den Fonds – entspricht dem Inkassobeitrag der Fondspolice.", "money")}
        ${field("Startkapital", "startkapital", "€", "Einmalbetrag, mit dem du heute startest (optional).", "money")}

        ${slider("Jährliche Dynamik", "dynamik", 0, 10, 0.5, "%",
          "Um diesen Prozentsatz erhöhst du deine Sparrate jedes Jahr – z. B. zum Ausgleich von Gehalts- und Preissteigerungen.")}

        <div class="divider"></div>
        <div class="section-title">Zeithorizont</div>
        <div class="split" style="margin-top:0">
          ${field("Aktuelles Alter", "alter", "J.", "Dein heutiges Alter.", "int")}
          ${field("Rentenbeginn mit", "rentenalter", "J.", "Alter, zu dem die Rentenzahlung beginnt.", "int")}
        </div>

        <div class="divider"></div>
        <div class="section-title">Fondspolice</div>
        <div class="field">
          <div class="field-label">Garantie-/Fondskombination
            <i class="info" data-tip="„Chance Invest“ ist die chancenorientierte Kombination der Debeka-Fondspolice: volle Anlage im Debeka Global Shares, ohne Beitragsgarantie."></i>
          </div>
          <div class="ro-field"><span>Chance Invest</span><span class="ro-tag">Fonds pur</span></div>
        </div>
        ${field("Beitragszahlungsdauer", "beitragsdauer", "J.", "Über wie viele Jahre zahlst du Beiträge? Danach bleibt das Kapital bis zum Rentenbeginn investiert. Höchstens die Aufschubzeit (Jahre bis zur Rente).", "int")}
        ${selectField("Rentengarantiezeit", "garantiezeit", "Zeitraum, in dem die Rente auch nach dem Tod an Hinterbliebene weitergezahlt wird.", [[0, "keine"], [5, "5 Jahre"], [10, "10 Jahre"], [15, "15 Jahre"], [20, "20 Jahre"]])}

        <div class="divider"></div>
        <div class="section-title">Rendite &amp; Kosten des Fonds</div>

        <div class="field">
          <div class="field-label">Renditeannahme
            <i class="info" data-tip="Womit möchtest du rechnen? „Historisch“ = Wertentwicklung des Debeka Global Shares seit Auflegung 2016. Vergangenheit ist keine Garantie – niedrigere Szenarien sind vorsichtiger."></i>
          </div>
          <div class="seg" id="renditePreset" role="group" aria-label="Renditeannahme">${presets}</div>
        </div>

        ${slider("Erwartete Rendite p.a.", "rendite", 1, 12, 0.1, "%",
          "Angenommene durchschnittliche Wertentwicklung pro Jahr. Der Debeka Global Shares erzielte seit Auflegung 2016 rund 9,99 % p.a. – frei anpassbar.")}
        ${slider("Laufende Fondskosten", "ter", 0, 2, 0.05, "%",
          "Kosten des Debeka Global Shares: rund 0,30 % pro Jahr (0,025 % pro Monat). Sie schmälern die Rendite direkt.")}
        ${slider("Effektivkosten der Police", "policy", 0, 4, 0.1, "%",
          "Bündelt die Policenkosten des Tarifs CA6I: Abschluss-/Vertriebs- und Verwaltungskosten (§ 17) sowie die Fondsverwaltungskosten (§ 48). Den genauen Effektivkosten-Wert (Renditeminderung p. a.) findest du in deinem persönlichen Angebot – 0 rechnet nur mit den reinen Fondskosten.")}
        ${slider("Inflation p.a.", "inflation", 0, 5, 0.1, "%",
          "Erwartete jährliche Geldentwertung. Sie bestimmt, wie viel dein Vermögen später real wert ist.")}

        <div class="divider"></div>
        <div class="section-title">Steuern bei Auszahlung</div>
        <div class="taxbox">
          <div class="taxbox-row"><span>Teilfreistellung (Aktienfonds)</span><b>30 %</b></div>
          <div class="taxbox-row"><span>Abgeltungsteuer inkl. Soli</span><b>26,375 %</b></div>
          <div class="field-hint">Der Debeka Global Shares ist ein Aktien-Dachfonds: 30 % des Kursgewinns bleiben steuerfrei, der Rest wird mit 26,375 % besteuert – effektiv rund 18,5 % auf den Gewinn.</div>
        </div>

        <div class="divider"></div>
        <div class="section-title">Später: Rente</div>
        ${field("Garantierter Rentenfaktor", "rentenfaktor", "€/10.000", "So zahlt der Fondsrentenvertrag aus (§ 34/§ 47): pro 10.000 € Kapital eine lebenslange Monatsrente in dieser Höhe. Der garantierte Rentenfaktor steht in deinem Angebot – hier als Beispiel vorbelegt.", "int")}
        ${slider("Auszahldauer (Alternative)", "entnahmeJahre", 5, 40, 1, "Jahre",
          "Nur für die Alternative „Kapitalverzehr“: Über wie viele Jahre würde das Kapital stattdessen verrentet, bis es aufgebraucht ist?")}
        ${slider("Rendite in der Rente", "renditeRente", 0, 7, 0.1, "%",
          "Das verbleibende Kapital bleibt in der Auszahlphase meist konservativer angelegt und wirft weiter Rendite ab.")}
        ${selectField("Steigende Rente", "rentensteigerung", "Optional: eine jährlich steigende Rente startet niedriger, wächst dann aber jedes Jahr um den gewählten Prozentsatz – ein Inflationsausgleich in der Rente.", [[0, "keine (konstante Rente)"], [1, "+1 % pro Jahr"], [2, "+2 % pro Jahr"], [3, "+3 % pro Jahr"]])}
      </section>

      <!-- ======== Ergebnisse ======== -->
      <div>
        <!-- Fondskarte -->
        <section class="fundcard" aria-label="Fonds">
          <div class="fund-head">
            <div class="fund-badge">DGS</div>
            <div class="fund-headmain">
              <div class="fund-name">${FUND.name}</div>
              <div class="fund-sub">${FUND.sub}</div>
            </div>
            <span class="debeka-logo" role="img" aria-label="Debeka">Debeka</span>
          </div>
          <div class="fund-facts">
            <div class="ff"><span class="ff-v">${num2.format(FUND.paSince)} %</span><span class="ff-k">Rendite p.a. seit ${FUND.since}<sup>*</sup></span></div>
            <div class="ff"><span class="ff-v">+${num2.format(FUND.totalSince)} %</span><span class="ff-k">Gesamt seit Auflegung</span></div>
            <div class="ff"><span class="ff-v">${num2.format(FUND.runningCost)} %</span><span class="ff-k">Laufende Fondskosten</span></div>
          </div>
          <div class="fund-perf">
            <div class="fp-title"><span>Historische Wertentwicklung</span><span class="fp-cap">Anteilswert, netto</span></div>
            ${perfBars()}
          </div>
          <div class="fund-note"><sup>*</sup> Öffentliche Wertentwicklung seit Auflegung ${FUND.sinceDate} laut Debeka · Stand: <span id="fundStand">${FUND.updatedAt}</span>. Vergangene Wertentwicklung ist keine Garantie für die Zukunft.</div>
        </section>

        <section class="card hero" aria-label="Ergebnis">
          <div class="panel">
            <div class="hero-grid">
              <div class="hero-mini">
                <div>
                  <div class="hero-label">Eingezahlt gesamt</div>
                  <div class="amount" id="rContrib">–</div>
                </div>
                <div>
                  <div class="hero-label">Brutto-Endvermögen</div>
                  <div class="amount" id="rBrutto">–</div>
                </div>
                <div>
                  <div class="hero-label">− Steuern bei Auszahlung</div>
                  <div class="amount neg" id="rTax">–</div>
                </div>
              </div>
              <div class="hero-sep"></div>
              <div class="hero-big">
                <div class="hero-label">Netto-Endvermögen mit <span id="rAge">67</span></div>
                <div class="amount" id="rNetto">–</div>
                <div class="sub" id="rGain">–</div>
              </div>
            </div>
          </div>
        </section>

        <div class="tiles">
          <div class="tile accent-blue">
            <div class="k"><span class="dot" style="background:var(--blue-500)"></span>Eigenleistung</div>
            <div class="v" id="tContrib">–</div>
          </div>
          <div class="tile accent-teal">
            <div class="k"><span class="dot" style="background:var(--green-500)"></span>Kursgewinn</div>
            <div class="v" id="tGain">–</div>
          </div>
          <div class="tile accent-amber">
            <div class="k"><span class="dot" style="background:var(--green-500)"></span>Zinseszins-Anteil</div>
            <div class="v" id="tRatio">–</div>
          </div>
          <div class="tile accent-rose">
            <div class="k"><span class="dot" style="background:var(--green-500)"></span>Effektive Rendite</div>
            <div class="v" id="tEff">–</div>
          </div>
        </div>

        <div class="meta-strip">
          <div class="ms"><span class="ms-k">Kombination</span><span class="ms-v">Chance Invest</span></div>
          <div class="ms"><span class="ms-k">Rentenbeginn</span><span class="ms-v"><span id="mRb">67</span> J.</span></div>
          <div class="ms"><span class="ms-k">Aufschubzeit</span><span class="ms-v"><span id="mAuf">–</span> J.</span></div>
          <div class="ms"><span class="ms-k">Beitragsdauer</span><span class="ms-v"><span id="mBd">–</span> J.</span></div>
          <div class="ms"><span class="ms-k">Rentengarantiezeit</span><span class="ms-v" id="mGz">–</span></div>
        </div>

        <!-- Chart -->
        <section class="card panel chart-card" aria-label="Vermögensentwicklung">
          <div class="chart-head">
            <h3>Vermögensentwicklung bis zur Rente</h3>
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div class="legend">
                <span class="item"><span class="swatch" style="background:var(--blue-500)"></span>Einzahlungen</span>
                <span class="item"><span class="swatch" style="background:var(--green-500)"></span>Kursgewinn</span>
                <span class="item"><span class="swatch" style="background:var(--text-3);opacity:.7"></span>Kaufkraft</span>
              </div>
              <button class="pill-btn" id="realBtn" type="button">Kaufkraft anzeigen</button>
            </div>
          </div>
          <div class="chart-wrap" id="chartWrap">
            <svg class="chart" id="chart" viewBox="0 0 760 340" preserveAspectRatio="none" role="img" aria-label="Diagramm der Vermögensentwicklung"></svg>
            <div class="tooltip" id="tip"></div>
          </div>
        </section>

        <!-- Entnahme + Erklärung -->
        <div class="split">
          <section class="card panel pension" aria-label="Optionen bei Rentenbeginn">
            <div class="section-title">Deine Wahl bei Rentenbeginn mit <span id="pAge">67</span></div>
            <div class="opt-grid">
              <div class="opt">
                <div class="opt-k">Lebenslange Rente · garantierter Rentenfaktor</div>
                <div class="opt-v big" id="pLebens">–</div>
                <div class="opt-sub" id="pLebensSub">–</div>
              </div>
              <div class="opt">
                <div class="opt-k">… oder Kapitalabfindung inkl. Fondsguthaben</div>
                <div class="opt-v" id="pKapital">–</div>
                <div class="opt-sub" id="pKapitalSub">–</div>
              </div>
              <div class="opt">
                <div class="opt-k">Alternativ: Kapitalverzehr über <span id="pJahre">25</span> Jahre</div>
                <div class="opt-v" id="pRente">–</div>
                <div class="opt-sub" id="pRenteSub">–</div>
              </div>
              <div class="opt hide" id="pSteigBox">
                <div class="opt-k">Steigende Rente · Startbetrag</div>
                <div class="opt-v" id="pSteig">–</div>
                <div class="opt-sub" id="pSteigSub">–</div>
              </div>
            </div>
            <div class="field-hint" id="pGar" style="margin-top:12px"></div>
            <div class="field-hint" id="pTod" style="margin-top:6px"></div>
          </section>

          <section class="card panel explain">
            <h3>So rechnen wir</h3>
            <ul>
              <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Monatliche Verzinsung mit <b id="eEff">–</b> effektiver Rendite (Rendite minus Fonds- und Policenkosten).</span></li>
              <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Steuer auf den Gewinn: 26,375 % Abgeltungsteuer, gemindert um die Teilfreistellung.</span></li>
              <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Die effektive Rendite berücksichtigt bereits die Fonds- und Policenkosten.</span></li>
            </ul>
            <div class="note">
              Modell auf Basis Tarif ${POLICY.tarif} (Bedingungen ${POLICY.bedingungen}):
              lebenslange Rente über den garantierten Rentenfaktor, Policenkosten als
              Effektivkosten. Unabhängige, unverbindliche Modellrechnung – keine Anlage- oder
              Steuerberatung und kein Angebot der Debeka. Maßgeblich sind die Bedingungen und dein
              persönliches Angebot; Erträge schwanken, vergangene Wertentwicklungen sind kein
              Indikator für die Zukunft. Sparer-Pauschbetrag (1.000 €) und individuelle
              Steuermerkmale sind nicht berücksichtigt.
            </div>
          </section>
        </div>

        <div class="footer">Rechner für den Debeka Global Shares · Fondsdaten der Debeka · unabhängige Modellrechnung, kein Angebot der Debeka.</div>
      </div>
    </div>
  </div>`;
}

/* Horizontale Balken der öffentlichen Fonds-Wertentwicklung. */
function perfBars() {
  const max = Math.max(...FUND.perf.map((p) => p.v));
  return FUND.perf.map((p) => {
    const w = (p.v / max);
    return `<div class="perf-row"><span class="pr-lab">${p.label}</span>` +
      `<span class="pr-bar"><i style="--w:${w.toFixed(3)}"></i></span>` +
      `<span class="pr-val">+${num2.format(p.v)} %</span></div>`;
  }).join("");
}

function field(label, key, unit, tip, kind) {
  return `
  <div class="field">
    <div class="field-label">${label} <i class="info" data-tip="${tip}"></i></div>
    <div class="input-shell">
      <input id="in_${key}" inputmode="${kind === "int" ? "numeric" : "decimal"}" data-key="${key}" data-kind="${kind}" aria-label="${label}" />
      <span class="unit">${unit}</span>
    </div>
  </div>`;
}

function selectField(label, key, tip, opts) {
  const o = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  return `
  <div class="field">
    <div class="field-label">${label} <i class="info" data-tip="${tip}"></i></div>
    <select class="sel" id="in_${key}" data-key="${key}" data-kind="select" aria-label="${label}">${o}</select>
  </div>`;
}

function slider(label, key, min, max, step, unit, tip) {
  return `
  <div class="field">
    <div class="slider-head">
      <div class="field-label" style="margin:0">${label} <i class="info" data-tip="${tip}"></i></div>
      <span class="slider-val" id="lbl_${key}"></span>
    </div>
    <input type="range" id="in_${key}" data-key="${key}" data-kind="range" data-unit="${unit}" min="${min}" max="${max}" step="${step}" aria-label="${label}" />
  </div>`;
}

/* ============================ Rendering ============================== */
let R = null;
const anim = {}; // laufende Count-up-Animationen je Element-ID

function refreshInputs() {
  document.querySelectorAll("[data-key]").forEach((el) => {
    const k = el.dataset.key, kind = el.dataset.kind;
    if (kind === "range") {
      el.value = state[k];
      const pos = (state[k] - el.min) / (el.max - el.min) * 100;
      el.style.setProperty("--fill", pos + "%");
      const unit = el.dataset.unit;
      const disp = Number.isInteger(state[k]) ? state[k] : num1.format(state[k]);
      document.getElementById("lbl_" + k).textContent =
        unit === "%" ? disp + " %" : disp + " " + unit;
    } else if (kind === "select") {
      el.value = String(state[k]);
    } else if (document.activeElement !== el) {
      el.value = new Intl.NumberFormat("de-DE").format(state[k]);
    }
  });
  document.querySelectorAll("#renditePreset button").forEach((b) => {
    b.setAttribute("aria-pressed", String(Math.abs(parseFloat(b.dataset.v) - state.rendite) < 0.001));
  });
}

function render(animate) {
  R = compute(state);
  refreshInputs();

  setMoney("rContrib", R.contributed, animate);
  setMoney("rBrutto", R.brutto, animate);
  setText("rTax", "−" + money(R.steuer));
  setMoney("rNetto", R.netto, animate);
  setText("rAge", state.rentenalter);
  const gainEl = document.getElementById("rGain");
  if (gainEl) gainEl.innerHTML = `Davon <b style="color:#86efac">${money(R.gewinn)}</b> Gewinn – dein Geld arbeitet für dich.`;

  setText("tContrib", money(R.contributed));
  setText("tGain", money(R.gewinn));
  const ratio = R.brutto > 0 ? (R.gewinn / R.brutto) * 100 : 0;
  setText("tRatio", pct1(ratio));
  setText("tEff", pct1(R.effAnnual));

  // Vertrags-Eckdaten
  setText("mRb", state.rentenalter);
  setText("mAuf", R.years);
  setText("mBd", R.beitragsJahre);
  setText("mGz", state.garantiezeit > 0 ? state.garantiezeit + " J." : "keine");

  // Optionen bei Rentenbeginn
  setText("pAge", state.rentenalter);
  setText("pLebens", money(R.lebensrente) + " / Monat");
  setText("pLebensSub", `garantiert lebenslang · Rentenfaktor ${state.rentenfaktor} € je 10.000 € (aus dem Angebot)`);
  setText("pKapital", money(R.brutto));
  setText("pKapitalSub", `netto nach Steuer: ${money(R.netto)}`);
  setText("pJahre", state.entnahmeJahre);
  setText("pRente", money(R.monatsrente) + " / Monat");
  setText("pRenteSub", `Kapital in ${state.entnahmeJahre} Jahren aufgebraucht · ${pct1(state.renditeRente)} Restrendite`);
  const steigBox = document.getElementById("pSteigBox");
  if (state.rentensteigerung > 0) {
    steigBox.classList.remove("hide");
    setText("pSteig", money(R.steigStart) + " / Monat");
    setText("pSteigSub", `Start – steigt +${state.rentensteigerung} % pro Jahr`);
  } else {
    steigBox.classList.add("hide");
  }
  setText("pGar", "Garantierente & garantierte Kapitalabfindung: keine – „Chance Invest“ ist die volle Fondsanlage ohne Beitragsgarantie.");
  setText("pTod", "Todesfall vor Rentenbeginn: das aktuelle Fondsguthaben geht an die Hinterbliebenen (§ 35).");

  setText("eEff", pct1(R.effAnnual));

  drawChart();
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

/* Weiche Count-up-Animation für die großen Ergebniszahlen. */
function setMoney(id, target, animate) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!animate || reduceMotion) { el.textContent = money(target); return; }
  if (anim[id]) cancelAnimationFrame(anim[id].raf);
  const from = anim[id] ? anim[id].cur : target * 0.82;
  const start = performance.now(), dur = 480;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    const cur = from + (target - from) * e;
    el.textContent = money(cur);
    anim[id] = { cur, raf: t < 1 ? requestAnimationFrame(tick) : 0 };
  };
  anim[id] = { cur: from, raf: requestAnimationFrame(tick) };
}

/* ============================ Chart ================================= */
const CW = 760, CH = 340, PAD_L = 8, PAD_R = 8, PAD_T = 22, PAD_B = 30;

function niceMax(v) {
  if (v <= 0) return 1000;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  for (const s of steps) if (s * pow >= v) return s * pow;
  return 10 * pow;
}

function drawChart() {
  const svg = document.getElementById("chart");
  const s = R.series;
  const useReal = state.realView;

  const balArr = s.map((p) => (useReal ? p.real : p.balance));
  const conArr = s.map((p) => Math.min(p.contributed, useReal ? p.real : p.balance));
  const maxY = niceMax(Math.max(...balArr) * 1.08);
  const n = s.length;

  const x = (i) => PAD_L + (i / Math.max(1, n - 1)) * (CW - PAD_L - PAD_R);
  const y = (v) => PAD_T + (1 - v / maxY) * (CH - PAD_T - PAD_B);

  const lineTo = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const areaFill = (arr) => lineTo(arr) + `L${x(n - 1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;

  let grid = "", ylabels = "";
  const ticks = 4;
  for (let t = 0; t <= ticks; t++) {
    const val = (maxY / ticks) * t;
    const yy = y(val).toFixed(1);
    grid += `<line x1="${PAD_L}" y1="${yy}" x2="${CW - PAD_R}" y2="${yy}" class="gline"/>`;
    ylabels += `<text x="${PAD_L + 2}" y="${(+yy - 5).toFixed(1)}" class="ylab">${compactEur(val)}</text>`;
  }

  let xlabels = "";
  const step = Math.max(1, Math.round((n - 1) / 6));
  for (let i = 0; i < n; i += step) {
    xlabels += `<text x="${x(i).toFixed(1)}" y="${CH - 8}" class="xlab" text-anchor="middle">${s[i].age}</text>`;
  }
  const lastI = n - 1;
  xlabels += `<text x="${x(lastI).toFixed(1)}" y="${CH - 8}" class="xlab" text-anchor="end">${s[lastI].age}</text>`;

  // Endpunkt-Label
  const endV = balArr[lastI], endX = x(lastI), endY = y(endV);
  const labY = Math.max(PAD_T + 8, endY - 12);
  const endLabel = `
    <g class="end-marker">
      <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="4.5" fill="var(--green-500)" stroke="var(--card)" stroke-width="2"/>
      <rect x="${(endX - 78).toFixed(1)}" y="${(labY - 14).toFixed(1)}" width="74" height="19" rx="6" fill="var(--green-600)"/>
      <text x="${(endX - 41).toFixed(1)}" y="${(labY - 0.5).toFixed(1)}" text-anchor="middle" class="end-text">${compactEur(endV)}</text>
    </g>`;

  const drawAnim = reduceMotion ? "" : `<style>
    @keyframes dash { to { stroke-dashoffset: 0; } }
    .balStroke, .conStroke { stroke-dasharray: 2600; stroke-dashoffset: 2600; animation: dash 1.1s ease-out forwards; }
    .end-marker { animation: fade .5s ease .9s both; } @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
  </style>`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="gGain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--green-500)" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="var(--green-500)" stop-opacity="0.04"/>
      </linearGradient>
      <linearGradient id="gCon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--blue-500)" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="var(--blue-500)" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    <style>
      .gline{stroke:var(--border);stroke-width:1;stroke-dasharray:3 5;}
      .ylab,.xlab{fill:var(--text-3);font-size:11px;font-weight:600;font-family:var(--font);}
      .balStroke{stroke:var(--green-500);stroke-width:3;fill:none;stroke-linejoin:round;stroke-linecap:round;}
      .conStroke{stroke:var(--blue-500);stroke-width:2.5;fill:none;stroke-linejoin:round;stroke-linecap:round;}
      .end-text{fill:#fff;font-size:11px;font-weight:800;font-family:var(--font);}
    </style>
    ${drawAnim}
    ${grid}
    <path d="${areaFill(balArr)}" fill="url(#gGain)"/>
    <path d="${areaFill(conArr)}" fill="url(#gCon)"/>
    <path d="${lineTo(balArr)}" class="balStroke"/>
    <path d="${lineTo(conArr)}" class="conStroke"/>
    ${ylabels}${xlabels}${endLabel}
    <g id="hoverG" style="opacity:0">
      <line id="hLine" y1="${PAD_T}" y2="${CH - PAD_B}" stroke="var(--text-3)" stroke-width="1" stroke-dasharray="3 3"/>
      <circle id="hBal" r="5.5" fill="var(--green-500)" stroke="var(--card)" stroke-width="2.5"/>
      <circle id="hCon" r="5" fill="var(--blue-500)" stroke="var(--card)" stroke-width="2.5"/>
    </g>
    <rect id="hitbox" x="0" y="0" width="${CW}" height="${CH}" fill="transparent" style="cursor:crosshair"/>
  `;

  attachHover(svg, s, x, y, useReal);
}

function compactEur(v) {
  if (v >= 1e6) return num1.format(v / 1e6).replace(",0", "") + " Mio";
  if (v >= 1000) return Math.round(v / 1000) + "k €";
  return Math.round(v) + " €";
}

function attachHover(svg, s, x, y, useReal) {
  const wrap = document.getElementById("chartWrap");
  const tip = document.getElementById("tip");
  const g = document.getElementById("hoverG");
  const hLine = document.getElementById("hLine");
  const hBal = document.getElementById("hBal");
  const hCon = document.getElementById("hCon");
  const hit = document.getElementById("hitbox");
  const n = s.length;

  function move(ev) {
    const rect = svg.getBoundingClientRect();
    const px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left) / rect.width * CW;
    let i = Math.round(((px - PAD_L) / (CW - PAD_L - PAD_R)) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    const p = s[i];
    const bal = useReal ? p.real : p.balance;
    const con = Math.min(p.contributed, bal);
    const xx = x(i);

    g.style.opacity = "1";
    hLine.setAttribute("x1", xx); hLine.setAttribute("x2", xx);
    hBal.setAttribute("cx", xx); hBal.setAttribute("cy", y(bal));
    hCon.setAttribute("cx", xx); hCon.setAttribute("cy", y(con));

    const gain = Math.max(0, bal - p.contributed);
    tip.innerHTML = `
      <div class="t-age">Alter ${p.age} · in ${p.year} Jahr${p.year === 1 ? "" : "en"}</div>
      <div class="t-row"><span class="lab"><span class="swatch" style="background:var(--green-500)"></span>${useReal ? "Kaufkraft" : "Gesamt"}</span><span class="val">${money(bal)}</span></div>
      <div class="t-row"><span class="lab"><span class="swatch" style="background:var(--blue-500)"></span>Eingezahlt</span><span class="val">${money(p.contributed)}</span></div>
      <div class="t-row"><span class="lab"><span class="swatch" style="background:var(--green-500)"></span>Gewinn</span><span class="val">${money(gain)}</span></div>`;

    const wpx = (xx / CW) * wrap.clientWidth;
    const topPx = (y(bal) / CH) * wrap.clientHeight;
    tip.style.opacity = "1";
    const half = tip.offsetWidth / 2;
    const left = Math.max(half + 4, Math.min(wrap.clientWidth - half - 4, wpx));
    tip.style.left = left + "px";
    tip.style.top = Math.max(tip.offsetHeight + 8, topPx - 12) + "px";
  }
  function leave() { g.style.opacity = "0"; tip.style.opacity = "0"; }

  hit.addEventListener("mousemove", move);
  hit.addEventListener("mouseleave", leave);
  hit.addEventListener("touchstart", move, { passive: true });
  hit.addEventListener("touchmove", move, { passive: true });
  hit.addEventListener("touchend", leave);
}

/* ============================ Events ================================ */
function parseNum(str) {
  const cleaned = String(str).replace(/\./g, "").replace(/[^0-9,\-]/g, "").replace(",", ".");
  const v = parseFloat(cleaned);
  return isNaN(v) ? 0 : v;
}

const LIMITS = {
  startkapital: [0, 10000000], sparrate: [0, 100000], dynamik: [0, 10],
  alter: [0, 85], rentenalter: [30, 90], rendite: [1, 12], ter: [0, 2],
  policy: [0, 4], inflation: [0, 5], entnahmeJahre: [5, 40], renditeRente: [0, 7],
  rentenfaktor: [10, 50],
};
function clamp(k, v) { const [lo, hi] = LIMITS[k] || [-Infinity, Infinity]; return Math.min(hi, Math.max(lo, v)); }

function bind() {
  const app = document.getElementById("app");

  app.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.key) return;
    const k = el.dataset.key, kind = el.dataset.kind;
    if (kind === "range") {
      state[k] = clamp(k, parseFloat(el.value));
      render(false);
    } else if (kind === "select") {
      state[k] = parseFloat(el.value);
      render(true);
    } else {
      let v = parseNum(el.value);
      if (kind === "int") v = Math.round(v);
      state[k] = v;
      render(false);
    }
  });

  app.addEventListener("blur", (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.key && el.dataset.kind !== "range") {
      state[el.dataset.key] = clamp(el.dataset.key, state[el.dataset.key]);
      if (el.dataset.key === "alter" || el.dataset.key === "rentenalter") {
        if (state.rentenalter <= state.alter) state.rentenalter = state.alter + 1;
      }
      render(true);
    }
  }, true);

  document.getElementById("renditePreset").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    state.rendite = clamp("rendite", parseFloat(b.dataset.v)); render(true);
  });

  document.getElementById("realBtn").addEventListener("click", (e) => {
    state.realView = !state.realView;
    e.currentTarget.textContent = state.realView ? "Nominal anzeigen" : "Kaufkraft anzeigen";
    e.currentTarget.classList.toggle("active", state.realView);
    drawChart();
  });

  document.getElementById("themeBtn").addEventListener("click", toggleTheme);
  window.addEventListener("resize", () => R && drawChart());
}

/* ============================ Theme ================================= */
const sun = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 1v3M12 20v3M4.2 4.2l2 2M17.8 17.8l2 2M1 12h3M20 12h3M4.2 19.8l2-2M17.8 6.2l2-2"/></svg>`;
const moon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;

function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("themeIcon").innerHTML = t === "dark" ? sun : moon;
  document.getElementById("themeTxt").textContent = t === "dark" ? "Hell" : "Dunkel";
  try { localStorage.setItem("av-theme", t); } catch (e) {}
  if (R) drawChart();
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(cur === "dark" ? "light" : "dark");
}

/* ============================ Init ================================= */
/* Lädt die aktuellen Fondszahlen aus fund-data.json (auf GitHub Pages / eigenem
   Server). Offline oder in der Artifact-Vorschau (CSP) schlägt der Abruf fehl –
   dann bleiben die oben eingebauten Werte stehen. */
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
  await loadFundData();
  state.ter = FUND.runningCost;   // Fondskosten-Default aus (evtl.) aktuellen Daten
  document.getElementById("app").innerHTML = shell();
  bind();
  let t = "light";
  try {
    t = localStorage.getItem("av-theme")
      || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } catch (e) {}
  applyTheme(t);
  render(true);
}

init();
