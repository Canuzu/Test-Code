/* ============================================================
   MapCinema — Cinematic Map Studio
   Reine Client-App: MapLibre GL + freie Vektordaten (keine API-Keys).
   ============================================================ */

'use strict';

/* ---------- Karten-Styles (dunkle Varianten) ---------- */
const COUNTRY_TILES = 'https://demotiles.maplibre.org/tiles/tiles.json';
const NAME_EXPR = ['coalesce',
  ['get', 'ADMIN'], ['get', 'NAME'], ['get', 'name'],
  ['get', 'name_en'], ['get', 'NAME_EN'], ['get', 'sovereignt'], ''];

const PALETTES = {
  night: { bg: '#070b16', land: '#14213c', border: '#2c4470' },
  mono:  { bg: '#0b0e13', land: '#1b222d', border: '#333d4d' },
  neon:  { bg: '#06021a', land: '#170a30', border: '#7c3aed' },
};

function buildStyle(variant) {
  const p = PALETTES[variant] || PALETTES.night;
  return {
    version: 8,
    projection: { type: 'globe' },
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      countries: { type: 'vector', url: COUNTRY_TILES },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': p.bg } },
      {
        id: 'country-fill', type: 'fill', source: 'countries', 'source-layer': 'countries',
        paint: { 'fill-color': p.land, 'fill-opacity': 0.92 },
      },
      {
        id: 'country-highlight', type: 'fill', source: 'countries', 'source-layer': 'countries',
        filter: ['==', ['literal', '__none__'], 'x'],
        paint: { 'fill-color': '#f5c451', 'fill-opacity': 0.85 },
      },
      {
        id: 'country-line', type: 'line', source: 'countries', 'source-layer': 'countries',
        paint: { 'line-color': p.border, 'line-width': 0.8, 'line-opacity': 0.7 },
      },
    ],
  };
}

/* ---------- Zustand ---------- */
const DEFAULT_STATE = {
  keyframes: [], countries: [], markers: [],
  route: false, style: 'night', globe: true,
};
let state = structuredClone(DEFAULT_STATE);
let markerObjects = [];
let playing = false;
let markerMode = false;
let activeTab = 'camera';
let uid = 1;
const nextId = () => 'id' + (uid++) + Date.now().toString(36);

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const el = {
  map: $('#map'),
  search: $('#search'), searchResults: $('#search-results'),
  keyframeList: $('#keyframe-list'), countryList: $('#country-list'), markerList: $('#marker-list'),
  addKeyframe: $('#add-keyframe'), countryColor: $('#country-color'),
  markerMode: $('#marker-mode'), routeToggle: $('#route-toggle'),
  play: $('#btn-play'), stop: $('#btn-stop'), readout: $('#view-readout'),
  frameGuide: $('#frame-guide'), toast: $('#toast'), globeToggle: $('#globe-toggle'),
  fileImport: $('#file-import'),
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

/* Führt fn aus, sobald der Style vollständig geladen ist (sonst sofort). */
function whenStyleReady(fn) {
  if (map.isStyleLoaded()) fn();
  else map.once('idle', fn);
}

/* Nach jedem Style-Wechsel dynamische Ebenen wieder anwenden */
function reapplyDynamic() {
  whenStyleReady(() => { applyHighlights(); applyRoute(); });
}

/* ---------- Länder-Highlighting ---------- */
function applyHighlights() {
  if (!map.getLayer('country-highlight')) return;
  const names = state.countries.map((c) => c.name);
  if (names.length === 0) {
    map.setFilter('country-highlight', ['==', ['literal', '__none__'], 'x']);
    return;
  }
  map.setFilter('country-highlight', ['in', NAME_EXPR, ['literal', names]]);
  const match = ['match', NAME_EXPR];
  state.countries.forEach((c) => match.push(c.name, c.color));
  match.push('#f5c451');
  map.setPaintProperty('country-highlight', 'fill-color', match);
}

/* ---------- Route zwischen Markern ---------- */
function routeGeoJSON() {
  return {
    type: 'Feature', geometry: {
      type: 'LineString',
      coordinates: state.markers.map((m) => [m.lng, m.lat]),
    },
  };
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
      paint: {
        'line-color': '#22d3ee', 'line-width': 2.4, 'line-opacity': 0.9,
        'line-dasharray': [2, 1.5],
      },
    });
  } else {
    map.getSource('route').setData(data);
  }
  map.setLayoutProperty('route-line', 'visibility', show ? 'visible' : 'none');
}

