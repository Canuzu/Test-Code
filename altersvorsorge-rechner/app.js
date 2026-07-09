/* =========================================================================
   Altersvorsorge-Rechner  ·  Vanilla JS, keine Abhängigkeiten
   -------------------------------------------------------------------------
   Rechenmodell (monatliche Verzinsung):
     · effektive Rendite p.a. = erwartete Rendite − laufende Kosten (TER)
     · Sparrate kann jährlich dynamisch steigen (z. B. Inflationsausgleich)
     · Steuer bei Auszahlung: Abgeltungsteuer 25 % + Soli = 26,375 % auf den
       Kursgewinn, gemindert um die Teilfreistellung je Fondstyp
     · reale Kaufkraft = Netto-Endvermögen / (1 + Inflation)^Jahre
     · Entnahmephase: nachschüssige Rentenformel über die gewünschte Dauer
   ========================================================================= */

const SOLI = 1.055;           // Solidaritätszuschlag auf die Abgeltungsteuer
const ABGELT = 0.25;          // Abgeltungsteuersatz
const TAX_RATE = ABGELT * SOLI; // = 0,26375

const TEILFREISTELLUNG = { aktien: 0.30, misch: 0.15, none: 0.0 };

/* ---------------------------- State ---------------------------------- */
const state = {
  startkapital: 5000,
  sparrate: 200,
  dynamik: 2,          // jährliche Erhöhung der Sparrate in %
  alter: 34,
  rentenalter: 67,
  rendite: 6,          // erwartete Rendite p.a. in %
  ter: 0.2,            // laufende Kosten in %
  inflation: 2,
  fondstyp: "aktien",
  entnahmeJahre: 25,
  renditeRente: 3,     // Rendite während der Entnahmephase in %
  realView: false,     // Chart: Kaufkraft (inflationsbereinigt) statt nominal
};

/* --------------------------- Formatting ------------------------------ */
const eur0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct1 = (v) => num1.format(v) + " %";
const money = (v) => eur0.format(Math.round(v));

/* ------------------------- Kernberechnung ---------------------------- */
function compute(s) {
  const years = Math.max(0, Math.round(s.rentenalter - s.alter));
  const effAnnual = (s.rendite - s.ter) / 100;          // effektive Rendite p.a.
  const rMonth = Math.pow(1 + effAnnual, 1 / 12) - 1;    // Monatszins

  let balance = s.startkapital;
  let contributed = s.startkapital;
  let monthly = s.sparrate;

  // Reihen für den Chart: Startpunkt (Jahr 0 = heutiges Alter)
  const series = [{
    age: s.alter, year: 0,
    contributed, balance,
    real: balance,
  }];

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + rMonth) + monthly;
      contributed += monthly;
    }
    const real = balance / Math.pow(1 + s.inflation / 100, y);
    series.push({ age: s.alter + y, year: y, contributed, balance, real });
    monthly *= 1 + s.dynamik / 100; // Dynamik greift ab dem Folgejahr
  }

  const brutto = balance;
  const gewinn = Math.max(0, brutto - contributed);
  const tf = TEILFREISTELLUNG[s.fondstyp] ?? 0;
  const steuerpflichtig = gewinn * (1 - tf);
  const steuer = steuerpflichtig * TAX_RATE;
  const netto = brutto - steuer;
  const effTaxPct = gewinn > 0 ? (steuer / gewinn) * 100 : 0;

  const realFactor = Math.pow(1 + s.inflation / 100, years);
  const kaufkraft = netto / realFactor;

  // Entnahmephase: welche konstante Monatsrente lässt sich aus dem
  // Netto-Kapital über die gewünschte Dauer entnehmen? (nachschüssig)
  const nMonths = Math.max(1, Math.round(s.entnahmeJahre * 12));
  const rR = Math.pow(1 + s.renditeRente / 100, 1 / 12) - 1;
  let monatsrente;
  if (Math.abs(rR) < 1e-9) monatsrente = netto / nMonths;
  else monatsrente = (netto * rR) / (1 - Math.pow(1 + rR, -nMonths));
  const monatsrenteReal = monatsrente / realFactor;

  return {
    years, effAnnual: effAnnual * 100, effRealReturn: (effAnnual * 100 - s.inflation),
    series, brutto, contributed, gewinn, steuer, netto, effTaxPct,
    kaufkraft, monatsrente, monatsrenteReal, nMonths,
  };
}

