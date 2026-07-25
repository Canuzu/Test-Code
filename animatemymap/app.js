/* ============================================================
   MapCinema — Karten-Animationsstudio
   Client-App: MapLibre GL + freie Vektordaten (keine API-Keys).
   Features: Keyframe-Touren, Titel, Länder-Reveal, Timeline,
   Musik & Video-Export (WebM).
   ============================================================ */

'use strict';

/* ---------- Karten-Styles ---------- */
const COUNTRY_TILES = 'https://demotiles.maplibre.org/tiles/tiles.json';
const GLYPHS = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';
const NAME_EXPR = ['coalesce',
  ['get', 'ADMIN'], ['get', 'NAME'], ['get', 'name'],
  ['get', 'name_en'], ['get', 'NAME_EN'], ['get', 'sovereignt'], ''];

// Kostenlose Satelliten-Kacheln (Esri World Imagery) für den Google-Earth-Look.
const SAT_TILES = ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];
const SAT_ATTR = 'Esri, Maxar, Earthstar Geographics';

const PALETTES = {
  satellite: { space: '#04070f', border: '#ffffff', dark: true, sat: true },
  day:       { ocean: '#cfe0f4', land: '#f6f4ee', border: '#c4cdda', dark: false },
  pastel:    { ocean: '#e9f1ff', land: '#ffffff', border: '#dbe5f5', dark: false },
  vibrant:   { ocean: '#7cc0ff', land: '#fef3e2', border: '#f0c79c', dark: false },
  night:     { ocean: '#0d1526', land: '#1c2740', border: '#33456b', dark: true },
};