/* ---------- Projektion ---------- */
function applyProjection() {
  try { map.setProjection({ type: state.globe ? 'globe' : 'mercator' }); } catch (e) {}
}

/* ============================================================
   KAMERA / KEYFRAMES
   ============================================================ */
el.addKeyframe.addEventListener('click', () => {
  const c = map.getCenter();
  state.keyframes.push({
    id: nextId(),
    center: [+c.lng.toFixed(4), +c.lat.toFixed(4)],
    zoom: +map.getZoom().toFixed(2),
    pitch: +map.getPitch().toFixed(1),
    bearing: +map.getBearing().toFixed(1),
    duration: 3000,
  });
  renderKeyframes(); persist();
  toast('Keyframe gespeichert');
});

function renderKeyframes() {
  const list = el.keyframeList;
  if (state.keyframes.length === 0) {
    list.innerHTML = '<div class="empty">Noch keine Keyframes. Richte die Ansicht ein und speichere sie.</div>';
    return;
  }
  list.innerHTML = '';
  state.keyframes.forEach((k, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="idx">${i + 1}</div>
      <div class="grow">
        <div class="title">${k.center[1].toFixed(2)}, ${k.center[0].toFixed(2)}</div>
        <div class="meta">Zoom ${k.zoom} · Neig ${k.pitch}° · Dreh ${k.bearing}° · ${(k.duration / 1000).toFixed(1)}s</div>
      </div>
      <button class="iconbtn up" title="Anfliegen">▶</button>
      <button class="iconbtn up" title="Nach oben">↑</button>
      <button class="iconbtn down" title="Nach unten">↓</button>
      <button class="iconbtn" title="Löschen">✕</button>`;
    const [fly, up, down, del] = card.querySelectorAll('button');
    fly.onclick = () => map.flyTo({ center: k.center, zoom: k.zoom, pitch: k.pitch, bearing: k.bearing, duration: 1500, essential: true });
    up.onclick = () => { if (i > 0) { swap(state.keyframes, i, i - 1); renderKeyframes(); persist(); } };
    down.onclick = () => { if (i < state.keyframes.length - 1) { swap(state.keyframes, i, i + 1); renderKeyframes(); persist(); } };
    del.onclick = () => { state.keyframes.splice(i, 1); renderKeyframes(); persist(); };
    list.appendChild(card);
  });
}
const swap = (a, i, j) => { [a[i], a[j]] = [a[j], a[i]]; };

/* ============================================================
   LÄNDER
   ============================================================ */
function toggleCountry(name) {
  if (!name) return;
  const idx = state.countries.findIndex((c) => c.name === name);
  if (idx >= 0) state.countries.splice(idx, 1);
  else state.countries.push({ name, color: el.countryColor.value });
  applyHighlights(); renderCountries(); persist();
}

function renderCountries() {
  const list = el.countryList;
  if (state.countries.length === 0) {
    list.innerHTML = '<div class="empty">Klicke Länder auf der Karte an.</div>';
    return;
  }
  list.innerHTML = '';
  state.countries.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <span class="swatch" style="background:${c.color}"></span>
      <div class="grow"><div class="title">${c.name}</div></div>
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

el.routeToggle.addEventListener('change', () => {
  state.route = el.routeToggle.checked;
  applyRoute(); persist();
});

function addMarker(lng, lat, label) {
  state.markers.push({ id: nextId(), lng: +lng.toFixed(4), lat: +lat.toFixed(4), label: label || 'Marker', emoji: '' });
  renderMarkers(); applyRoute(); persist();
}

function renderMarkers() {
  // DOM-Marker neu aufbauen
  markerObjects.forEach((m) => m.remove());
  markerObjects = [];
  state.markers.forEach((mk) => {
    const wrap = document.createElement('div');
    wrap.className = 'mc-marker';
    wrap.innerHTML = `<div class="dot"></div><div class="lab">${mk.emoji ? mk.emoji + ' ' : ''}${escapeHtml(mk.label)}</div>`;
    const obj = new maplibregl.Marker({ element: wrap, anchor: 'bottom' }).setLngLat([mk.lng, mk.lat]).addTo(map);
    markerObjects.push(obj);
  });

  // Liste
  const list = el.markerList;
  if (state.markers.length === 0) {
    list.innerHTML = '<div class="empty">Marker-Modus aktivieren und auf die Karte klicken.</div>';
    return;
  }
  list.innerHTML = '';
  state.markers.forEach((mk, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <input class="emoji" value="${mk.emoji}" placeholder="🏳️" style="width:38px;text-align:center;background:var(--panel-2);border:1px solid var(--line);border-radius:8px;color:var(--txt);padding:6px 2px" />
      <input class="lab" value="${escapeAttr(mk.label)}" style="flex:1;min-width:0;background:var(--panel-2);border:1px solid var(--line);border-radius:8px;color:var(--txt);padding:7px 9px;font-size:13px" />
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

/* ---------- Globaler Karten-Klick ---------- */
map.on('click', (e) => {
  if (markerMode) {
    addMarker(e.lngLat.lng, e.lngLat.lat);
    return;
  }
  if (activeTab === 'countries') {
    const feats = map.queryRenderedFeatures(e.point, { layers: ['country-fill'] });
    if (feats.length) {
      const pr = feats[0].properties;
      const name = pr.ADMIN || pr.NAME || pr.name || pr.name_en || pr.NAME_EN || pr.sovereignt;
      toggleCountry(name);
    }
  }
});
map.on('mouseenter', 'country-fill', () => { if (activeTab === 'countries' && !markerMode) el.map.style.cursor = 'pointer'; });
map.on('mouseleave', 'country-fill', () => { if (!markerMode) el.map.style.cursor = ''; });

/* ============================================================
   TABS
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

/* ============================================================
   STYLE / RATIO / GLOBE Toolbar
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
el.globeToggle.addEventListener('change', () => {
  state.globe = el.globeToggle.checked; applyProjection(); persist();
});

let currentRatio = 'free';
function updateFrameGuide(ratio) {
  if (ratio) currentRatio = ratio;
  const g = el.frameGuide;
  if (currentRatio === 'free') { g.classList.add('hidden'); return; }
  const [rw, rh] = currentRatio.split(':').map(Number);
  const stage = $('#stage').getBoundingClientRect();
  const margin = 0.86;
  let w = stage.width * margin, h = w * rh / rw;
  if (h > stage.height * margin) { h = stage.height * margin; w = h * rw / rh; }
  g.style.width = w + 'px'; g.style.height = h + 'px';
  g.classList.remove('hidden');
}
window.addEventListener('resize', () => updateFrameGuide());

/* ============================================================
   PLAYBACK
   ============================================================ */
function setPlaying(v) {
  playing = v;
  el.play.disabled = v; el.stop.disabled = !v;
  el.frameGuide.style.borderColor = v ? 'rgba(34,211,238,.9)' : 'rgba(255,255,255,.55)';
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function flyToAsync(k) {
  return new Promise((res) => {
    const done = () => { map.off('moveend', done); res(); };
    map.on('moveend', done);
    map.flyTo({ center: k.center, zoom: k.zoom, pitch: k.pitch, bearing: k.bearing, duration: k.duration || 3000, curve: 1.5, essential: true });
  });
}
async function playTour() {
  if (state.keyframes.length < 1) { toast('Füge zuerst Keyframes hinzu'); return; }
  setPlaying(true);
  const f = state.keyframes[0];
  map.jumpTo({ center: f.center, zoom: f.zoom, pitch: f.pitch, bearing: f.bearing });
  await wait(700);
  for (let i = 1; i < state.keyframes.length && playing; i++) {
    await flyToAsync(state.keyframes[i]);
    if (playing) await wait(500);
  }
  setPlaying(false);
}
el.play.addEventListener('click', playTour);
el.stop.addEventListener('click', () => { setPlaying(false); map.stop(); });

/* ============================================================
   SUCHE (Nominatim Geocoding — frei)
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
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      el.searchResults.innerHTML = '<div>Keine Treffer</div>';
      el.searchResults.classList.remove('hidden'); return;
    }
    el.searchResults.innerHTML = '';
    data.forEach((r) => {
      const d = document.createElement('div');
      d.textContent = r.display_name;
      d.onclick = () => {
        el.searchResults.classList.add('hidden');
        el.search.value = r.display_name.split(',')[0];
        map.flyTo({ center: [+r.lon, +r.lat], zoom: 5, duration: 2000, essential: true });
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
const STORAGE_KEY = 'mapcinema.project.v1';
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) applyState(JSON.parse(raw));
  } catch (e) {}
}
function applyState(s) {
  const prevStyle = state.style;
  state = Object.assign(structuredClone(DEFAULT_STATE), s);
  // UI sync
  el.routeToggle.checked = state.route;
  el.globeToggle.checked = state.globe;
  $('#style-seg .active')?.classList.remove('active');
  $(`#style-seg [data-style="${state.style}"]`)?.classList.add('active');
  // Style nur neu laden, wenn sich die Variante wirklich geändert hat.
  if (PALETTES[state.style] && state.style !== prevStyle) {
    map.setStyle(buildStyle(state.style));
  }
  applyProjection();
  renderKeyframes(); renderCountries(); renderMarkers();
  reapplyDynamic();
}

$('#btn-save').addEventListener('click', () => { persist(); toast('Projekt gespeichert'); });

$('#btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mapcinema-projekt.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('#btn-import').addEventListener('click', () => el.fileImport.click());
el.fileImport.addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { applyState(JSON.parse(reader.result)); persist(); toast('Projekt importiert'); }
    catch (err) { toast('Datei ungültig'); }
  };
  reader.readAsText(file);
  el.fileImport.value = '';
});