/* ============================ UI Markup ============================== */
function shell() {
  return `
  <div class="wrap">
    <header class="masthead">
      <div class="brand">
        <div class="brand-mark">
          <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 48 L26 32 L37 40 L54 16" fill="none" stroke="#ecfeff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="54" cy="16" r="5.5" fill="#fde68a"/></svg>
        </div>
        <div>
          <h1>Altersvorsorge-Rechner</h1>
          <p>Endvermögen, Steuern & Monatsrente – live berechnet</p>
        </div>
      </div>
      <button class="theme-toggle" id="themeBtn" type="button" aria-label="Design wechseln">
        <span id="themeIcon"></span><span id="themeTxt">Dunkel</span>
      </button>
    </header>

    <div class="grid">
      <!-- ======== Eingaben ======== -->
      <section class="card panel" aria-label="Eingaben">
        <div class="section-title">Deine Sparplan-Daten</div>

        ${field("Monatliche Sparrate", "sparrate", "€", "Der Betrag, den du jeden Monat automatisch investierst.", "money")}
        ${field("Startkapital", "startkapital", "€", "Einmalbetrag, mit dem du heute startest (optional).", "money")}

        ${slider("Jährliche Dynamik", "dynamik", 0, 8, 0.5, "%",
          "Um diesen Prozentsatz erhöhst du deine Sparrate jedes Jahr – z. B. zum Ausgleich von Gehalts- und Preissteigerungen.")}

        <div class="divider"></div>
        <div class="section-title">Zeit & Rendite</div>

        <div class="split" style="margin-top:0">
          ${field("Aktuelles Alter", "alter", "J.", "Dein heutiges Alter.", "int")}
          ${field("Renteneintritt", "rentenalter", "J.", "Alter, zu dem du das Kapital nutzen möchtest.", "int")}
        </div>

        ${slider("Erwartete Rendite p.a.", "rendite", 1, 10, 0.1, "%",
          "Langfristige durchschnittliche Wertentwicklung. Ein breit gestreuter Aktien-ETF lieferte historisch ca. 6–7 % pro Jahr.")}
        ${slider("Laufende Kosten (TER)", "ter", 0, 2, 0.05, "%",
          "Jährliche Fonds-/Depotkosten. Günstige ETFs liegen bei 0,1–0,3 %. Sie schmälern deine Rendite direkt.")}
        ${slider("Inflation p.a.", "inflation", 0, 5, 0.1, "%",
          "Erwartete jährliche Geldentwertung. Sie bestimmt, wie viel dein Vermögen später real wert ist.")}

        <div class="divider"></div>
        <div class="section-title">Steuern bei Auszahlung</div>
        <div class="field">
          <div class="field-label">Anlageform
            <i class="info" data-tip="Aktienfonds/-ETFs erhalten 30 % Teilfreistellung, Mischfonds 15 %. Das senkt die zu zahlende Steuer auf den Gewinn."></i>
          </div>
          <div class="seg" id="fondstyp" role="group" aria-label="Anlageform">
            <button type="button" data-v="aktien">Aktien-ETF</button>
            <button type="button" data-v="misch">Mischfonds</button>
            <button type="button" data-v="none">Sonstige</button>
          </div>
          <div class="field-hint" id="fondstypHint"></div>
        </div>

        <div class="divider"></div>
        <div class="section-title">Später: Entnahme in der Rente</div>
        ${slider("Auszahldauer", "entnahmeJahre", 5, 40, 1, "Jahre",
          "Über wie viele Jahre möchtest du dir das Kapital als monatliche Rente auszahlen lassen?")}
        ${slider("Rendite in der Rente", "renditeRente", 0, 7, 0.1, "%",
          "Das verbleibende Kapital wird während der Auszahlphase meist konservativer angelegt und wirft weiter Rendite ab.")}
      </section>

      <!-- ======== Ergebnisse ======== -->
      <div>
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
                <div class="badge-real">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Kaufkraft heute: <b id="rReal" style="margin-left:2px">–</b>
                </div>
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
            <div class="k"><span class="dot" style="background:var(--teal-500)"></span>Kursgewinn</div>
            <div class="v" id="tGain">–</div>
          </div>
          <div class="tile accent-amber">
            <div class="k"><span class="dot" style="background:var(--amber)"></span>Zinseszins-Anteil</div>
            <div class="v" id="tRatio">–</div>
          </div>
          <div class="tile accent-rose">
            <div class="k"><span class="dot" style="background:var(--rose)"></span>Effektive Rendite</div>
            <div class="v" id="tEff">–</div>
          </div>
        </div>

        <!-- Chart -->
        <section class="card panel chart-card" aria-label="Vermögensentwicklung">
          <div class="chart-head">
            <h3>Vermögensentwicklung bis zur Rente</h3>
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div class="legend">
                <span class="item"><span class="swatch" style="background:var(--blue-500)"></span>Einzahlungen</span>
                <span class="item"><span class="swatch" style="background:var(--teal-500)"></span>Kursgewinn</span>
                <span class="item"><span class="swatch" style="background:var(--text-3);opacity:.7"></span>Kaufkraft</span>
              </div>
              <button class="theme-toggle" id="realBtn" type="button" style="padding:7px 12px">Kaufkraft anzeigen</button>
            </div>
          </div>
          <div class="chart-wrap" id="chartWrap">
            <svg class="chart" id="chart" viewBox="0 0 760 340" preserveAspectRatio="none" role="img" aria-label="Diagramm der Vermögensentwicklung"></svg>
            <div class="tooltip" id="tip"></div>
          </div>
        </section>

        <!-- Entnahme + Erklärung -->
        <div class="split">
          <section class="card panel pension" aria-label="Monatsrente">
            <div class="section-title">Deine mögliche Monatsrente</div>
            <div class="big" id="pRente">–</div>
            <div class="cap" id="pReal">–</div>
            <div class="cap" id="pDesc" style="margin-top:12px"></div>
          </section>

          <section class="card panel explain">
            <h3>So rechnen wir</h3>
            <ul>
              <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Monatliche Verzinsung mit <b id="eEff">–</b> effektiver Rendite (Rendite minus Kosten).</span></li>
              <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Steuer auf den Gewinn: 26,375 % Abgeltungsteuer, gemindert um die Teilfreistellung.</span></li>
              <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Kaufkraft heute = Netto ÷ Inflation über <b id="eYears">–</b> Jahre.</span></li>
            </ul>
            <div class="note">
              Unverbindliche Modellrechnung, keine Anlage- oder Steuerberatung. Erträge von
              Kapitalanlagen schwanken; vergangene Wertentwicklungen sind kein Indikator für die
              Zukunft. Sparer-Pauschbetrag (1.000 €) und individuelle Steuermerkmale sind nicht
              berücksichtigt.
            </div>
          </section>
        </div>

        <div class="footer">Erstellt als kundenorientierter Vorsorge-Rechner · läuft komplett offline im Browser.</div>
      </div>
    </div>
  </div>`;
}