function buildStyle(variant) {
  const p = PALETTES[variant] || PALETTES.satellite;
  const sources = {
    countries: { type: 'vector', url: COUNTRY_TILES },
    history: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  };
  if (p.sat) sources.sat = { type: 'raster', tiles: SAT_TILES, tileSize: 256, attribution: SAT_ATTR, maxzoom: 19 };

  const layers = [];
  if (p.sat) {
    layers.push({ id: 'bg', type: 'background', paint: { 'background-color': p.space } });
    layers.push({ id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-fade-duration': 300 } });
    // unsichtbar, aber klickbar für die Länder-Auswahl
    layers.push({ id: 'country-fill', type: 'fill', source: 'countries', 'source-layer': 'countries', paint: { 'fill-color': '#000', 'fill-opacity': 0.001 } });
  } else {
    layers.push({ id: 'bg', type: 'background', paint: { 'background-color': p.ocean } });
    layers.push({ id: 'country-fill', type: 'fill', source: 'countries', 'source-layer': 'countries', paint: { 'fill-color': p.land, 'fill-opacity': 1 } });
  }
  layers.push({ id: 'country-highlight', type: 'fill', source: 'countries', 'source-layer': 'countries',
    filter: ['==', ['literal', '__none__'], 'x'], paint: { 'fill-color': '#ff5d73', 'fill-opacity': p.sat ? 0.55 : 0.82 } });
  layers.push({ id: 'country-line', type: 'line', source: 'countries', 'source-layer': 'countries',
    paint: { 'line-color': p.border, 'line-width': p.sat ? 0.6 : 0.9, 'line-opacity': p.sat ? 0.5 : 0.85 } });

  // Historische Grenzen (anfangs leer & versteckt) — mit sanften Übergängen
  layers.push({ id: 'history-fill', type: 'fill', source: 'history',
    layout: { visibility: 'none' },
    paint: { 'fill-color': ['coalesce', ['get', '__color'], '#8fb3ff'], 'fill-opacity': 0, 'fill-opacity-transition': { duration: 380 } } });
  // dunkle Kontur unter der Grenzlinie → auf hellem wie dunklem Untergrund gut lesbar
  layers.push({ id: 'history-line-casing', type: 'line', source: 'history',
    layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': 'rgba(10,14,25,.55)', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.2, 4, 3.4, 7, 5], 'line-opacity': 0, 'line-opacity-transition': { duration: 380 } } });
  layers.push({ id: 'history-line', type: 'line', source: 'history',
    layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ffe08a', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1, 4, 1.8, 7, 2.8], 'line-opacity': 0, 'line-opacity-transition': { duration: 380 } } });
  layers.push({ id: 'history-label', type: 'symbol', source: 'history',
    layout: { visibility: 'none', 'text-field': ['coalesce', ['get', 'NAME'], ['get', 'name'], ''],
      'text-size': ['interpolate', ['linear'], ['zoom'], 1, 11, 4, 14, 6, 17], 'text-font': ['Open Sans Regular'],
      'text-max-width': 7, 'text-padding': 8, 'text-optional': true, 'symbol-placement': 'point', 'text-transform': 'none' },
    paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,.85)', 'text-halo-width': 1.8, 'text-opacity': 0, 'text-opacity-transition': { duration: 380 } } });

  return { version: 8, projection: { type: 'globe' }, glyphs: GLYPHS, sources, layers };
}

/* Angenehme, gut unterscheidbare Farbpalette für historische Gebiete */
const HIST_PALETTE = ['#6aa9e9', '#7cc47f', '#f2a65a', '#e07a5f', '#b58fd6', '#5ec6b0', '#f2c14e', '#e58fb0', '#8fb36a', '#c4a06a', '#8aa1ff', '#d98c8c', '#66c2c2', '#c98fd0'];
const HIST_FILL_OP = 0.32, HIST_LINE_OP = 0.9, HIST_LABEL_OP = 1;

/* ---------- Historische Jahres-Stände (historical-basemaps) ---------- */
const HISTORY_BASE = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/';
const HISTORY_YEARS = [-123000, -10000, -8000, -5000, -4000, -3000, -2000, -1500, -1000, -700, -500, -400, -323, -300, -200, -100, -1,
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300, 1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900, 1914, 1920, 1945, 1960, 1994, 2000, 2010];
const yearToFile = (y) => (y < 0 ? `world_bc${-y}.geojson` : `world_${y}.geojson`);
const yearLabel = (y) => (y < 0 ? `${-y} v. Chr.` : `${y} n. Chr.`);
const historyCache = {};

/* ---------- Zustand ---------- */
const DEFAULT_STATE = {
  keyframes: [], countries: [], markers: [],
  route: false, style: 'satellite', globe: true,
  revealSequential: false, audioOn: true,
  history: { on: false, index: HISTORY_YEARS.indexOf(2010) },
};
let state = structuredClone(DEFAULT_STATE);
let markerObjects = [];
let playing = false;
let recording = false;
let markerMode = false;
let activeTab = 'camera';
let uid = 1;
const nextId = () => 'id' + (uid++) + Date.now().toString(36);

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const el = {
  app: $('#app'), map: $('#map'), stage: $('#stage'),
  search: $('#search'), searchResults: $('#search-results'),
  keyframeList: $('#keyframe-list'), countryList: $('#country-list'), markerList: $('#marker-list'),
  addKeyframe: $('#add-keyframe'), countryColor: $('#country-color'), revealToggle: $('#reveal-toggle'),
  markerMode: $('#marker-mode'), routeToggle: $('#route-toggle'),
  play: $('#btn-play'), stop: $('#btn-stop'), record: $('#btn-record'), readout: $('#view-readout'),
  frameGuide: $('#frame-guide'), toast: $('#toast'), globeToggle: $('#globe-toggle'),
  fileImport: $('#file-import'),
  timeline: $('#timeline'), track: $('#timeline-track'), playhead: $('#playhead'),
  titleOverlay: $('#title-overlay'), recOverlay: $('#rec-overlay'), recSub: $('#rec-sub'),
  menuBtn: $('#menu-btn'), sbClose: $('#sb-close'), sbBackdrop: $('#sb-backdrop'),
  audioPick: $('#audio-pick'), audioFile: $('#audio-file'), audioInfo: $('#audio-info'),
  audioName: $('#audio-name'), audioRemove: $('#audio-remove'), audioOn: $('#audio-on'), audioVol: $('#audio-vol'),
  historyOn: $('#history-on'), yearSlider: $('#year-slider'), yearLabel: $('#year-label'),
  yearPrev: $('#year-prev'), yearNext: $('#year-next'), timePlay: $('#time-play'), historyStatus: $('#history-status'),
  timeVideo: $('#time-video'), yearOverlay: $('#year-overlay'),
};

/* ---------- Map init ---------- */
const map = new maplibregl.Map({
  container: 'map',
  style: buildStyle(state.style),
  center: [10, 30], zoom: 1.6, pitch: 0, bearing: 0,
  attributionControl: { compact: true },
  maxPitch: 75,
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

map.on('load', () => {
  applyProjection();
  reapplyDynamic();
  loadFromStorage();
  updateReadout();
});
map.on('move', updateReadout);

function whenStyleReady(fn) { if (map.isStyleLoaded()) fn(); else map.once('idle', fn); }
function reapplyDynamic() { whenStyleReady(() => { applyHighlights(); applyRoute(); reapplyHistory(); }); }

/* ---------- Länder-Highlighting ---------- */
function applyHighlights(limit) {
  if (!map.getLayer('country-highlight')) return;
  const list = (typeof limit === 'number') ? state.countries.slice(0, limit) : state.countries;
  const names = list.map((c) => c.name);
  if (names.length === 0) {
    map.setFilter('country-highlight', ['==', ['literal', '__none__'], 'x']);
    return;
  }
  map.setFilter('country-highlight', ['in', NAME_EXPR, ['literal', names]]);
  const match = ['match', NAME_EXPR];
  list.forEach((c) => match.push(c.name, c.color));
  match.push('#ff5d73');
  map.setPaintProperty('country-highlight', 'fill-color', match);
}

/* ---------- Route ---------- */
function routeGeoJSON() {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: state.markers.map((m) => [m.lng, m.lat]) } };
}
function applyRoute() {
  if (!map.isStyleLoaded()) { map.once('idle', applyRoute); return; }
  const show = state.route && state.markers.length >= 2;
  const data = routeGeoJSON();
  if (!map.getSource('route')) {
    map.addSource('route', { type: 'geojson', data });
    map.addLayer({
      id: 'route-line', type: 'line', source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#4f7cff', 'line-width': 2.6, 'line-opacity': 0.95, 'line-dasharray': [2, 1.4] },
    });
  } else {
    map.getSource('route').setData(data);
  }
  map.setLayoutProperty('route-line', 'visibility', show ? 'visible' : 'none');
}

function applyProjection() { try { map.setProjection({ type: state.globe ? 'globe' : 'mercator' }); } catch (e) {} }

/* ============================================================
   KAMERA / KEYFRAMES
   ============================================================ */
el.addKeyframe.addEventListener('click', () => {
  const c = map.getCenter();
  state.keyframes.push({
    id: nextId(),
    center: [+c.lng.toFixed(4), +c.lat.toFixed(4)],
    zoom: +map.getZoom().toFixed(2), pitch: +map.getPitch().toFixed(1),
    bearing: +map.getBearing().toFixed(1), duration: 3000, title: '',
  });
  renderKeyframes(); persist(); toast('Keyframe gespeichert');
});

function renderKeyframes() {
  const list = el.keyframeList;
  if (state.keyframes.length === 0) {
    list.innerHTML = '<div class="empty">Noch keine Keyframes. Richte die Ansicht ein und speichere sie.</div>';
    renderTimeline(); return;
  }
  list.innerHTML = '';
  state.keyframes.forEach((k, i) => {
    const card = document.createElement('div');
    card.className = 'card col';
    card.innerHTML = `
      <div class="card-row">
        <div class="idx">${i + 1}</div>
        <div class="grow">
          <div class="title">${k.center[1].toFixed(2)}, ${k.center[0].toFixed(2)}</div>
          <div class="meta">Zoom ${k.zoom} · Neig ${k.pitch}° · Dreh ${k.bearing}°</div>
        </div>
        <button class="iconbtn up" title="Anfliegen">▶</button>
        <button class="iconbtn up" title="Nach oben">↑</button>
        <button class="iconbtn down" title="Nach unten">↓</button>
        <button class="iconbtn" title="Löschen">✕</button>
      </div>
      <div class="card-row">
        <input class="ti tf-title" value="${escapeAttr(k.title || '')}" placeholder="Titel (optional, wird im Video eingeblendet)" />
      </div>
      <div class="card-row">
        <label class="mini">Dauer</label>
        <input class="ti tf-dur" type="number" min="0.5" max="20" step="0.5" value="${(k.duration / 1000).toFixed(1)}" style="width:80px" />
        <span class="mini">Sek.</span>
      </div>`;
    const [fly, up, down, del] = card.querySelectorAll('.card-row button');
    const titleInput = card.querySelector('.tf-title');
    const durInput = card.querySelector('.tf-dur');
    fly.onclick = () => map.flyTo({ center: k.center, zoom: k.zoom, pitch: k.pitch, bearing: k.bearing, duration: 1500, essential: true });
    up.onclick = () => { if (i > 0) { swap(state.keyframes, i, i - 1); renderKeyframes(); persist(); } };
    down.onclick = () => { if (i < state.keyframes.length - 1) { swap(state.keyframes, i, i + 1); renderKeyframes(); persist(); } };
    del.onclick = () => { state.keyframes.splice(i, 1); renderKeyframes(); persist(); };
    titleInput.onchange = () => { k.title = titleInput.value; persist(); renderTimeline(); };
    durInput.onchange = () => { k.duration = Math.max(500, (parseFloat(durInput.value) || 3) * 1000); persist(); renderTimeline(); };
    list.appendChild(card);
  });
  renderTimeline();
}
const swap = (a, i, j) => { [a[i], a[j]] = [a[j], a[i]]; };

/* ============================================================
   LÄNDER
   ============================================================ */
el.revealToggle.addEventListener('change', () => { state.revealSequential = el.revealToggle.checked; persist(); });

function toggleCountry(name) {
  if (!name) return;
  const idx = state.countries.findIndex((c) => c.name === name);
  if (idx >= 0) state.countries.splice(idx, 1);
  else state.countries.push({ name, color: el.countryColor.value });
  applyHighlights(); renderCountries(); persist();
}
function renderCountries() {
  const list = el.countryList;
  if (state.countries.length === 0) { list.innerHTML = '<div class="empty">Klicke Länder auf der Karte an.</div>'; return; }
  list.innerHTML = '';
  state.countries.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <span class="swatch" style="background:${c.color}"></span>
      <div class="grow"><div class="title">${i + 1}. ${escapeHtml(c.name)}</div></div>
      <input type="color" value="${c.color}" title="Farbe" />
      <button class="iconbtn" title="Entfernen">✕</button>`;
    const color = card.querySelector('input');
    const del = card.querySelector('button');
    color.oninput = () => { c.color = color.value; card.querySelector('.swatch').style.background = c.color; applyHighlights(); persist(); };
    del.onclick = () => { state.countries.splice(i, 1); applyHighlights(); renderCountries(); persist(); };
    list.appendChild(card);
  });
}

/* ============================================================
   MARKER
   ============================================================ */
el.markerMode.addEventListener('click', () => {
  markerMode = !markerMode;
  el.markerMode.innerHTML = `📍 Marker-Modus: <b>${markerMode ? 'an' : 'aus'}</b>`;
  el.markerMode.classList.toggle('btn-primary', markerMode);
  el.map.style.cursor = markerMode ? 'crosshair' : '';
});
el.routeToggle.addEventListener('change', () => { state.route = el.routeToggle.checked; applyRoute(); persist(); });

function addMarker(lng, lat, label) {
  state.markers.push({ id: nextId(), lng: +lng.toFixed(4), lat: +lat.toFixed(4), label: label || 'Marker', emoji: '' });
  renderMarkers(); applyRoute(); persist();
}
function renderMarkers() {
  markerObjects.forEach((m) => m.remove());
  markerObjects = [];
  state.markers.forEach((mk) => {
    const wrap = document.createElement('div');
    wrap.className = 'mc-marker';
    wrap.innerHTML = `<div class="dot"></div><div class="lab">${mk.emoji ? escapeHtml(mk.emoji) + ' ' : ''}${escapeHtml(mk.label)}</div>`;
    markerObjects.push(new maplibregl.Marker({ element: wrap, anchor: 'bottom' }).setLngLat([mk.lng, mk.lat]).addTo(map));
  });
  const list = el.markerList;
  if (state.markers.length === 0) { list.innerHTML = '<div class="empty">Marker-Modus aktivieren und auf die Karte tippen.</div>'; return; }
  list.innerHTML = '';
  state.markers.forEach((mk, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <input class="emoji" value="${escapeAttr(mk.emoji)}" placeholder="🏳️" style="width:40px;text-align:center;background:var(--panel-2);border:1px solid var(--line);border-radius:9px;color:var(--txt);padding:7px 2px" />
      <input class="ti lab" value="${escapeAttr(mk.label)}" style="flex:1;min-width:0" />
      <button class="iconbtn up" title="Anfliegen">▶</button>
      <button class="iconbtn" title="Löschen">✕</button>`;
    const [emoji, lab] = card.querySelectorAll('input');
    const [fly, del] = card.querySelectorAll('button');
    const update = () => { mk.emoji = emoji.value; mk.label = lab.value; renderMarkers(); persist(); };
    emoji.onchange = update; lab.onchange = update;
    fly.onclick = () => map.flyTo({ center: [mk.lng, mk.lat], zoom: 5, duration: 1500, essential: true });
    del.onclick = () => { state.markers.splice(i, 1); renderMarkers(); applyRoute(); persist(); };
    list.appendChild(card);
  });
}

/* ---------- Karten-Klick ---------- */
map.on('click', (e) => {
  if (markerMode) { addMarker(e.lngLat.lng, e.lngLat.lat); return; }
  if (activeTab === 'countries') {
    const feats = map.queryRenderedFeatures(e.point, { layers: ['country-fill'] });
    if (feats.length) {
      const pr = feats[0].properties;
      toggleCountry(pr.ADMIN || pr.NAME || pr.name || pr.name_en || pr.NAME_EN || pr.sovereignt);
    }
  }
});
map.on('mouseenter', 'country-fill', () => { if (activeTab === 'countries' && !markerMode) el.map.style.cursor = 'pointer'; });
map.on('mouseleave', 'country-fill', () => { if (!markerMode) el.map.style.cursor = ''; });

/* ============================================================
   TABS + MOBILE DRAWER
   ============================================================ */
document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((x) => x.classList.add('hidden'));
    t.classList.add('active');
    activeTab = t.dataset.tab;
    $(`.panel[data-panel="${activeTab}"]`).classList.remove('hidden');
  });
});
const openDrawer = () => el.app.classList.add('drawer-open');
const closeDrawer = () => el.app.classList.remove('drawer-open');
el.menuBtn.addEventListener('click', openDrawer);
el.sbClose.addEventListener('click', closeDrawer);
el.sbBackdrop.addEventListener('click', closeDrawer);

/* ============================================================
   STYLE / RATIO / GLOBE
   ============================================================ */
$('#style-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $('#style-seg .active')?.classList.remove('active'); b.classList.add('active');
  state.style = b.dataset.style;
  map.setStyle(buildStyle(state.style));
  map.once('idle', reapplyDynamic);
  applyProjection(); persist();
});
$('#ratio-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  $('#ratio-seg .active')?.classList.remove('active'); b.classList.add('active');
  updateFrameGuide(b.dataset.ratio);
});
el.globeToggle.addEventListener('change', () => { state.globe = el.globeToggle.checked; applyProjection(); persist(); });

