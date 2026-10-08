(function(){
'use strict';
/* ============================================================
   KM1 Training – die Präsentation.
   Kern: Bühne, Navigation, Telefon, Übergänge, Hintergrund, Ton.
   Die Szenen der einzelnen Folien stehen in SZENEN (szenen.js).
   ============================================================ */
var D = document, root = D.documentElement;
root.classList.add('js');
var stage = D.getElementById('stage');
var reduziert = false;
try { reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* ---------- kleine Werkzeuge ---------- */
var U = window.KM1U = {};
U.clamp = function(v, a, b){ return v < a ? a : v > b ? b : v; };
U.lerp = function(a, b, t){ return a + (b - a) * t; };
U.aus = function(t){ return 1 - Math.pow(1 - t, 3); };
U.inaus = function(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
U.aus5 = function(t){ return 1 - Math.pow(1 - t, 5); };
U.zufall = function(seed){ var s = seed >>> 0; return function(){ s += 0x6D2B79F5; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
U.hash = function(i){ var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
U.reduziert = reduziert;

/* Eine Feder als CSS-Kurve: linear() mit 49 Stützstellen. */
function federKurve(steif, daempf){
  var x = 0, v = 0, dt = 1 / 240, t = 0, s = [];
  while (t < 3){ var a = steif * (1 - x) - daempf * v; v += a * dt; x += v * dt; t += dt; s.push(x);
    if (t > .25 && Math.abs(1 - x) < .0008 && Math.abs(v) < .01) break; }
  var n = 48, out = [];
  for (var i = 0; i <= n; i++){ var k = Math.min(s.length - 1, Math.round(i / n * (s.length - 1))); out.push(i === 0 ? 0 : i === n ? 1 : +s[k].toFixed(4)); }
  return 'linear(' + out.join(',') + ')';
}
try {
  if (CSS.supports('transition-timing-function', 'linear(0, 1)')){
    root.style.setProperty('--spring', federKurve(170, 17));
    U.feder = federKurve(150, 15);
  }
} catch (e) {}
U.feder = U.feder || 'cubic-bezier(.34,1.45,.64,1)';

/* ---------- Bühne skalieren ---------- */
var K = 1, Q = 1;
var leinwaende = [];   // alle Canvas mit Auflösung je nach Skalierung
U.leinwand = function(cv, faktor){
  var l = { cv: cv, ctx: cv.getContext('2d'), faktor: faktor || 1, q: 1, beiGroesse: null };
  leinwaende.push(l); groesse(l); return l;
};
function groesse(l){
  var q = Math.max(.5, Math.min(2, K * (window.devicePixelRatio || 1))) * l.faktor;
  l.q = q; l.cv.width = Math.round(1920 * q); l.cv.height = Math.round(1080 * q);
  l.ctx.setTransform(q, 0, 0, q, 0, 0);
  if (l.beiGroesse) l.beiGroesse();
}
function skalieren(){
  K = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.setProperty('--k', K);
  leinwaende.forEach(groesse);
}
U.zuBuehne = function(clientX, clientY){
  var r = stage.getBoundingClientRect();
  return { x: (clientX - r.left) / r.width * 1920, y: (clientY - r.top) / r.height * 1080 };
};

/* ---------- Buchstaben aufteilen ---------- */
D.querySelectorAll('[data-a=chars]').forEach(function(el){
  var text = el.textContent.trim(), i = 0;
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map(function(w){
    return '<span class="w" aria-hidden="true">' + Array.from(w).map(function(c){ return '<span class="ch" style="--i:' + (i++) + '">' + c + '</span>'; }).join('') + '</span>';
  }).join(' ');
});

/* ============================================================
   Ton: alles synthetisch, aus bis man ihn einschaltet
   ============================================================ */
var Ton = U.ton = { an: false, ac: null };
function ac(){
  if (!Ton.ac){ try { Ton.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (Ton.ac.state === 'suspended') Ton.ac.resume();
  return Ton.ac;
}
function rauschen(c, dauer){
  var b = c.createBuffer(1, Math.ceil(c.sampleRate * dauer), c.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  var s = c.createBufferSource(); s.buffer = b; return s;
}
function huelle(c, g, t, a, h, lautst){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lautst, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + h); }
Ton.spiel = function(art, staerke){
  if (!Ton.an) return; var c = ac(); if (!c) return;
  var t = c.currentTime, v = staerke || 1, g, o, n, f;
  if (art === 'klack'){
    n = rauschen(c, .12); f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; g = c.createGain();
    huelle(c, g, t, .002, .09, .5 * v); n.connect(f).connect(g).connect(c.destination); n.start(t);
    o = c.createOscillator(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + .18);
    var g2 = c.createGain(); huelle(c, g2, t, .004, .2, .45 * v); o.connect(g2).connect(c.destination); o.start(t); o.stop(t + .3);
  } else if (art === 'tick'){
    n = rauschen(c, .03); f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2600; g = c.createGain();
    huelle(c, g, t, .001, .02, .18 * v); n.connect(f).connect(g).connect(c.destination); n.start(t);
  } else if (art === 'wusch'){
    n = rauschen(c, .7); f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2600, t + .35); f.frequency.exponentialRampToValueAtTime(500, t + .65);
    g = c.createGain(); huelle(c, g, t, .12, .5, .12 * v); n.connect(f).connect(g).connect(c.destination); n.start(t);
  } else if (art === 'kick'){
    o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    g = c.createGain(); huelle(c, g, t, .002, .16, .8 * v); o.connect(g).connect(c.destination); o.start(t); o.stop(t + .25);
    n = rauschen(c, .05); f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; var g3 = c.createGain();
    huelle(c, g3, t, .001, .04, .3 * v); n.connect(f).connect(g3).connect(c.destination); n.start(t);
  } else if (art === 'netz'){
    n = rauschen(c, .6); f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(400, t + .5);
    g = c.createGain(); huelle(c, g, t, .01, .5, .3 * v); n.connect(f).connect(g).connect(c.destination); n.start(t);
  } else if (art === 'plopp'){
    o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(620, t); o.frequency.exponentialRampToValueAtTime(980, t + .06);
    g = c.createGain(); huelle(c, g, t, .003, .1, .16 * v); o.connect(g).connect(c.destination); o.start(t); o.stop(t + .15);
  } else if (art === 'jubel'){
    n = rauschen(c, 2.4); f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .5;
    g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16 * v, t + .35); g.gain.exponentialRampToValueAtTime(.0001, t + 2.3);
    n.connect(f).connect(g).connect(c.destination); n.start(t);
  }
};

/* ============================================================
   Das Telefon: eine Feder für jede Größe, dazu Neigung zur Maus
   ============================================================ */
var phone = D.getElementById('phone'), schatten = D.getElementById('phoneShadow');
var bildEl = D.getElementById('phone-bild'), tippEl = D.getElementById('phone-tipp'), toastEl = D.getElementById('phone-toast');
var statusEl = phone.querySelector('.status');
var SCHLUESSEL = ['x', 'y', 's', 'ry', 'rx', 'rz', 'o'];
var Tel = U.tel = { wert: {}, vel: {}, ziel: {}, sichtbar: false, neigung: { x: 0, y: 0, zx: 0, zy: 0 }, bild: null };
SCHLUESSEL.forEach(function(k){ Tel.wert[k] = k === 's' ? .8 : k === 'o' ? 0 : k === 'x' ? 1400 : k === 'y' ? 1500 : 0; Tel.vel[k] = 0; Tel.ziel[k] = Tel.wert[k]; });

Tel.zu = function(z){
  if (!z){
    if (Tel.sichtbar){ Tel.ziel.y = Tel.wert.y + 260; Tel.ziel.s = Tel.wert.s * .85; Tel.ziel.rx = 18; }
    Tel.ziel.o = 0; Tel.sichtbar = false; return;
  }
  var neu = { x: z.x, y: z.y, s: z.s || 1, ry: z.ry || 0, rx: z.rx || 0, rz: z.rz || 0, o: 1 };
  if (!Tel.sichtbar && Tel.wert.o < .1){
    // Hereinfliegen: von unten, gedreht, kleiner
    Tel.wert.x = neu.x + 160; Tel.wert.y = neu.y + 720; Tel.wert.s = neu.s * .78; Tel.wert.ry = neu.ry + 38; Tel.wert.rx = 26; Tel.wert.rz = neu.rz - 14;
    SCHLUESSEL.forEach(function(k){ Tel.vel[k] = 0; });
  }
  SCHLUESSEL.forEach(function(k){ Tel.ziel[k] = neu[k]; });
  Tel.sichtbar = true;
  if (reduziert) SCHLUESSEL.forEach(function(k){ Tel.wert[k] = Tel.ziel[k]; Tel.vel[k] = 0; });
};
Tel.stoss = function(ds){ Tel.vel.s += ds; };
/* Die Mitte des Bildschirms auf der Bühne, für Treffpunkte auf dem Bild. */
Tel.punkt = function(fx, fy){
  var w = Tel.ziel, s = w.s;
  return { x: w.x + (-202 + fx * 404) * s, y: w.y + (-480 + 18 + 50 + fy * 874) * s };
};
function telefonSchritt(dt, t){
  var h = 1 / 120, n = Math.max(1, Math.min(8, Math.round(dt / h)));
  for (var i = 0; i < n; i++){
    SCHLUESSEL.forEach(function(k){
      var steif = k === 'o' ? 70 : 105, d = k === 'o' ? 17 : 17.5;
      var a = steif * (Tel.ziel[k] - Tel.wert[k]) - d * Tel.vel[k];
      Tel.vel[k] += a * h; Tel.wert[k] += Tel.vel[k] * h;
    });
  }
  var N = Tel.neigung; N.x += (N.zx - N.x) * Math.min(1, dt * 4); N.y += (N.zy - N.y) * Math.min(1, dt * 4);
  var w = Tel.wert, schweb = reduziert ? 0 : Math.sin(t * 1.1) * 6, dreh = reduziert ? 0 : Math.sin(t * .8) * .5;
  phone.style.transform = 'translate3d(' + w.x.toFixed(2) + 'px,' + (w.y + schweb).toFixed(2) + 'px,0) rotateY(' + (w.ry + N.x).toFixed(2) + 'deg) rotateX(' + (w.rx + N.y).toFixed(2) + 'deg) rotateZ(' + (w.rz + dreh).toFixed(2) + 'deg) scale(' + w.s.toFixed(4) + ')';
  phone.style.opacity = U.clamp(w.o, 0, 1).toFixed(3);
  phone.style.visibility = w.o < .005 ? 'hidden' : 'visible';
  schatten.style.transform = 'translate3d(' + w.x.toFixed(1) + 'px,' + (w.y + 480 * w.s + 46).toFixed(1) + 'px,0) scale(' + (w.s * (1 - schweb / 160)).toFixed(3) + ',' + (w.s * .9).toFixed(3) + ')';
  schatten.style.opacity = (U.clamp(w.o, 0, 1) * .85).toFixed(3);
}

/* Bilder auf dem Telefon. art: blende, schieben, zurueck, scrollen, tippen */
var BILDER_DUNKEL = { 'dunkel-start': 1, 'dunkel-video': 1 };
var vorrat = {};
/* Eine Datei für sich bringt ihre Bilder in window.KM1BILDER mit. */
function bildUrl(n){ var m = window.KM1BILDER; return (m && m['s-' + n]) || 'img/s-' + n + '.webp'; }
U.vorladen = function(namen){ namen.forEach(function(n){ if (!vorrat[n]){ var i = new Image(); i.src = bildUrl(n); vorrat[n] = i; } }); };
Tel.zeige = function(name, art, opt){
  opt = opt || {};
  if (Tel.bild === name && !opt.immer) return Promise.resolve();
  Tel.bild = name;
  live.weg();
  var img = new Image(); img.alt = ''; img.src = bildUrl(name); img.decoding = 'async';
  var alt = Array.prototype.slice.call(bildEl.querySelectorAll('img'));
  statusEl.classList.toggle('dunkel', !!BILDER_DUNKEL[name]);
  bildEl.appendChild(img);
  if (reduziert || !art || alt.length === 0) art = alt.length ? 'blende' : 'keine';
  var anims = [], dauer = 760, sanft = 'cubic-bezier(.2,.9,.25,1)';
  if (art === 'schieben' || art === 'zurueck'){
    var r = art === 'schieben' ? 1 : -1;
    anims.push(img.animate([{ transform: 'translateX(' + (404 * r) + 'px)', boxShadow: '-20px 0 40px rgba(0,0,0,.25)' }, { transform: 'translateX(0)', boxShadow: '0 0 0 rgba(0,0,0,0)' }], { duration: dauer, easing: sanft }));
    alt.forEach(function(a){ anims.push(a.animate([{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: 'translateX(' + (-120 * r) + 'px)', filter: 'brightness(.75)' }], { duration: dauer, easing: sanft, fill: 'forwards' })); });
  } else if (art === 'scrollen'){
    anims.push(img.animate([{ transform: 'translateY(320px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 900, easing: sanft }));
    alt.forEach(function(a){ anims.push(a.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-320px)', opacity: 0 }], { duration: 900, easing: sanft, fill: 'forwards' })); });
  } else if (art === 'tippen'){
    var px = (opt.x || .5) * 404, py = (opt.y || .5) * 874;
    Tel.tipp(opt.x || .5, opt.y || .5);
    anims.push(img.animate([{ clipPath: 'circle(0px at ' + px + 'px ' + py + 'px)' }, { clipPath: 'circle(1000px at ' + px + 'px ' + py + 'px)' }], { duration: 900, delay: 260, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'backwards' }));
  } else if (art === 'blende'){
    anims.push(img.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 600, easing: sanft }));
  }
  return Promise.all(anims.map(function(a){ return a.finished.catch(function(){}); })).then(function(){
    if (Tel.bild !== name) return;
    alt.forEach(function(a){ if (a.parentNode) a.parentNode.removeChild(a); });
  });
};
Tel.tipp = function(fx, fy){
  tippEl.style.left = (18 + fx * 404) + 'px'; tippEl.style.top = (18 + 50 + fy * 874) + 'px';
  tippEl.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)', offset: .35 }, { opacity: 0, transform: 'scale(1.35)' }], { duration: 700, easing: 'ease-out' });
  Ton.spiel('plopp');
};
var toastT = 0;
Tel.toast = function(text){
  toastEl.textContent = text; toastEl.classList.add('an'); clearTimeout(toastT);
  toastT = setTimeout(function(){ toastEl.classList.remove('an'); }, 2600);
};
Tel.toastWeg = function(){ toastEl.classList.remove('an'); };

/* Die echte App im Telefon, für die Folie „Live“. */
var live = U.live = { frame: null, ok: null };
live.an = function(beiFertig){
  if (window.KM1_OHNE_LIVE){ if (beiFertig) beiFertig(false); return; }
  if (live.frame){ if (beiFertig) beiFertig(live.ok); return; }
  /* Die App soll gleich in der Vorführung starten. Liegt die Präsentation
     neben der echten App (gleiche Adresse), werden die alten Werte danach
     zurückgelegt, damit die eigene App des Zuschauers unverändert bleibt. */
  merken();
  try { localStorage.setItem('km1-erster-start', '1'); localStorage.setItem('km1-vorfuehrung', '1'); } catch (e) {}
  var f = D.createElement('iframe');
  f.title = 'KM1 Training, die App'; f.src = window.KM1_APP_URL || 'app/index.html'; f.setAttribute('loading', 'eager');
  f.style.opacity = '0'; f.style.transition = 'opacity .6s';
  live.frame = f; live.ok = null;
  var fertig = false, uhr = setTimeout(function(){ ende(false); }, 9000);
  function ende(ok){
    if (fertig) return; fertig = true; clearTimeout(uhr); live.ok = ok;
    setTimeout(zuruecklegen, 1500);
    if (ok){ f.style.opacity = '1'; phone.classList.add('ist-live'); statusEl.classList.remove('dunkel'); }
    if (beiFertig) beiFertig(ok);
  }
  f.addEventListener('load', function(){
    setTimeout(function(){
      var ok = false;
      try { ok = !!(f.contentWindow && typeof f.contentWindow.wechsleSicht === 'function'); } catch (e) { ok = false; }
      ende(ok);
    }, 900);
  });
  bildEl.parentNode.insertBefore(f, tippEl);
};
var gemerkt = null;
function merken(){
  if (gemerkt) return;
  try { gemerkt = { e: localStorage.getItem('km1-erster-start'), v: localStorage.getItem('km1-vorfuehrung') }; } catch (e) { gemerkt = null; }
}
function zuruecklegen(){
  if (!gemerkt) return;
  try {
    if (gemerkt.e === null) localStorage.removeItem('km1-erster-start'); else localStorage.setItem('km1-erster-start', gemerkt.e);
    if (gemerkt.v === null) localStorage.removeItem('km1-vorfuehrung'); else localStorage.setItem('km1-vorfuehrung', gemerkt.v);
  } catch (e) {}
  gemerkt = null;
}
window.addEventListener('pagehide', zuruecklegen);
live.weg = function(){
  if (!live.frame) return;
  var f = live.frame; live.frame = null; live.ok = null; phone.classList.remove('ist-live');
  if (f.parentNode) f.parentNode.removeChild(f);
};
live.rolle = function(r){
  if (!live.frame || !live.ok) return false;
  try { var w = live.frame.contentWindow; w.wechsleSicht(r); w.state.tab = 'start'; w.render(); return true; } catch (e) { return false; }
};

/* ============================================================
   Hintergrund: Flutlicht, Dunst und Staub, für alle Folien
   ============================================================ */
var BG = U.bg = { L: 0, zielL: 0, farbe: [232, 245, 236], zielFarbe: [232, 245, 236], blitz: 0 };
var bgL = U.leinwand(D.getElementById('bg'), .5);
var staub = [];
(function(){ var r = U.zufall(7); for (var i = 0; i < 130; i++) staub.push({ x: r() * 1920, y: r() * 1080, vx: (r() - .5) * 8, vy: -4 - r() * 10, s: .6 + r() * 1.8, p: r() * 6.28 }); })();
var LICHTER = [[250, -60, 1.15], [1670, -60, 1.15], [760, -110, .8], [1160, -110, .8]];
function hintergrund(t, dt){
  var c = bgL.ctx;
  BG.L += (BG.zielL - BG.L) * Math.min(1, dt * 1.6);
  for (var i = 0; i < 3; i++) BG.farbe[i] += (BG.zielFarbe[i] - BG.farbe[i]) * Math.min(1, dt * 1.2);
  BG.blitz *= Math.pow(.04, dt);
  var L = BG.L + BG.blitz, f = BG.farbe, fc = 'rgba(' + (f[0] | 0) + ',' + (f[1] | 0) + ',' + (f[2] | 0) + ',';
  c.globalCompositeOperation = 'source-over';
  var g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, '#08120d'); g.addColorStop(.55, '#060c09'); g.addColorStop(1, '#040705');
  c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  if (L < .003) return;
  c.globalCompositeOperation = 'lighter';
  LICHTER.forEach(function(l, k){
    var x = l[0], y = l[1], s = l[2], flackern = 1 + Math.sin(t * 7 + k * 2) * .015;
    var r = c.createRadialGradient(x, y, 0, x, y, 520 * s); r.addColorStop(0, fc + (.32 * L * flackern) + ')'); r.addColorStop(.3, fc + (.09 * L) + ')'); r.addColorStop(1, fc + '0)');
    c.fillStyle = r; c.fillRect(x - 600 * s, y - 600 * s, 1200 * s, 1200 * s);
    // Lichtkegel
    var zx = 960 + (x - 960) * .25, lg = c.createLinearGradient(x, y, zx, 1080);
    lg.addColorStop(0, fc + (.07 * L) + ')'); lg.addColorStop(1, fc + '0)');
    c.fillStyle = lg; c.beginPath(); c.moveTo(x - 40 * s, y); c.lineTo(x + 40 * s, y); c.lineTo(zx + 520 * s, 1080); c.lineTo(zx - 520 * s, 1080); c.closePath(); c.fill();
  });
  // Dunst
  var dx = Math.sin(t * .05) * 200, h1 = c.createRadialGradient(700 + dx, 640, 0, 700 + dx, 640, 760);
  h1.addColorStop(0, fc + (.035 * L) + ')'); h1.addColorStop(1, fc + '0)'); c.fillStyle = h1; c.fillRect(0, 0, 1920, 1080);
  // Staub im Licht
  for (var j = 0; j < staub.length; j++){
    var p = staub[j]; p.x += p.vx * dt; p.y += p.vy * dt; p.p += dt;
    if (p.y < -10){ p.y = 1090; p.x = Math.random() * 1920; }
    if (p.x < -10) p.x = 1930; if (p.x > 1930) p.x = -10;
    var nah = Math.max(0, 1 - Math.min(Math.abs(p.x - 250), Math.abs(p.x - 1670)) / 700) * (1 - p.y / 1300);
    var a = (.12 + .5 * nah) * L * (.6 + .4 * Math.sin(p.p * 2));
    if (a < .01) continue;
    c.fillStyle = fc + a.toFixed(3) + ')'; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 6.283); c.fill();
  }
  c.globalCompositeOperation = 'source-over';
}

/* ============================================================
   Effektebene: Kreidestaub für die Übergänge und Ausbrüche
   ============================================================ */
var fxL = U.leinwand(D.getElementById('fx'), 1);
var teile = [];
U.staubwolke = function(x, y, n, opt){
  opt = opt || {};
  for (var i = 0; i < n; i++){
    var w = Math.random() * 6.283, v = (opt.v || 300) * (.3 + Math.random());
    teile.push({ x: x + (Math.random() - .5) * (opt.streu || 10), y: y + (Math.random() - .5) * (opt.streu || 10), vx: Math.cos(w) * v + (opt.vx || 0), vy: Math.sin(w) * v + (opt.vy || 0),
      l: 0, max: .5 + Math.random() * (opt.leben || .8), s: 1 + Math.random() * (opt.groesse || 3.5), rot: Math.random() < (opt.rot || 0), g: opt.g || 0 });
  }
};
var kante = null;   // die Kante des laufenden Kreidewischs
function effekte(dt){
  var c = fxL.ctx;
  c.clearRect(0, 0, 1920, 1080);
  if (kante){
    // Kreidestrich entlang der Kante: kurze, raue Striche
    c.save(); c.lineCap = 'round';
    for (var k = 0; k < 70; k++){
      var u = Math.random(), x = U.lerp(kante.ox, kante.ux, u) + (Math.random() - .5) * 26, y = u * 1080 + (Math.random() - .5) * 20;
      c.strokeStyle = Math.random() < .14 ? 'rgba(238,74,64,' + (.25 + Math.random() * .5) + ')' : 'rgba(242,245,241,' + (.2 + Math.random() * .6) + ')';
      c.lineWidth = 2 + Math.random() * 7; c.beginPath(); c.moveTo(x, y); c.lineTo(x - kante.dir * (8 + Math.random() * 40), y + (Math.random() - .5) * 10); c.stroke();
    }
    c.restore();
  }
  for (var i = teile.length - 1; i >= 0; i--){
    var p = teile[i]; p.l += dt;
    if (p.l > p.max){ teile.splice(i, 1); continue; }
    p.vx *= Math.pow(.18, dt); p.vy = p.vy * Math.pow(.18, dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    var a = 1 - p.l / p.max;
    c.fillStyle = p.rot ? 'rgba(238,74,64,' + (a * .8).toFixed(3) + ')' : 'rgba(242,245,241,' + (a * .75).toFixed(3) + ')';
    c.fillRect(p.x, p.y, p.s, p.s);
  }
}

/* ============================================================
   Folien, Schritte, Übergänge
   ============================================================ */
var folien = Array.prototype.slice.call(D.querySelectorAll('.slide'));
var N = folien.length, akt = -1, schritt = 0, laufend = null;
var SZ = {};
var aktiveSzenen = [];
function szene(f){ return SZ[f.id] || {}; }
function schritteVon(f){ return +f.dataset.schritte || 1; }

function zeigeSchritt(f, s, sofort){
  if (sofort){ f.classList.add('instant'); }
  f.querySelectorAll('[data-a]').forEach(function(el){ el.classList.toggle('on', (+el.dataset.s || 0) <= s); });
  if (sofort){ void f.offsetWidth; requestAnimationFrame(function(){ requestAnimationFrame(function(){ f.classList.remove('instant'); }); }); }
}
function zuruecksetzen(f){ f.classList.add('instant'); f.querySelectorAll('[data-a]').forEach(function(el){ el.classList.remove('on'); }); void f.offsetWidth; f.classList.remove('instant'); }

function telefonFuer(f, s, art){
  var sz = szene(f), p = sz.telefon ? sz.telefon(s) : null;
  Tel.zu(p);
  if (p && p.bild) Tel.zeige(p.bild, art || p.art || 'blende', p);
}

function geh(n, opt){
  opt = opt || {};
  n = U.clamp(n, 0, N - 1);
  if (n === akt && !opt.immer) return;
  if (laufend) laufend();
  var alt = akt >= 0 ? folien[akt] : null, neu = folien[n], dir = n > akt ? 1 : -1;
  var s = opt.ende ? schritteVon(neu) - 1 : 0;
  zuruecksetzen(neu);
  neu.classList.add('active');
  if (alt){ alt.classList.remove('active'); alt.classList.add('leaving'); }
  akt = n; schritt = s;
  var sz = szene(neu);
  BG.zielL = sz.licht != null ? sz.licht : .55;
  BG.zielFarbe = (sz.farbe || [232, 245, 236]).slice();
  if (sz.betreten) sz.betreten(s, dir);
  if (sz.bild && aktiveSzenen.indexOf(sz) < 0) aktiveSzenen.push(sz);
  if (s > 0) zeigeSchritt(neu, s, true);
  else setTimeout(function(){ if (folien[akt] === neu && schritt === 0) zeigeSchritt(neu, 0); }, reduziert ? 0 : (alt ? 260 : 60));
  telefonFuer(neu, s, alt ? (dir > 0 ? 'blende' : 'blende') : 'keine');
  var art = reduziert ? 'blende' : (!alt ? 'keine' : (neu.dataset.wechsel || 'wisch'));
  laufend = uebergang(alt, neu, art, dir, function(){
    laufend = null;
    if (alt){
      alt.classList.remove('leaving');
      zuruecksetzen(alt);
      var sa = szene(alt);
      if (sa.verlassen) sa.verlassen();
      var i = aktiveSzenen.indexOf(sa); if (i >= 0 && sa !== szene(folien[akt])) aktiveSzenen.splice(i, 1);
    }
  });
  if (!alt){ /* erste Folie */ }
  hud(); notizen();
  try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) {}
}
function setzeSchritt(s){
  var f = folien[akt], max = schritteVon(f) - 1; s = U.clamp(s, 0, max);
  if (s === schritt) return;
  var vor = s > schritt; schritt = s;
  zeigeSchritt(f, s);
  var sz = szene(f); if (sz.schritt) sz.schritt(s, vor);
  var p = sz.telefon ? sz.telefon(s) : null;
  Tel.zu(p);
  if (p && p.bild) Tel.zeige(p.bild, p.art || (vor ? 'schieben' : 'zurueck'), p);
  hud(); notizen();
}
U.setzeSchritt = function(s){ setzeSchritt(s); };
U.schritt = function(){ return schritt; };
function weiter(){ if (schritt < schritteVon(folien[akt]) - 1) setzeSchritt(schritt + 1); else if (akt < N - 1) geh(akt + 1); }
function zurueck(){ if (schritt > 0) setzeSchritt(schritt - 1); else if (akt > 0) geh(akt - 1, { ende: true }); }
U.weiter = weiter;

function uebergang(alt, neu, art, dir, fertig){
  var ende = false, anims = [];
  function abschluss(){
    if (ende) return; ende = true;
    neu.style.clipPath = ''; neu.style.zIndex = ''; neu.style.opacity = '';
    if (alt){ alt.style.zIndex = ''; alt.style.clipPath = ''; alt.style.transform = ''; alt.style.filter = ''; alt.style.opacity = ''; }
    anims.forEach(function(a){ try { a.cancel(); } catch (e) {} });
    kante = null;
    fertig();
  }
  if (art === 'keine' || !alt){ neu.style.zIndex = ''; setTimeout(abschluss, 0); return abschluss; }
  neu.style.zIndex = 2; alt.style.zIndex = 1;
  Ton.spiel('wusch');
  if (art === 'blende'){
    anims.push(neu.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350 }));
    anims.push(alt.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }));
    anims[0].finished.then(abschluss, abschluss);
    return abschluss;
  }
  /* Die neue Folie wird freigelegt, die alte genau dort weggeschnitten,
     damit sich nichts überlagert. Beide laufen auf derselben Uhr. */
  var t0 = performance.now(), dauer = art === 'kreis' ? 1150 : 1000;
  function bild(){
    if (ende) return;
    var p = U.clamp((performance.now() - t0) / dauer, 0, 1), e = U.inaus(p);
    alt.style.filter = 'brightness(' + (1 - .62 * e).toFixed(3) + ')';
    if (art === 'kreis'){
      var r = e * 1180, sk = 1 + .06 * e, rl = r / sk;
      neu.style.clipPath = 'circle(' + r.toFixed(1) + 'px at 960px 540px)';
      alt.style.transform = 'scale(' + sk.toFixed(4) + ')';
      alt.style.clipPath = rl < 1 ? '' : "path(evenodd, 'M-40 -40H1960V1120H-40Z M" + (960 - rl).toFixed(1) + ' 540a' + rl.toFixed(1) + ' ' + rl.toFixed(1) + ' 0 1 0 ' + (2 * rl).toFixed(1) + ' 0a' + rl.toFixed(1) + ' ' + rl.toFixed(1) + ' 0 1 0 ' + (-2 * rl).toFixed(1) + " 0Z')";
      var n = 22;
      for (var i = 0; i < n; i++){ var w = Math.random() * 6.283; U.staubwolke(960 + Math.cos(w) * r, 540 + Math.sin(w) * r, 1, { v: 160, vx: Math.cos(w) * 260, vy: Math.sin(w) * 260, leben: .5, rot: .12, groesse: 4 }); }
    } else {
      var X = e * 2420, schraeg = 420, ox, ux, tx = -70 * dir * e;
      alt.style.transform = 'translateX(' + tx.toFixed(1) + 'px)';
      if (dir > 0){
        ox = X; ux = X - schraeg;
        neu.style.clipPath = 'polygon(-500px 0px,' + ox.toFixed(1) + 'px 0px,' + ux.toFixed(1) + 'px 1080px,-500px 1080px)';
        alt.style.clipPath = 'polygon(' + (ox - tx).toFixed(1) + 'px 0px,2500px 0px,2500px 1080px,' + (ux - tx).toFixed(1) + 'px 1080px)';
      } else {
        ox = 1920 + schraeg - X; ux = ox - schraeg;
        neu.style.clipPath = 'polygon(' + ox.toFixed(1) + 'px 0px,2500px 0px,2500px 1080px,' + ux.toFixed(1) + 'px 1080px)';
        alt.style.clipPath = 'polygon(-500px 0px,' + (ox - tx).toFixed(1) + 'px 0px,' + (ux - tx).toFixed(1) + 'px 1080px,-500px 1080px)';
      }
      kante = { ox: ox, ux: ux, dir: dir };
      for (var j = 0; j < 16; j++){ var u = Math.random(); U.staubwolke(U.lerp(ox, ux, u), u * 1080, 1, { v: 120, vx: dir * (220 + Math.random() * 520), vy: (Math.random() - .5) * 80, leben: .7, rot: .15, groesse: 4.5 }); }
    }
    if (p < 1) requestAnimationFrame(bild); else abschluss();
  }
  requestAnimationFrame(bild);
  return abschluss;
}

/* ============================================================
   Leiste, Notizen, Übersicht, Hilfe
   ============================================================ */
var hudEl = D.getElementById('hud'), bahn = D.getElementById('hud-bahn'), ballEl = D.getElementById('hud-ball');
var marken = [];
folien.forEach(function(f, i){
  var m = D.createElement('i'); m.className = 'marke' + (f.classList.contains('kapitelfolie') ? ' k' : '');
  m.style.left = (i / (N - 1) * 100) + '%'; bahn.insertBefore(m, ballEl); marken.push(m);
});
function hud(){
  var p = akt / (N - 1) * 100;
  D.getElementById('hud-gelaufen').style.width = p + '%';
  ballEl.style.left = p + '%';
  ballEl.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (360 * (akt % 2 ? 1 : -1)) + 'deg)' }], { duration: 900, easing: 'cubic-bezier(.2,.9,.25,1)' });
  marken.forEach(function(m, i){ m.classList.toggle('durch', i <= akt); });
  D.getElementById('hud-nr').textContent = (akt + 1) + ' / ' + N;
  D.getElementById('hud-kapitel').textContent = folien[akt].dataset.kapitel || '';
  D.querySelectorAll('#uebersicht button').forEach(function(b, i){ b.classList.toggle('jetzt', i === akt); });
}
var NOTIZEN = window.KM1NOTIZEN || {};
function notizen(){
  var f = folien[akt], t = NOTIZEN[f.id];
  var text = typeof t === 'function' ? t(schritt) : (t || '');
  D.getElementById('notiz-text').innerHTML = text.split('\n').map(function(z){ return '<p>' + z + '</p>'; }).join('');
}
var uebersicht = D.getElementById('uebersicht');
folien.forEach(function(f, i){
  var b = D.createElement('button'); b.type = 'button';
  b.innerHTML = '<span>' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' + (f.dataset.titel || f.id);
  b.addEventListener('click', function(e){ e.stopPropagation(); panel('uebersicht', false); geh(i); });
  uebersicht.appendChild(b);
});
var panels = { notizen: D.getElementById('notizen'), uebersicht: uebersicht, hilfe: D.getElementById('hilfe') };
function panel(name, an){
  var p = panels[name]; if (an === undefined) an = !p.classList.contains('an');
  Object.keys(panels).forEach(function(k){ if (k !== name && an && k !== 'notizen') panels[k].classList.remove('an'); });
  p.classList.toggle('an', an);
  if (name === 'notizen') D.getElementById('b-notizen').setAttribute('aria-pressed', an);
}
function ton(){
  Ton.an = !Ton.an; D.getElementById('b-ton').setAttribute('aria-pressed', Ton.an);
  if (Ton.an){ ac(); Ton.spiel('plopp'); }
}
function vollbild(){
  try {
    if (!D.fullscreenElement){ var r = root.requestFullscreen || root.webkitRequestFullscreen; if (r){ var pr = r.call(root); if (pr && pr.catch) pr.catch(function(){}); } }
    else if (D.exitFullscreen){ D.exitFullscreen().catch(function(){}); }
  } catch (e) {}
}
D.getElementById('b-ton').addEventListener('click', function(e){ e.stopPropagation(); ton(); });
D.getElementById('b-notizen').addEventListener('click', function(e){ e.stopPropagation(); panel('notizen'); });
D.getElementById('b-alle').addEventListener('click', function(e){ e.stopPropagation(); panel('uebersicht'); });
D.getElementById('b-voll').addEventListener('click', function(e){ e.stopPropagation(); vollbild(); });

/* ---------- Eingaben ---------- */
D.addEventListener('keydown', function(e){
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter'){ if (k === 'Enter' && D.activeElement && D.activeElement.tagName === 'BUTTON') return; e.preventDefault(); weiter(); }
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace'){ e.preventDefault(); zurueck(); }
  else if (k === 'Home'){ geh(0); }
  else if (k === 'End'){ geh(N - 1); }
  else if (k === 'f' || k === 'F'){ vollbild(); }
  else if (k === 'n' || k === 'N'){ panel('notizen'); }
  else if (k === 'o' || k === 'O'){ panel('uebersicht'); }
  else if (k === 't' || k === 'T'){ ton(); }
  else if (k === '?' || k === 'h' || k === 'H'){ panel('hilfe'); }
  else if (k === 'Escape'){ Object.keys(panels).forEach(function(p){ panels[p].classList.remove('an'); }); }
  wach();
});
var vp = D.getElementById('viewport');
vp.addEventListener('click', function(e){
  if (e.target.closest('button,a,iframe,.panel,#hud,[data-klick]')) return;
  var p = U.zuBuehne(e.clientX, e.clientY);
  if (p.x < 1920 * .3) zurueck(); else weiter();
});
var tx = null, ty = null;
vp.addEventListener('touchstart', function(e){ var t = e.touches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
vp.addEventListener('touchend', function(e){
  if (tx === null) return; var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty; tx = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4){ if (dx < 0) weiter(); else zurueck(); }
}, { passive: true });
var ruheT = 0;
function wach(){ hudEl.classList.remove('still'); vp.style.cursor = ''; clearTimeout(ruheT); ruheT = setTimeout(function(){ hudEl.classList.add('still'); vp.style.cursor = 'none'; }, 2600); }
vp.addEventListener('pointermove', function(e){
  wach();
  var p = U.zuBuehne(e.clientX, e.clientY), nx = (p.x - 960) / 960, ny = (p.y - 540) / 540;
  Tel.neigung.zx = U.clamp(nx, -1, 1) * 7; Tel.neigung.zy = -U.clamp(ny, -1, 1) * 5;
  U.maus = p;
});
U.maus = { x: 960, y: 540 };

/* ---------- Schleife ---------- */
var zuletzt = performance.now(), start = zuletzt;
function schleife(jetzt){
  var dt = Math.min(.05, (jetzt - zuletzt) / 1000); zuletzt = jetzt;
  var t = (jetzt - start) / 1000;
  telefonSchritt(dt, t);
  hintergrund(t, dt);
  effekte(dt);
  for (var i = 0; i < aktiveSzenen.length; i++){ try { aktiveSzenen[i].bild(t, dt); } catch (e) { if (window.console) console.error(e); } }
  requestAnimationFrame(schleife);
}

/* ---------- Start ---------- */
U.N = N;
if (window.KM1SZENEN_BAU) SZ = window.KM1SZENEN_BAU(U) || {};
window.addEventListener('resize', skalieren);
skalieren();
Object.keys(SZ).forEach(function(k){ if (SZ[k].init) SZ[k].init(); });
var anf = 0;
try { var h = (location.hash || '').replace('#', ''); if (/^\d+$/.test(h)) anf = U.clamp(+h - 1, 0, N - 1); } catch (e) {}
geh(anf);
wach();
requestAnimationFrame(schleife);
if (D.fonts && D.fonts.ready) D.fonts.ready.then(function(){ Object.keys(SZ).forEach(function(k){ if (SZ[k].schriftenDa) SZ[k].schriftenDa(); }); });
})();