function field(label, key, unit, tip, kind) {
  return `
  <div class="field">
    <div class="field-label">${label} <i class="info" data-tip="${tip}"></i></div>
    <div class="input-shell">
      <input id="in_${key}" inputmode="${kind === "int" ? "numeric" : "decimal"}" data-key="${key}" data-kind="${kind}" />
      <span class="unit">${unit}</span>
    </div>
  </div>`;
}

function slider(label, key, min, max, step, unit, tip) {
  return `
  <div class="field">
    <div class="slider-head">
      <div class="field-label" style="margin:0">${label} <i class="info" data-tip="${tip}"></i></div>
      <span class="slider-val" id="lbl_${key}"></span>
    </div>
    <input type="range" id="in_${key}" data-key="${key}" data-kind="range" data-unit="${unit}" min="${min}" max="${max}" step="${step}" />
  </div>`;
}

/* ============================ Rendering ============================== */
let R = null; // last computed result (for chart interaction)

function refreshInputs() {
  document.querySelectorAll("input[data-key]").forEach((el) => {
    const k = el.dataset.key;
    if (el.dataset.kind === "range") {
      el.value = state[k];
      const unit = el.dataset.unit;
      const disp = Number.isInteger(state[k]) ? state[k] : num1.format(state[k]);
      document.getElementById("lbl_" + k).textContent =
        unit === "%" ? disp + " %" : disp + " " + unit;
    } else if (document.activeElement !== el) {
      el.value = new Intl.NumberFormat("de-DE").format(state[k]);
    }
  });
  document.querySelectorAll("#fondstyp button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.v === state.fondstyp));
  });
  const hints = {
    aktien: "Aktien-ETF/-fonds · 30 % Teilfreistellung → effektiv ~18,5 % Steuer auf den Gewinn.",
    misch: "Mischfonds · 15 % Teilfreistellung → effektiv ~22,4 % Steuer auf den Gewinn.",
    none: "Ohne Teilfreistellung · volle 26,375 % Steuer auf den Gewinn.",
  };
  document.getElementById("fondstypHint").textContent = hints[state.fondstyp];
}