let currentRatio = 'free';
function updateFrameGuide(ratio) {
  if (ratio) currentRatio = ratio;
  const g = el.frameGuide;
  if (currentRatio === 'free') { g.classList.add('hidden'); return; }
  const [rw, rh] = currentRatio.split(':').map(Number);
  const stage = el.stage.getBoundingClientRect();
  const margin = 0.84;
  let w = stage.width * margin, h = w * rh / rw;
  if (h > stage.height * margin) { h = stage.height * margin; w = h * rw / rh; }
  g.style.width = w + 'px'; g.style.height = h + 'px';
  g.classList.remove('hidden');
}
window.addEventListener('resize', () => { updateFrameGuide(); renderTimeline(); });

/* ============================================================
   TIMELINE
   ============================================================ */
function renderTimeline() {
  const has = state.keyframes.length > 0;
  el.timeline.classList.toggle('hidden', !has);
  if (!has) return;
  el.track.innerHTML = '';
  state.keyframes.forEach((k, i) => {
    const seg = document.createElement('div');
    seg.className = 'tl-seg';
    seg.style.flexGrow = String(k.duration || 3000);
    seg.innerHTML = `<span class="tl-idx">${i + 1}</span><span class="tl-name">${k.title ? escapeHtml(k.title) : ''}</span>`;
    seg.onclick = () => map.flyTo({ center: k.center, zoom: k.zoom, pitch: k.pitch, bearing: k.bearing, duration: 1200, essential: true });
    el.track.appendChild(seg);
  });
}
function segFractions() {
  const ds = state.keyframes.map((k) => k.duration || 3000);
  const tot = ds.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return ds.map((d) => { const s = acc / tot; acc += d; return { start: s, end: acc / tot }; });
}
function positionPlayhead(i) {
  const w = el.track.clientWidth;
  const f = segFractions()[i] || { start: 0 };
  el.playhead.style.transition = 'none';
  el.playhead.style.left = (f.start * w) + 'px';
  el.playhead.classList.remove('hidden');
}
function animatePlayhead(i, dur) {
  const w = el.track.clientWidth;
  const f = segFractions()[i]; if (!f) return;
  el.playhead.style.transition = 'none';
  el.playhead.style.left = (f.start * w) + 'px';
  void el.playhead.offsetWidth; // reflow
  el.playhead.style.transition = `left ${dur}ms linear`;
  el.playhead.style.left = (f.end * w) + 'px';
}