$('#btn-demo').addEventListener('click', loadDemo);
function loadDemo() {
  applyState({
    style: 'night', globe: true, route: true,
    keyframes: [
      { id: nextId(), center: [10, 45], zoom: 2.4, pitch: 0, bearing: 0, duration: 2500 },
      { id: nextId(), center: [2.35, 48.86], zoom: 4.8, pitch: 45, bearing: -20, duration: 3500 },
      { id: nextId(), center: [12.5, 41.9], zoom: 5.2, pitch: 55, bearing: 15, duration: 3500 },
      { id: nextId(), center: [23.7, 38.0], zoom: 5, pitch: 50, bearing: 0, duration: 3500 },
    ],
    countries: [
      { name: 'France', color: '#22d3ee' },
      { name: 'Italy', color: '#a855f7' },
      { name: 'Greece', color: '#f5c451' },
    ],
    markers: [
      { id: nextId(), lng: 2.35, lat: 48.86, label: 'Paris', emoji: '🗼' },
      { id: nextId(), lng: 12.5, lat: 41.9, label: 'Rom', emoji: '🏛️' },
      { id: nextId(), lng: 23.7, lat: 38.0, label: 'Athen', emoji: '🏺' },
    ],
  });
  persist();
  toast('Demo geladen — ▶ Tour abspielen');
}

/* ============================================================
   HILFEN
   ============================================================ */
function updateReadout() {
  const c = map.getCenter();
  el.readout.textContent =
    `Lng ${c.lng.toFixed(2)} · Lat ${c.lat.toFixed(2)} · Zoom ${map.getZoom().toFixed(1)} · Neig ${map.getPitch().toFixed(0)}° · Dreh ${map.getBearing().toFixed(0)}°`;
}
let toastTimer = null;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 2400);
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s) { return escapeHtml(s); }

/* Tastatur: Leertaste = Play/Stop */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    if (playing) { setPlaying(false); map.stop(); } else playTour();
  }
});

/* Erststart-Render */
renderKeyframes(); renderCountries(); renderMarkers();