function render() {
  R = compute(state);
  refreshInputs();

  setText("rContrib", money(R.contributed));
  setText("rBrutto", money(R.brutto));
  setText("rTax", "−" + money(R.steuer));
  setText("rNetto", money(R.netto));
  setText("rAge", state.rentenalter);
  setText("rGain", `Davon ${money(R.gewinn)} Gewinn – dein Geld hat für dich gearbeitet.`);
  setText("rReal", money(R.kaufkraft));

  setText("tContrib", money(R.contributed));
  setText("tGain", money(R.gewinn));
  const ratio = R.brutto > 0 ? (R.gewinn / R.brutto) * 100 : 0;
  setText("tRatio", pct1(ratio));
  setText("tEff", pct1(R.effAnnual));

  setText("pRente", money(R.monatsrente) + " / Monat");
  setText("pReal", `Kaufkraft heute: ${money(R.monatsrenteReal)} pro Monat`);
  setText("pDesc", `Dein Netto-Kapital von ${money(R.netto)} über ${state.entnahmeJahre} Jahre ausgezahlt, bei ${pct1(state.renditeRente)} Restrendite. Danach ist das Kapital aufgebraucht.`);

  setText("eEff", pct1(R.effAnnual));
  setText("eYears", R.years);

  drawChart();
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

/* ============================ Chart ================================= */
const CW = 760, CH = 340, PAD_L = 8, PAD_R = 8, PAD_T = 18, PAD_B = 30;

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

  const topVals = s.map((p) => (useReal ? p.real : p.balance));
  const maxY = niceMax(Math.max(...topVals) * 1.08);
  const n = s.length;

  const x = (i) => PAD_L + (i / Math.max(1, n - 1)) * (CW - PAD_L - PAD_R);
  const y = (v) => PAD_T + (1 - v / maxY) * (CH - PAD_T - PAD_B);

  // Areas: contributions (bottom) + gains band up to balance
  const balArr = s.map((p) => (useReal ? p.real : p.balance));
  const conArr = s.map((p) => Math.min(p.contributed, useReal ? p.real : p.balance));

  const lineTo = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const areaFill = (arr) => {
    let d = arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    d += `L${x(n - 1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;
    return d;
  };

  // Gridlines + Y labels
  let grid = "", ylabels = "";
  const ticks = 4;
  for (let t = 0; t <= ticks; t++) {
    const val = (maxY / ticks) * t;
    const yy = y(val).toFixed(1);
    grid += `<line x1="${PAD_L}" y1="${yy}" x2="${CW - PAD_R}" y2="${yy}" class="gline"/>`;
    ylabels += `<text x="${PAD_L + 2}" y="${(+yy - 5).toFixed(1)}" class="ylab">${compactEur(val)}</text>`;
  }

  // X labels (ages)
  let xlabels = "";
  const step = Math.max(1, Math.round((n - 1) / 6));
  for (let i = 0; i < n; i += step) {
    xlabels += `<text x="${x(i).toFixed(1)}" y="${CH - 8}" class="xlab" text-anchor="middle">${s[i].age}</text>`;
  }
  const lastI = n - 1;
  xlabels += `<text x="${x(lastI).toFixed(1)}" y="${CH - 8}" class="xlab xlab-end" text-anchor="end">${s[lastI].age}</text>`;

  const balLine = lineTo(balArr);
  const conLine = lineTo(conArr);

  svg.innerHTML = `
    <defs>
      <linearGradient id="gGain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--teal-400)" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="var(--teal-400)" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="gCon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--blue-500)" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="var(--blue-500)" stop-opacity="0.06"/>
      </linearGradient>
    </defs>
    <style>
      .gline{stroke:var(--border);stroke-width:1;stroke-dasharray:3 5;}
      .ylab{fill:var(--text-3);font-size:11px;font-weight:600;font-family:var(--font);}
      .xlab{fill:var(--text-3);font-size:11px;font-weight:600;font-family:var(--font);}
      .balStroke{stroke:var(--teal-500);stroke-width:3;fill:none;stroke-linejoin:round;stroke-linecap:round;}
      .conStroke{stroke:var(--blue-500);stroke-width:2.5;fill:none;stroke-linejoin:round;stroke-linecap:round;}
    </style>
    ${grid}
    <path d="${areaFill(balArr)}" fill="url(#gGain)"/>
    <path d="${areaFill(conArr)}" fill="url(#gCon)"/>
    <path d="${balLine}" class="balStroke"/>
    <path d="${conLine}" class="conStroke"/>
    ${ylabels}${xlabels}
    <g id="hoverG" style="opacity:0">
      <line id="hLine" y1="${PAD_T}" y2="${CH - PAD_B}" stroke="var(--text-3)" stroke-width="1" stroke-dasharray="3 3"/>
      <circle id="hBal" r="5.5" fill="var(--teal-500)" stroke="var(--card)" stroke-width="2.5"/>
      <circle id="hCon" r="5" fill="var(--blue-500)" stroke="var(--card)" stroke-width="2.5"/>
    </g>
    <rect id="hitbox" x="0" y="0" width="${CW}" height="${CH}" fill="transparent" style="cursor:crosshair"/>
  `;

  attachHover(svg, s, x, y, useReal, maxY);
}

function compactEur(v) {
  if (v >= 1e6) return num1.format(v / 1e6).replace(",0", "") + " Mio";
  if (v >= 1000) return Math.round(v / 1000) + "k €";
  return Math.round(v) + " €";
}

function attachHover(svg, s, x, y, useReal, maxY) {
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
      <div class="t-row"><span class="lab"><span class="swatch" style="background:var(--teal-500)"></span>${useReal ? "Kaufkraft" : "Gesamt"}</span><span class="val">${money(bal)}</span></div>
      <div class="t-row"><span class="lab"><span class="swatch" style="background:var(--blue-500)"></span>Eingezahlt</span><span class="val">${money(p.contributed)}</span></div>
      <div class="t-row"><span class="lab"><span class="swatch" style="background:var(--teal-300)"></span>Gewinn</span><span class="val">${money(gain)}</span></div>`;

    // Position tooltip within the wrapper
    const wpx = (xx / CW) * wrap.clientWidth;
    const topPx = (y(bal) / CH) * wrap.clientHeight;
    tip.style.opacity = "1";
    let left = wpx;
    const half = tip.offsetWidth / 2;
    left = Math.max(half + 4, Math.min(wrap.clientWidth - half - 4, left));
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
  startkapital: [0, 10_000_000], sparrate: [0, 100_000], dynamik: [0, 8],
  alter: [16, 80], rentenalter: [30, 90], rendite: [1, 10], ter: [0, 2],
  inflation: [0, 5], entnahmeJahre: [5, 40], renditeRente: [0, 7],
};
function clamp(k, v) { const [lo, hi] = LIMITS[k] || [-Infinity, Infinity]; return Math.min(hi, Math.max(lo, v)); }

function bind() {
  document.getElementById("app").addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.key) return;
    const k = el.dataset.key;
    if (el.dataset.kind === "range") {
      state[k] = clamp(k, parseFloat(el.value));
    } else {
      let v = parseNum(el.value);
      if (el.dataset.kind === "int") v = Math.round(v);
      state[k] = v; // clamp on blur to allow typing
    }
    render();
  });

  // clamp text fields on blur
  document.getElementById("app").addEventListener("blur", (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.key && el.dataset.kind !== "range") {
      state[el.dataset.key] = clamp(el.dataset.key, state[el.dataset.key]);
      if (el.dataset.key === "alter" || el.dataset.key === "rentenalter") {
        if (state.rentenalter <= state.alter) state.rentenalter = state.alter + 1;
      }
      render();
    }
  }, true);

  document.getElementById("fondstyp").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    state.fondstyp = b.dataset.v; render();
  });

  document.getElementById("realBtn").addEventListener("click", (e) => {
    state.realView = !state.realView;
    e.currentTarget.textContent = state.realView ? "Nominal anzeigen" : "Kaufkraft anzeigen";
    e.currentTarget.style.background = state.realView ? "var(--teal-600)" : "";
    e.currentTarget.style.color = state.realView ? "#fff" : "";
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
  try { localStorage.setItem("av-theme", t); } catch {}
  if (R) drawChart();
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(cur === "dark" ? "light" : "dark");
}

/* ============================ Init ================================= */
function init() {
  document.getElementById("app").innerHTML = shell();
  bind();
  let t = "light";
  try {
    t = localStorage.getItem("av-theme")
      || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } catch {}
  applyTheme(t);
  render();
}

init();