/* ============================================================
   TITEL-OVERLAY
   ============================================================ */
function showTitle(text) {
  if (text) { el.titleOverlay.textContent = text; el.titleOverlay.classList.add('show'); }
  else { el.titleOverlay.classList.remove('show'); }
}

/* ============================================================
   PLAYBACK
   ============================================================ */
function setPlaying(v) {
  playing = v;
  el.play.disabled = v; el.stop.disabled = !v; el.record.disabled = v && !recording;
  el.frameGuide.style.borderColor = v ? 'rgba(242,68,93,.95)' : 'rgba(79,124,255,.9)';
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function flyToAsync(k) {
  return new Promise((res) => {
    const done = () => { map.off('moveend', done); res(); };
    map.on('moveend', done);
    map.flyTo({ center: k.center, zoom: k.zoom, pitch: k.pitch, bearing: k.bearing, duration: k.duration || 3000, curve: 1.5, essential: true });
  });
}
async function playTour(opts = {}) {
  if (state.keyframes.length < 1) { toast('Füge zuerst Keyframes hinzu'); return; }
  setPlaying(true);
  renderTimeline();
  const seq = state.revealSequential && state.countries.length > 0;

  if (state.audioOn && audioReady) { try { audioEl.currentTime = 0; await audioEl.play(); } catch (e) {} }

  const first = state.keyframes[0];
  map.jumpTo({ center: first.center, zoom: first.zoom, pitch: first.pitch, bearing: first.bearing });
  positionPlayhead(0);
  applyHighlights(seq ? 1 : undefined);
  showTitle(first.title);
  await wait(700);

  for (let i = 1; i < state.keyframes.length && playing; i++) {
    const k = state.keyframes[i];
    animatePlayhead(i, k.duration || 3000);
    showTitle(k.title);
    await flyToAsync(k);
    if (!playing) break;
    if (seq) applyHighlights(i + 1);
    await wait(500);
  }
  showTitle('');
  el.playhead.classList.add('hidden');
  if (!opts.keepAudio && audioReady) audioEl.pause();
  applyHighlights(); // vollständige Hervorhebung fürs Editieren wiederherstellen
  setPlaying(false);
}
el.play.addEventListener('click', () => playTour());
el.stop.addEventListener('click', stopAll);
function stopAll() { setPlaying(false); map.stop(); showTitle(''); el.playhead.classList.add('hidden'); if (audioReady) audioEl.pause(); }

/* ============================================================
   AUDIO / MUSIK
   ============================================================ */
let audioEl = null, audioReady = false, audioUrl = null;
let audioCtx = null, audioSrcNode = null, audioDest = null;

el.audioPick.addEventListener('click', () => el.audioFile.click());
el.audioFile.addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(file);
  if (!audioEl) { audioEl = new Audio(); audioEl.loop = false; }
  audioEl.src = audioUrl;
  audioEl.volume = parseFloat(el.audioVol.value);
  audioReady = false;
  audioEl.oncanplay = () => { audioReady = true; };
  audioEl.load();
  el.audioName.textContent = file.name;
  el.audioInfo.classList.remove('hidden');
  el.audioFile.value = '';
  toast('Musik geladen');
});
el.audioRemove.addEventListener('click', () => {
  if (audioEl) { audioEl.pause(); audioEl.src = ''; }
  if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
  audioReady = false;
  el.audioInfo.classList.add('hidden');
  el.audioName.textContent = '—';
});
el.audioOn.addEventListener('change', () => { state.audioOn = el.audioOn.checked; persist(); });
el.audioVol.addEventListener('input', () => { if (audioEl) audioEl.volume = parseFloat(el.audioVol.value); });

function getAudioTracks() {
  if (!audioReady || !state.audioOn) return [];
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioSrcNode = audioCtx.createMediaElementSource(audioEl);
      audioDest = audioCtx.createMediaStreamDestination();
      audioSrcNode.connect(audioDest);
      audioSrcNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioDest.stream.getAudioTracks();
  } catch (e) { return []; }
}

/* ============================================================
   ZEITREISE — historische Grenzen pro Jahr
   ============================================================ */
let historyToken = 0;
let yearOverlayText = ''; // wird in den Video-Export gezeichnet

function currentHistoryYear() {
  const i = Math.max(0, Math.min(HISTORY_YEARS.length - 1, state.history.index));
  return HISTORY_YEARS[i];
}
function isSatStyle() { return !!(PALETTES[state.style] && PALETTES[state.style].sat); }
/* History-Modus = echte politische Weltkarte der Epoche:
   Satellit/moderne Ebenen aus, sauberer Ozean-Hintergrund, farbig gefüllte Länder. */
function setHistoryMode(on) {
  const p = PALETTES[state.style] || PALETTES.satellite;
  // historische Ebenen ein/aus
  ['history-fill', 'history-line-casing', 'history-line', 'history-label'].forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
  });
  // Basis-Ebenen ausblenden, solange die Zeitreise aktiv ist
  ['sat', 'country-fill', 'country-line'].forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'none' : 'visible');
  });
  // Hintergrund: im History-Modus ein klarer Ozean, sonst der Stil-Standard
  if (map.getLayer('bg')) {
    const ocean = on ? (p.dark ? '#0b1c3a' : '#c3d8f0') : (p.sat ? p.space : p.ocean);
    map.setPaintProperty('bg', 'background-color', ocean);
  }
}
function fadeHistory(on) {
  // Volle politische Färbung — die Länder sollen klar erkennbar sein.
  if (map.getLayer('history-fill')) map.setPaintProperty('history-fill', 'fill-opacity', on ? 0.9 : 0);
  if (map.getLayer('history-line-casing')) map.setPaintProperty('history-line-casing', 'line-opacity', on ? 0.85 : 0);
  if (map.getLayer('history-line')) map.setPaintProperty('history-line', 'line-opacity', on ? HIST_LINE_OP : 0);
  if (map.getLayer('history-label')) map.setPaintProperty('history-label', 'text-opacity', on ? HIST_LABEL_OP : 0);
}
function stableColor(name) {
  let h = 0; const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return HIST_PALETTE[h % HIST_PALETTE.length];
}
async function loadHistoryYear(year) {
  if (historyCache[year]) return historyCache[year];
  const res = await fetch(HISTORY_BASE + yearToFile(year));
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const gj = await res.json();
  (gj.features || []).forEach((f) => {
    f.properties = f.properties || {};
    f.properties.__color = stableColor(f.properties.NAME || f.properties.name || '');
  });
  historyCache[year] = gj;
  return gj;
}
function updateYearUI() {
  const y = currentHistoryYear();
  el.yearSlider.value = String(state.history.index);
  el.yearLabel.textContent = yearLabel(y);
}
function setYearOverlay(text) {
  yearOverlayText = text || '';
  if (text) { el.yearOverlay.textContent = text; el.yearOverlay.classList.add('show'); }
  else { el.yearOverlay.classList.remove('show'); }
}
/* Wichtig: ERST laden, DANN tauschen — die alten Grenzen bleiben sichtbar,
   bis die neuen da sind (kein Verschwinden). Bei Fehler bleiben die alten stehen. */
async function applyHistoryYear() {
  const y = currentHistoryYear();
  updateYearUI();
  if (!state.history.on || !map.getSource('history')) return;
  const token = ++historyToken;
  setYearOverlay(yearLabel(y));
  el.historyStatus.textContent = `Lade Grenzen für ${yearLabel(y)} …`;
  try {
    const gj = await loadHistoryYear(y);        // alte Grenzen bleiben während des Ladens sichtbar
    if (token !== historyToken) return;         // vom nächsten Aufruf überholt → verwerfen
    map.getSource('history').setData(gj);
    fadeHistory(true);
    el.historyStatus.textContent = `${yearLabel(y)} · ${(gj.features || []).length} Gebiete · Quelle: historical-basemaps`;
  } catch (e) {
    if (token === historyToken) el.historyStatus.textContent = `„${yearLabel(y)}“ konnte nicht geladen werden (Netz?). Vorherige Grenzen bleiben.`;
  }
}
function reapplyHistory() {
  if (!map.getSource('history')) return;
  setHistoryMode(state.history.on);
  if (state.history.on) { fadeHistory(true); applyHistoryYear(); } else setYearOverlay('');
}
function setHistoryOn(on) {
  state.history.on = on;
  el.historyOn.checked = on;
  whenStyleReady(() => { setHistoryMode(on); if (on) { fadeHistory(true); applyHistoryYear(); } else setYearOverlay(''); });
  persist();
}
function stepYear(delta) {
  const ni = Math.max(0, Math.min(HISTORY_YEARS.length - 1, state.history.index + delta));
  if (ni === state.history.index) return;
  state.history.index = ni;
  applyHistoryYear(); persist();
}
el.historyOn.addEventListener('change', () => setHistoryOn(el.historyOn.checked));
// Beim Ziehen live das Jahr aktualisieren; Daten erst am Ende (change) laden.
el.yearSlider.addEventListener('input', () => { state.history.index = parseInt(el.yearSlider.value, 10) || 0; updateYearUI(); if (state.history.on) setYearOverlay(yearLabel(currentHistoryYear())); });
el.yearSlider.addEventListener('change', () => { applyHistoryYear(); persist(); });
el.yearPrev.addEventListener('click', () => stepYear(-1));
el.yearNext.addEventListener('click', () => stepYear(1));

let timePlaying = false;
/* Läuft durch die Epochen; gibt Promise zurück, damit der Video-Export darauf warten kann. */
async function playThroughTime(opts = {}) {
  if (!state.history.on) setHistoryOn(true);
  timePlaying = true; el.timePlay.textContent = '⏸ Stopp';
  const from = opts.fromStart ? 0 : state.history.index;
  for (let i = from; i < HISTORY_YEARS.length && timePlaying; i++) {
    state.history.index = i;
    await applyHistoryYear();
    await wait(opts.hold || 1100);
  }
  timePlaying = false; el.timePlay.textContent = '▶ Durch die Zeit';
  persist();
}
el.timePlay.addEventListener('click', () => {
  if (timePlaying) { timePlaying = false; el.timePlay.textContent = '▶ Durch die Zeit'; return; }
  playThroughTime();
});

/* ============================================================
   VIDEO-EXPORT (WebM)
   ============================================================ */
function pickMime() {
  const cand = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm'];
  if (window.MediaRecorder && MediaRecorder.isTypeSupported) {
    for (const m of cand) if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}
/* Zielauflösung je nach Format */
function exportDims() {
  const sizes = { '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [900, 900] };
  if (currentRatio !== 'free' && sizes[currentRatio]) return sizes[currentRatio];
  const cv = map.getCanvas();
  const w = cv.clientWidth || 1280, h = cv.clientHeight || 720;
  const scale = Math.min(1, 1280 / w);
  return [Math.round(w * scale / 2) * 2, Math.round(h * scale / 2) * 2];
}
/* Map an Ziel-Seitenverhältnis anpassen, damit der Bildausschnitt passt */
function applyExportSize(W, H) {
  const prev = el.map.getAttribute('style') || '';
  const stage = el.stage.getBoundingClientRect();
  const scale = Math.min(1, (stage.width * 0.98) / W, (stage.height * 0.98) / H);
  const w = Math.round(W * scale), h = Math.round(H * scale);
  el.map.style.position = 'absolute';
  el.map.style.inset = 'auto';
  el.map.style.left = Math.max(0, (stage.width - w) / 2) + 'px';
  el.map.style.top = Math.max(0, (stage.height - h) / 2) + 'px';
  el.map.style.width = w + 'px';
  el.map.style.height = h + 'px';
  map.resize();
  return () => { el.map.setAttribute('style', prev); map.resize(); };
}

/* Einen Frame (Karte + Marker + Titel) auf das Export-Canvas zeichnen */
function drawFrame(octx, W, H) {
  const src = map.getCanvas();
  // Karte einpassen (cover)
  const sw = src.width, sh = src.height;
  const s = Math.max(W / sw, H / sh);
  const dw = sw * s, dh = sh * s;
  octx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);

  const cssW = src.clientWidth || sw, cssH = src.clientHeight || sh;
  const kx = W / cssW, ky = H / cssH;

  // Marker
  state.markers.forEach((mk) => {
    const p = map.project([mk.lng, mk.lat]);
    if (p.x < 0 || p.y < 0 || p.x > cssW || p.y > cssH) return;
    const x = p.x * kx, y = p.y * ky;
    const r = Math.max(5, H * 0.008);
    octx.beginPath(); octx.arc(x, y, r, 0, Math.PI * 2);
    octx.fillStyle = '#ff5d9e'; octx.fill();
    octx.lineWidth = r * 0.5; octx.strokeStyle = '#fff'; octx.stroke();
    const label = (mk.emoji ? mk.emoji + ' ' : '') + (mk.label || '');
    if (label.trim()) {
      const fs = Math.max(12, H * 0.022);
      octx.font = `600 ${fs}px Inter, sans-serif`;
      const tw = octx.measureText(label).width;
      const pad = fs * 0.45, bx = x + r + 6, by = y - fs * 0.75;
      octx.fillStyle = 'rgba(255,255,255,.94)';
      roundRect(octx, bx, by, tw + pad * 2, fs * 1.5, 7); octx.fill();
      octx.fillStyle = '#1f2740'; octx.textBaseline = 'middle';
      octx.fillText(label, bx + pad, by + fs * 0.78);
    }
  });

  // Jahr-Einblendung (oben mittig), wenn die Zeitreise aktiv ist
  if (yearOverlayText) {
    const fs = Math.max(16, H * 0.036);
    octx.font = `700 ${fs}px 'Space Grotesk', Inter, sans-serif`;
    octx.textAlign = 'center'; octx.textBaseline = 'middle';
    const tw = octx.measureText(yearOverlayText).width;
    const padX = fs * 0.7, padY = fs * 0.4, bw = tw + padX * 2, bh = fs + padY * 2;
    const bx = (W - bw) / 2, by = H * 0.045;
    octx.fillStyle = 'rgba(15,20,35,.62)';
    roundRect(octx, bx, by, bw, bh, bh / 2); octx.fill();
    octx.fillStyle = '#fff';
    octx.fillText(yearOverlayText, W / 2, by + bh / 2);
  }

  // Titel (nur wenn gerade eingeblendet)
  if (el.titleOverlay.classList.contains('show') && el.titleOverlay.textContent) {
    const txt = el.titleOverlay.textContent;
    const fs = Math.max(20, H * 0.052);
    octx.font = `700 ${fs}px 'Space Grotesk', Inter, sans-serif`;
    octx.textAlign = 'center'; octx.textBaseline = 'alphabetic';
    octx.shadowColor = 'rgba(0,0,0,.6)'; octx.shadowBlur = fs * 0.5; octx.shadowOffsetY = 3;
    octx.fillStyle = '#fff';
    octx.fillText(txt, W / 2, H * 0.84, W * 0.9);
    octx.shadowColor = 'transparent'; octx.shadowBlur = 0; octx.shadowOffsetY = 0;
    octx.textAlign = 'left';
  }
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* Nimmt beliebige Animation (runFn) als WebM auf: komponiert Karte + Overlays. */
async function recordWhile(runFn, opts = {}) {
  if (recording || playing || timePlaying) return;
  if (!window.MediaRecorder) { toast('Video-Export wird von diesem Browser nicht unterstützt'); return; }

  recording = true;
  el.record.classList.add('armed');
  const [W, H] = exportDims();
  const restore = applyExportSize(W, H);
  await wait(400);

  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const octx = out.getContext('2d');

  let stream;
  try { stream = out.captureStream(30); }
  catch (e) { toast('Aufnahme nicht möglich'); cleanup(); return; }

  const aTracks = opts.audio ? getAudioTracks() : [];
  const combined = new MediaStream([...stream.getVideoTracks(), ...aTracks]);
  const mime = pickMime();
  let rec;
  try { rec = new MediaRecorder(combined, mime ? { mimeType: mime } : undefined); }
  catch (e) { try { rec = new MediaRecorder(combined); } catch (e2) { toast('Aufnahme nicht möglich'); cleanup(); return; } }

  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { rec.onstop = res; });

  // Frames im 'render'-Event der Karte abgreifen (gültiger GL-Puffer, ohne
  // preserveDrawingBuffer → flüssigere normale Nutzung). Ein Timer erzwingt
  // kontinuierliches Rendern, damit auch Standbild-Phasen erfasst werden.
  const onRender = () => { try { drawFrame(octx, W, H); } catch (e) {} };
  map.on('render', onRender);
  const repaint = setInterval(() => map.triggerRepaint(), 1000 / 30);
  map.triggerRepaint();

  el.recOverlay.classList.remove('hidden');
  el.recSub.textContent = opts.sub || 'Aufnahme läuft…';
  rec.start();

  try { await runFn(); } catch (e) {}
  await wait(500);
  clearInterval(repaint);
  map.off('render', onRender);
  try { rec.stop(); } catch (e) {}
  await stopped;

  if (audioReady) audioEl.pause();
  const blob = new Blob(chunks, { type: (mime || 'video/webm').split(';')[0] });
  cleanup();
  if (blob.size > 0) { downloadBlob(blob, opts.name || 'mapcinema-video.webm'); toast('🎉 Video exportiert (WebM)'); }
  else { toast('Aufnahme leer — bitte erneut versuchen'); }

  function cleanup() {
    recording = false; el.record.classList.remove('armed');
    el.recOverlay.classList.add('hidden'); setPlaying(false); restore();
  }
}

el.record.addEventListener('click', () => {
  if (state.keyframes.length < 1) { toast('Füge zuerst Keyframes hinzu'); return; }
  recordWhile(() => playTour({ keepAudio: true }), { audio: true, sub: 'Tour läuft…', name: 'mapcinema-video.webm' });
});
if (el.timeVideo) el.timeVideo.addEventListener('click', () => {
  recordWhile(() => playThroughTime({ fromStart: false }), { audio: true, sub: 'Zeitreise läuft…', name: 'mapcinema-zeitreise.webm' });
});
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ============================================================
   SUCHE (Nominatim)
   ============================================================ */
let searchTimer = null;
el.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = el.search.value.trim();
  if (q.length < 3) { el.searchResults.classList.add('hidden'); return; }
  searchTimer = setTimeout(() => doGeocode(q), 350);
});
async function doGeocode(q) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) { el.searchResults.innerHTML = '<div>Keine Treffer</div>'; el.searchResults.classList.remove('hidden'); return; }
    el.searchResults.innerHTML = '';
    data.forEach((r) => {
      const d = document.createElement('div');
      d.textContent = r.display_name;
      d.onclick = () => {
        el.searchResults.classList.add('hidden');
        el.search.value = r.display_name.split(',')[0];
        map.flyTo({ center: [+r.lon, +r.lat], zoom: 5, duration: 2000, essential: true });
        closeDrawer();
      };
      el.searchResults.appendChild(d);
    });
    el.searchResults.classList.remove('hidden');
  } catch (e) { toast('Suche momentan nicht verfügbar'); }
}
document.addEventListener('click', (e) => {
  if (!el.search.contains(e.target) && !el.searchResults.contains(e.target)) el.searchResults.classList.add('hidden');
});

/* ============================================================
   SPEICHERN / EXPORT / IMPORT / DEMO
   ============================================================ */
const STORAGE_KEY = 'mapcinema.project.v3';
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
function loadFromStorage() { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) applyState(JSON.parse(raw)); } catch (e) {} }

function applyState(s) {
  const prevStyle = state.style;
  state = Object.assign(structuredClone(DEFAULT_STATE), s);
  if (!PALETTES[state.style]) state.style = 'day';
  // UI sync
  if (!state.history || typeof state.history.index !== 'number') state.history = { on: false, index: HISTORY_YEARS.indexOf(2010) };
  el.routeToggle.checked = state.route;
  el.globeToggle.checked = state.globe;
  el.revealToggle.checked = state.revealSequential;
  el.audioOn.checked = state.audioOn;
  el.historyOn.checked = state.history.on;
  updateYearUI();
  $('#style-seg .active')?.classList.remove('active');
  $(`#style-seg [data-style="${state.style}"]`)?.classList.add('active');
  if (PALETTES[state.style] && state.style !== prevStyle) { map.setStyle(buildStyle(state.style)); }
  applyProjection();
  renderKeyframes(); renderCountries(); renderMarkers();
  reapplyDynamic();
}

$('#btn-save').addEventListener('click', () => { persist(); toast('Projekt gespeichert'); });
$('#btn-export').addEventListener('click', () => {
  downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), 'mapcinema-projekt.json');
});
$('#btn-import').addEventListener('click', () => el.fileImport.click());
el.fileImport.addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { applyState(JSON.parse(reader.result)); persist(); toast('Projekt importiert'); } catch (err) { toast('Datei ungültig'); } };
  reader.readAsText(file); el.fileImport.value = '';
});

$('#btn-demo').addEventListener('click', loadDemo);
function loadDemo() {
  applyState({
    style: 'day', globe: true, route: true, revealSequential: true, audioOn: true,
    keyframes: [
      { id: nextId(), center: [10, 46], zoom: 2.6, pitch: 0, bearing: 0, duration: 2500, title: 'Eine Reise durch Europa' },
      { id: nextId(), center: [2.35, 48.86], zoom: 4.9, pitch: 45, bearing: -20, duration: 3500, title: 'Paris' },
      { id: nextId(), center: [12.5, 41.9], zoom: 5.2, pitch: 55, bearing: 15, duration: 3500, title: 'Rom' },
      { id: nextId(), center: [23.7, 38.0], zoom: 5.0, pitch: 50, bearing: 0, duration: 3500, title: 'Athen' },
    ],
    countries: [
      { name: 'France', color: '#4f7cff' },
      { name: 'Italy', color: '#8b5cff' },
      { name: 'Greece', color: '#ff5d9e' },
    ],
    markers: [
      { id: nextId(), lng: 2.35, lat: 48.86, label: 'Paris', emoji: '🗼' },
      { id: nextId(), lng: 12.5, lat: 41.9, label: 'Rom', emoji: '🏛️' },
      { id: nextId(), lng: 23.7, lat: 38.0, label: 'Athen', emoji: '🏺' },
    ],
  });
  persist(); toast('Demo geladen — ▶ Abspielen');
}

/* ============================================================
   HILFEN
   ============================================================ */
function updateReadout() {
  const c = map.getCenter();
  el.readout.textContent = `Lng ${c.lng.toFixed(2)} · Lat ${c.lat.toFixed(2)} · Zoom ${map.getZoom().toFixed(1)} · ${map.getPitch().toFixed(0)}°`;
}
let toastTimer = null;
function toast(msg) {
  el.toast.textContent = msg; el.toast.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 2600);
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s) { return escapeHtml(s); }

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    if (playing) stopAll(); else playTour();
  }
});

/* ---------- Theme (Hell/Dunkel) ---------- */
const themeBtn = $('#theme-btn');
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  if (themeBtn) themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#080b14' : '#eef1f8');
}
(function initTheme() {
  let t = 'light';
  try { t = localStorage.getItem('mapcinema.theme') || 'light'; } catch (e) {}
  applyTheme(t);
})();
if (themeBtn) themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('mapcinema.theme', next); } catch (e) {}
});

/* ---------- Hilfe / Onboarding ---------- */
const helpModal = $('#help-modal');
const openHelp = () => helpModal.classList.remove('hidden');
const closeHelp = () => helpModal.classList.add('hidden');
$('#help-btn').addEventListener('click', openHelp);
$('#help-close').addEventListener('click', closeHelp);
$('#help-ok').addEventListener('click', () => { closeHelp(); try { localStorage.setItem('mapcinema.helpseen', '1'); } catch (e) {} });
helpModal.addEventListener('click', (e) => { if (e.target === helpModal) closeHelp(); });
try { if (!localStorage.getItem('mapcinema.helpseen')) openHelp(); } catch (e) {}

/* Erststart */
el.yearSlider.max = String(HISTORY_YEARS.length - 1);
el.yearSlider.min = '0';
updateYearUI();
renderKeyframes(); renderCountries(); renderMarkers();
