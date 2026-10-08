/* ============================================================
   Die Szenen der einzelnen Folien und die Notizen.
   Jede Szene kann: licht, farbe, telefon(schritt), init(),
   betreten(schritt, richtung), schritt(s, vor), bild(t, dt), verlassen().
   ============================================================ */
window.KM1NOTIZEN = {
  titel: 'Kurz vorstellen: KM1 Fußballschule aus Köln.\nDie App heißt KM1 Training. Untertitel aus dem Store: Fußballtechnik zum Nachmachen.\nTon gibt es mit T, die Notizen mit N.',
  luecke: function(s){ return ['Training ist ein, zwei Mal die Woche. Was passiert an den Tagen dazwischen?', 'Drei Sichten: Kinder üben allein mit irgendwelchen Clips, Eltern haben keinen Einblick, Trainer sehen nicht, wer übt.', 'Die App füllt genau diese Lücke: an jedem Tag eine Übung, die passt.'][s]; },
  idee: 'Die Idee in einem Satz: Kaders Training für die Hosentasche.\nDrei Säulen: üben, gemeinsam, geschützt.\nKader ist Gründer und Trainer, er steht in den Videos.',
  k1: 'Erstes Kapitel: was ein Kind in der App erlebt.',
  heute: function(s){ return s === 0 ? 'Früher hatte die Startseite vier Stellen, die alle die Frage beantworten wollten, was heute dran ist. Das war unübersichtlich.\nWeiter: Sie werden zu einer Karte.' : 'Jetzt gibt es genau eine Antwort, in fester Reihenfolge: Hausaufgabe vom Trainer, angefangenes Video, nächste Einheit im Plan, nächster Schritt auf dem Weg.'; },
  video: function(s){ return s === 0 ? 'Jedes Video ist in Schritte zerlegt, mit Zeitmarken. Ein Tipp springt an die Stelle.\nZeitlupe bis ein Viertel, Bild für Bild.' : 'Darunter der häufigste Fehler, den fast jeder am Anfang macht. Und Abhaken: Dann füllt sich der Weg.'; },
  pyramide: 'Die KM1-Pyramide wie auf der Website: Foundational, Development, Performance, Professional.\nDer Jahrgang beim ersten Start wählt die Ebene. Jede Ebene hat einen Pfad aus fünf Einheiten.\nIm Beispiel hat Luis drei von fünf geschafft.',
  plaene: 'Drei Trainingspläne über sechs Wochen, drei Einheiten pro Woche, also 18 Einheiten.\nWoche 1 ist mit kostenlosem Konto frei, der Rest gehört zu KM1 Pro.\nDie Aufgaben in den Plänen schaut Kader noch einmal durch.',
  vergleich: 'Mit mir vergleichen: filmen, und das eigene Video läuft direkt unter Kaders Video, im selben Takt.\nWichtig für Eltern: Das Video verlässt das Handy nie. Kein Upload, auch nicht später.',
  k2: 'Zweites Kapitel: die App verbindet alle, die mit einem Kind zu tun haben.',
  rollen: function(s){ return s === 0 ? 'Acht Rollen, eine App. Jede sieht ihr eigenes Menü.\nWeiterblättern oder eine Rolle antippen.' : 'Die Rolle im Telefon ist echt aus der App. Die Namen sind erfunden und gehören zu einer Geschichte: Luis, seine Mutter Sandra, Trainer Tim.'; },
  trainer: 'Für Trainer: Hausaufgaben beim passenden Video, Feedback auf Videos der Spieler, eine Rangliste für die Challenge.\nKM1 Team kostet 12,99 € im Monat je Mannschaft. Spieler zahlen nichts.',
  eltern: function(s){ return ['Eltern sind keine Zuschauer, sie entscheiden. Unter 16 geben sie jedes Video und das Talentprofil frei.', 'Beispiel: Luis möchte, dass Scouts sein Profil sehen. Die Anfrage landet bei Sandra.', 'Sandra gibt frei. Erst dann sehen geprüfte Scouts das Profil, und Kontakt läuft nur über die Eltern.'][s]; },
  k3: 'Drittes Kapitel: Sicherheit. Das ist der Punkt, an dem Eltern und Vereine Vertrauen fassen.',
  regeln: 'Drei Regeln, überall in der App und auf dem Server: geprüft wird, wer mit Kindern arbeitet. Kein Video eines Kindes im offenen Netz. Kein Fremder schreibt einem Kind.\nDie Regeln stehen in der Datenbank, nicht nur in der Oberfläche, und 36 Tests prüfen sie.',
  haken: function(s){ return s === 0 ? 'Der blaue Haken: KM1 prüft Vereine und Akademien selbst. Die bürgen mit einem Einladungscode für Trainer, Scouts und Profis.' : 'Wer keinen Code hat, reicht Belege ein, etwa das erweiterte Führungszeugnis. KM1 prüft von Hand und kann jeden Haken wieder entziehen.'; },
  k4: 'Viertes Kapitel: Geschäftsmodell, Technik, und was bis zum Start noch fehlt.',
  geschaeft: 'Kostenlos starten: die Hälfte der Videos ohne Anmeldung, die andere Hälfte mit Konto.\nGeld kosten die Profi-Einheiten: KM1 Pro 6,99 € im Monat oder 59 € im Jahr. Für Trainer KM1 Team, für Akademien KM1 Akademie. Camps für 249 €.\nKinder sehen keine Abo-Werbung auf der Startseite.',
  technik: 'Was drinsteckt: die App im Browser ist live, die echte App für iPhone und Android ist mit Expo gebaut, der Server mit Supabase.\n67 automatische Tests, rund 910.000 Zeichen Code.',
  weg: 'Ehrlich zum Stand: Die App steht. Was jetzt fehlt, ist nicht Code, sondern Kamera, Verträge und Zusagen.\nIn dieser Reihenfolge: acht Videos drehen, Server und Store-Konten, Rechtstexte, Moderation, Rollen in der Handy-App.',
  live: 'Jetzt live: Die App läuft im Telefon wirklich. Rollen über die Knöpfe links wechseln.\nWer will, scannt den QR-Code und probiert es auf dem eigenen Handy.',
  finale: 'Danke. Mit einem Klick ins Tor kommt noch ein Schuss.'
};

window.KM1SZENEN_BAU = function(U){
var D = document, Tel = U.tel, Ton = U.ton, BG = U.bg, SZ = {};
function $(s, r){ return (r || D).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
function jetzt(){ return performance.now() / 1000; }
var uhren = [];
function spaeter(fn, ms){ var t = setTimeout(fn, U.reduziert ? 0 : ms); uhren.push(t); return t; }
function uhrenWeg(){ uhren.forEach(clearTimeout); uhren = []; }

U.vorladen(['luis-start', 'video', 'video-3', 'weg', 'plan', 'vergleich', 'sandra-start', 'tim-team', 'akademie', 'verein', 'profi', 'scout', 'km1', 'familie', 'freigabe']);

/* Kreide als Textur für die großen Kapitelzeilen */
(function(){
  var c = D.createElement('canvas'); c.width = c.height = 300; var x = c.getContext('2d'), r = U.zufall(3);
  x.fillStyle = '#F2F5F1'; x.fillRect(0, 0, 300, 300);
  for (var i = 0; i < 2600; i++){ x.fillStyle = 'rgba(11,22,17,' + (r() * .55) + ')'; var s = .6 + r() * 2.4; x.fillRect(r() * 300, r() * 300, s, s * (.5 + r())); }
  for (var j = 0; j < 90; j++){ x.strokeStyle = 'rgba(11,22,17,.18)'; x.lineWidth = .8; x.beginPath(); var a = r() * 300, b = r() * 300; x.moveTo(a, b); x.lineTo(a + r() * 40 - 20, b + r() * 6 - 3); x.stroke(); }
  try { D.documentElement.style.setProperty('--kreidetextur', 'url(' + c.toDataURL('image/png') + ')'); $$('.kapitelfolie').forEach(function(f){ f.classList.add('textur'); }); } catch (e) {}
})();

/* ============================================================
   1  Titel: Flutlicht geht an, Kreidelinien ziehen sich übers Feld
   ============================================================ */
(function(){
  var L, t0 = 0, cam = { x: 0, y: 15, z: -66 }, neig = .26, F = 1100, cx = 960, cy = 540, mausX = 0;
  var linien = [], lampen, staub = [];
  function proj(x, y, z){
    var dx = x - cam.x, dy = y - cam.y, dz = z - cam.z, cp = Math.cos(neig), sp = Math.sin(neig);
    var zc = -dy * sp + dz * cp, yc = dy * cp + dz * sp;
    if (zc < .6) return null;
    return [cx + F * dx / zc, cy - F * yc / zc, zc];
  }
  function strecke(a, b, n){ var p = []; for (var i = 0; i <= n; i++){ var t = i / n; p.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } return p; }
  function bogen(mx, mz, r, a0, a1, n){ var p = []; for (var i = 0; i <= n; i++){ var w = a0 + (a1 - a0) * i / n; p.push([mx + Math.cos(w) * r, 0, mz + Math.sin(w) * r]); } return p; }
  function L3(pts, von, bis){ linien.push({ p: pts, von: von, bis: bis }); }
  L3(strecke([-34, 0, 0], [34, 0, 0], 40), .95, 1.55);
  L3(bogen(0, 0, 9.15, Math.PI / 2, Math.PI / 2 + Math.PI * 2, 64), 1.25, 2.05);
  L3(strecke([-34, 0, -60], [-34, 0, 52.5], 90), 1.0, 2.2);
  L3(strecke([34, 0, -60], [34, 0, 52.5], 90), 1.05, 2.25);
  L3(strecke([-34, 0, 52.5], [34, 0, 52.5], 40), 2.0, 2.45);
  L3([[-20.16, 0, 52.5], [-20.16, 0, 36], [20.16, 0, 36], [20.16, 0, 52.5]].reduce(function(a, p, i, arr){ if (i === 0) return a; return a.concat(strecke(arr[i - 1], p, 16).slice(i === 1 ? 0 : 1)); }, []), 2.2, 2.75);
  L3([[-9.16, 0, 52.5], [-9.16, 0, 47], [9.16, 0, 47], [9.16, 0, 52.5]].reduce(function(a, p, i, arr){ if (i === 0) return a; return a.concat(strecke(arr[i - 1], p, 8).slice(i === 1 ? 0 : 1)); }, []), 2.45, 2.85);
  L3(bogen(0, 41.5, 9.15, Math.PI + .64, Math.PI * 2 - .64, 24), 2.6, 2.95);
  L3([[-3.66, 0, 52.5], [-3.66, 2.44, 52.5], [3.66, 2.44, 52.5], [3.66, 0, 52.5]], 2.75, 3.15);
  L3(strecke([-34, 0, -60], [34, 0, -60], 30), 1.8, 2.3);
  lampen = [
    { w: [-50, 30, 34], an: .35, ziel: [-14, 0, 14] }, { w: [50, 30, 34], an: .62, ziel: [14, 0, 14] },
    { w: [-34, 33, 82], an: .9, ziel: [-6, 0, 38] }, { w: [34, 33, 82], an: 1.15, ziel: [6, 0, 38] }
  ];
  var r = U.zufall(11);
  for (var i = 0; i < 180; i++) staub.push({ x: r() * 1920, y: r() * 900, v: 6 + r() * 16, s: .7 + r() * 1.8, p: r() * 6.28 });
  function helligkeit(l, t){
    var d = t - l.an; if (d < 0) return 0;
    if (d < .32){ return (Math.floor(d * 28) % 3 === 0) ? .2 : (Math.floor(d * 17) % 2 ? .9 : .35); }
    return Math.min(1, .7 + (d - .32) * 1.5);
  }
  SZ.titel = {
    licht: 0, telefon: function(){ return null; },
    init: function(){ L = U.leinwand($('#c-titel'), 1); },
    betreten: function(){
      t0 = jetzt();
      lampen.forEach(function(l){ spaeter(function(){ Ton.spiel('klack', .9); }, l.an * 1000); });
    },
    verlassen: function(){ uhrenWeg(); },
    bild: function(tt, dt){
      var t = U.reduziert ? 9 : jetzt() - t0, c = L.ctx;
      mausX += ((U.maus.x - 960) / 960 * 2.2 - mausX) * Math.min(1, dt * 2);
      cam.z = -66 + Math.min(t, 40) * .22; cam.x = mausX;
      c.globalCompositeOperation = 'source-over';
      var horiz = cy - F * Math.tan(neig);
      var g = c.createLinearGradient(0, 0, 0, 1080);
      g.addColorStop(0, '#030605'); g.addColorStop(horiz / 1080 - .03, '#050a07'); g.addColorStop(horiz / 1080 + .05, '#0a1910'); g.addColorStop(1, '#0d2415');
      c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
      // Mährichtung: Streifen auf dem Rasen
      for (var k = -14; k < 14; k++){
        if (k % 2) continue;
        var a = proj(-70, 0, k * 5.25), b = proj(70, 0, k * 5.25), cc = proj(70, 0, (k + 1) * 5.25), d = proj(-70, 0, (k + 1) * 5.25);
        if (!a || !b || !cc || !d) continue;
        c.fillStyle = 'rgba(120,200,140,.035)'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fill();
      }
      // Licht
      var gesamt = 0;
      c.globalCompositeOperation = 'lighter';
      lampen.forEach(function(l, i){
        var h = helligkeit(l, t); gesamt += h; l.h = h; if (h <= 0) return;
        var p = proj(l.w[0], l.w[1], l.w[2]), z = proj(l.ziel[0], 0, l.ziel[2]);
        if (!p || !z) return;
        var s = F / p[2], k = 100 / p[2];   // s: Pixel je Meter, k: Maßstab für Leuchten
        // Kegel bis auf den Rasen
        var zl = proj(l.ziel[0] - 20, 0, l.ziel[2]), zr = proj(l.ziel[0] + 20, 0, l.ziel[2]);
        if (zl && zr){
          var kg = c.createLinearGradient(p[0], p[1], z[0], z[1]); kg.addColorStop(0, 'rgba(215,240,225,' + (.07 * h) + ')'); kg.addColorStop(1, 'rgba(215,240,225,0)');
          c.fillStyle = kg; c.beginPath(); c.moveTo(p[0] - 2.5 * s, p[1]); c.lineTo(p[0] + 2.5 * s, p[1]); c.lineTo(zr[0], zr[1]); c.lineTo(zl[0], zl[1]); c.closePath(); c.fill();
          var rx = (zr[0] - zl[0]) * .6;
          c.save(); c.translate(z[0], z[1]); c.scale(1, .3); var rg = c.createRadialGradient(0, 0, 0, 0, 0, rx);
          rg.addColorStop(0, 'rgba(150,225,170,' + (.07 * h) + ')'); rg.addColorStop(1, 'rgba(150,225,170,0)'); c.fillStyle = rg; c.beginPath(); c.arc(0, 0, rx, 0, 6.283); c.fill(); c.restore();
        }
        // Hof um die Lampenbank
        var gr = 210 * k, gl = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], gr);
        gl.addColorStop(0, 'rgba(235,250,240,' + (.42 * h) + ')'); gl.addColorStop(.18, 'rgba(220,245,230,' + (.1 * h) + ')'); gl.addColorStop(1, 'rgba(220,245,230,0)');
        c.fillStyle = gl; c.fillRect(p[0] - gr, p[1] - gr, gr * 2, gr * 2);
        // Die Lampen selbst: drei Reihen zu fünf
        var bw = 3.2 * s, bh = 1.7 * s;
        c.fillStyle = 'rgba(30,36,33,' + (.8 * Math.min(1, h + .3)) + ')'; c.fillRect(p[0] - bw / 2 - 2, p[1] - bh / 2 - 2, bw + 4, bh + 4);
        for (var rr = 0; rr < 3; rr++) for (var cl = 0; cl < 5; cl++){
          c.fillStyle = 'rgba(255,255,255,' + (.92 * h) + ')';
          c.fillRect(p[0] - bw / 2 + (cl + .15) * bw / 5, p[1] - bh / 2 + (rr + .15) * bh / 3, bw / 5 * .7, bh / 3 * .7);
        }
        // Streif wie durch eine Linse
        var fw = 520 * k, lf = c.createLinearGradient(p[0] - fw, 0, p[0] + fw, 0); lf.addColorStop(0, 'rgba(200,235,255,0)'); lf.addColorStop(.5, 'rgba(220,240,255,' + (.2 * h) + ')'); lf.addColorStop(1, 'rgba(200,235,255,0)');
        c.fillStyle = lf; c.fillRect(p[0] - fw, p[1] - 1, fw * 2, 2);
      });
      // Kreidelinien
      c.globalCompositeOperation = 'source-over';
      c.lineCap = 'round';
      linien.forEach(function(li){
        var pr = U.clamp((t - li.von) / (li.bis - li.von), 0, 1); if (pr <= 0) return;
        var n = li.p.length - 1, bis = pr * n, kopf = null;
        for (var i = 0; i < Math.ceil(bis); i++){
          var a = proj(li.p[i][0], li.p[i][1], li.p[i][2]);
          var e = Math.min(1, bis - i), q = li.p[i + 1], qq = [li.p[i][0] + (q[0] - li.p[i][0]) * e, li.p[i][1] + (q[1] - li.p[i][1]) * e, li.p[i][2] + (q[2] - li.p[i][2]) * e];
          var b = proj(qq[0], qq[1], qq[2]); if (!a || !b) continue;
          var tiefe = (a[2] + b[2]) / 2, al = U.clamp(1.25 - tiefe / 150, .25, .95) * (.55 + .45 * Math.min(1, gesamt / 2));
          c.strokeStyle = 'rgba(242,245,241,' + al.toFixed(3) + ')'; c.lineWidth = Math.max(1, .16 * F / tiefe);
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
          kopf = b;
        }
        if (kopf && pr < 1){
          c.globalCompositeOperation = 'lighter';
          var kg2 = c.createRadialGradient(kopf[0], kopf[1], 0, kopf[0], kopf[1], 26); kg2.addColorStop(0, 'rgba(255,255,255,.9)'); kg2.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = kg2; c.fillRect(kopf[0] - 26, kopf[1] - 26, 52, 52);
          if (Math.random() < .5) U.staubwolke(kopf[0], kopf[1], 1, { v: 60, leben: .5, groesse: 2.5 });
          c.globalCompositeOperation = 'source-over';
        }
      });
      // Punkte: Anstoß und Elfmeter
      [[0, 0, 1.6], [0, 41.5, 2.9]].forEach(function(pp){
        if (t < pp[2]) return; var q = proj(pp[0], 0, pp[1]); if (!q) return;
        c.fillStyle = 'rgba(242,245,241,.85)'; c.beginPath(); c.ellipse(q[0], q[1], .5 * F / q[2], .2 * F / q[2], 0, 0, 6.283); c.fill();
      });
      // Staub im Licht
      c.globalCompositeOperation = 'lighter';
      var hell = Math.min(1, gesamt / 3);
      if (hell > 0){
        staub.forEach(function(p){
          p.y -= p.v * dt; p.p += dt; if (p.y < -5){ p.y = 905; p.x = Math.random() * 1920; }
          var a = (.08 + .32 * Math.max(0, 1 - Math.abs(p.x - 960) / 1100)) * hell * (.6 + .4 * Math.sin(p.p * 2.3));
          c.fillStyle = 'rgba(235,250,240,' + a.toFixed(3) + ')'; c.fillRect(p.x, p.y, p.s, p.s);
        });
      }
      c.globalCompositeOperation = 'source-over';
    }
  };
})();

/* ============================================================
   2  Lücke
   ============================================================ */
SZ.luecke = {
  licht: .3, telefon: function(){ return null; },
  betreten: function(s){ this.fuellen(s >= 2, true); },
  schritt: function(s){ this.fuellen(s >= 2, false); },
  verlassen: function(){ uhrenWeg(); this.fuellen(false, true); },
  fuellen: function(an, sofort){
    $$('#luecke .tag:not(.training)').forEach(function(t, i){
      if (sofort || !an){ t.classList.toggle('gefuellt', an); return; }
      spaeter(function(){ t.classList.add('gefuellt'); Ton.spiel('tick'); }, 150 + i * 140);
    });
  }
};

/* 3  Idee */
SZ.idee = { licht: .6, telefon: function(){ return { x: 1430, y: 545, s: .9, ry: -18, rx: 5, rz: 2, bild: 'luis-start' }; } };

/* ============================================================
   Kapitel: Kreide auf der Taktiktafel
   ============================================================ */
function kreis(mx, my, r, n, a0){ var p = []; n = n || 40; a0 = a0 || -1.4; for (var i = 0; i <= n; i++){ var w = a0 + i / n * 6.283; p.push([mx + Math.cos(w) * r, my + Math.sin(w) * r]); } return p; }
function gerade(a, b){ return [a, b]; }
function kurve(pts, n){ // Catmull-Rom durch alle Punkte
  var out = []; n = n || 14;
  for (var i = 0; i < pts.length - 1; i++){
    var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (var k = 0; k < n; k++){ var t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  out.push(pts[pts.length - 1]); return out;
}
function spitze(pts, laenge){ // zwei Striche am Ende eines Pfeils
  var b = pts[pts.length - 1], a = pts[Math.max(0, pts.length - 3)], w = Math.atan2(b[1] - a[1], b[0] - a[0]); laenge = laenge || 34;
  return [[[b[0] - Math.cos(w - .5) * laenge, b[1] - Math.sin(w - .5) * laenge], b], [[b[0] - Math.cos(w + .5) * laenge, b[1] - Math.sin(w + .5) * laenge], b]];
}
function kreuz(mx, my, r){ return [[[mx - r, my - r], [mx + r, my + r]], [[mx + r, my - r], [mx - r, my + r]]]; }
function vorbereiten(striche){
  striche.forEach(function(s){
    var len = [0], L = 0;
    for (var i = 1; i < s.p.length; i++){ L += Math.hypot(s.p[i][0] - s.p[i - 1][0], s.p[i][1] - s.p[i - 1][1]); len.push(L); }
    s.len = len; s.L = L; s.fertig = 0;
  });
  return striche;
}
function kreideSzene(id, striche){
  var L, t0 = 0, liste = vorbereiten(striche);
  function zeichne(c, s, von, bis){
    var schritt = 1.7, w = s.w || 8, seed = s.seed || 1, i = 1;
    for (var d = Math.floor(von / schritt) * schritt; d < bis; d += schritt){
      if (s.strich && (d % (s.strich * 2)) > s.strich) continue;
      while (i < s.len.length - 1 && s.len[i] < d) i++;
      var a = s.p[i - 1], b = s.p[i], seg = s.len[i] - s.len[i - 1] || 1, u = U.clamp((d - s.len[i - 1]) / seg, 0, 1);
      var x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u, k = Math.round(d / schritt) + seed * 7919;
      if (U.hash(k * .37) < .06) continue;
      for (var g = 0; g < 3; g++){
        var h1 = U.hash(k * 3.1 + g * 17.3), h2 = U.hash(k * 5.7 + g * 9.1), h3 = U.hash(k * 1.3 + g * 3.7);
        c.fillStyle = 'rgba(236,242,238,' + (.25 + h3 * .6).toFixed(2) + ')';
        var sz = .8 + h1 * 2.4; c.fillRect(x + (h1 - .5) * w, y + (h2 - .5) * w, sz, sz * (.6 + h2 * .8));
      }
    }
  }
  return {
    licht: 0, telefon: function(){ return null; },
    init: function(){ L = U.leinwand($('#c-' + id), 1); L.beiGroesse = function(){ liste.forEach(function(s){ s.fertig = 0; }); }; },
    betreten: function(){ t0 = jetzt(); L.ctx.clearRect(0, 0, 1920, 1080); liste.forEach(function(s){ s.fertig = 0; }); },
    bild: function(){
      var t = U.reduziert ? 99 : jetzt() - t0, c = L.ctx;
      liste.forEach(function(s){
        var p = U.clamp((t - s.t) / s.d, 0, 1), ziel = U.inaus(p) * s.L;
        if (ziel > s.fertig + .5){ zeichne(c, s, s.fertig, ziel); if (Math.random() < .3 && p < 1){ var e = s.p[Math.min(s.p.length - 1, Math.round(p * (s.p.length - 1)))]; U.staubwolke(e[0], e[1], 1, { v: 50, leben: .4, groesse: 2 }); } s.fertig = ziel; }
      });
    }
  };
}
function stricheAus(teile, t, d, opt){ opt = opt || {}; return teile.map(function(p, i){ return { p: p, t: t + i * (opt.versatz || .08), d: d, w: opt.w, strich: opt.strich, seed: (opt.seed || 1) + i }; }); }
(function(){
  var lauf = kurve([[1240, 820], [1390, 740], [1330, 620], [1500, 560], [1440, 440], [1620, 380]], 12);
  var schuss = [[1640, 360], [1755, 205]];
  SZ.k1 = kreideSzene('k1', [].concat(
    stricheAus([kreis(1210, 850, 34)], .3, .5, { seed: 2 }),
    stricheAus(kreuz(1440, 640, 26).concat(kreuz(1580, 470, 26)), .55, .25, { seed: 5 }),
    stricheAus([lauf], .8, 1.1, { strich: 18, seed: 9 }),
    stricheAus(spitze(lauf), 1.85, .2, { seed: 12 }),
    stricheAus([[[1650, 160], [1860, 160]], [[1650, 160], [1650, 210]], [[1860, 160], [1860, 210]]], 1.6, .4, { seed: 14 }),
    stricheAus([schuss], 2.05, .35, { seed: 18 }), stricheAus(spitze(schuss, 28), 2.35, .15, { seed: 19 })
  ));
  var p1 = [1260, 800], p2 = [1690, 720], p3 = [1480, 380];
  var a1 = kurve([[1300, 790], [1490, 820], [1650, 735]], 14), a2 = kurve([[1680, 690], [1640, 520], [1510, 410]], 14), a3 = kurve([[1450, 400], [1300, 560], [1270, 760]], 14);
  SZ.k2 = kreideSzene('k2', [].concat(
    stricheAus([kreis(p1[0], p1[1], 34), kreis(p2[0], p2[1], 34), kreis(p3[0], p3[1], 34)], .3, .45, { versatz: .15, seed: 3 }),
    stricheAus([a1], .9, .5, { seed: 6 }), stricheAus(spitze(a1, 28), 1.35, .12, { seed: 7 }),
    stricheAus([a2], 1.3, .5, { seed: 8 }), stricheAus(spitze(a2, 28), 1.75, .12, { seed: 9 }),
    stricheAus([a3], 1.7, .5, { seed: 10 }), stricheAus(spitze(a3, 28), 2.15, .12, { seed: 11 }),
    stricheAus([kurve([[1720, 760], [1800, 600], [1760, 420]], 12)], 2.1, .5, { strich: 14, seed: 13 })
  ));
  var m = [1480, 580], r3 = [];
  for (var i = 0; i < 4; i++){ var w = -1.57 + i * 1.571 + .785; r3.push(kreis(m[0] + Math.cos(w) * 190, m[1] + Math.sin(w) * 190, 28)); }
  var x3 = [];
  [[-2.6, 400], [.2, 410], [2.0, 400]].forEach(function(q){ x3 = x3.concat(kreuz(m[0] + Math.cos(q[0]) * q[1], m[1] + Math.sin(q[0]) * q[1], 22)); });
  var stops = [];
  [[-2.6], [.2], [2.0]].forEach(function(q){ var w = q[0], a = [m[0] + Math.cos(w) * 365, m[1] + Math.sin(w) * 365], b = [m[0] + Math.cos(w) * 262, m[1] + Math.sin(w) * 262]; stops.push([a, b]);
    stops.push([[b[0] + Math.cos(w + 1.571) * 30, b[1] + Math.sin(w + 1.571) * 30], [b[0] - Math.cos(w + 1.571) * 30, b[1] - Math.sin(w + 1.571) * 30]]); });
  SZ.k3 = kreideSzene('k3', [].concat(
    stricheAus([kreis(m[0], m[1], 40)], .3, .4, { seed: 4 }),
    stricheAus([kreis(m[0], m[1], 245, 90)], .6, .9, { strich: 16, seed: 20 }),
    stricheAus(r3, .9, .3, { versatz: .12, seed: 30 }),
    stricheAus(x3, 1.5, .2, { versatz: .06, seed: 40 }),
    stricheAus(stops, 1.9, .25, { versatz: .07, seed: 50 })
  ));
  var weg4 = kurve([[1160, 900], [1300, 760], [1250, 600], [1440, 520], [1560, 380], [1700, 260]], 12);
  var hak = function(mx, my){ return [[[mx - 14, my + 2], [mx - 3, my + 13], [mx + 18, my - 12]]]; };
  SZ.k4 = kreideSzene('k4', [].concat(
    stricheAus([weg4], .3, 1.3, { strich: 18, seed: 60 }), stricheAus(spitze(weg4), 1.55, .15, { seed: 61 }),
    stricheAus([kreis(1300, 760, 30), kreis(1440, 520, 30), kreis(1560, 380, 30)], .6, .3, { versatz: .32, seed: 70 }),
    stricheAus(hak(1300, 760).concat(hak(1440, 520)), 1.5, .2, { versatz: .15, seed: 80 }),
    stricheAus([[[1640, 160], [1860, 160]], [[1640, 160], [1640, 215]], [[1860, 160], [1860, 215]]], 1.7, .4, { seed: 90 })
  ));
})();

/* ============================================================
   5  Heute: vier Antworten werden eine
   ============================================================ */
(function(){
  var karten, modus = 'kreis', t0 = 0, basis = 0, flug = [], ring;
  var M = { x: 900, y: 690, rx: 560, ry: 115 };
  function ziel(){ return Tel.punkt(.5, .72); }
  SZ.heute = {
    licht: .55,
    telefon: function(){ return { x: 900, y: 640, s: .72, bild: 'luis-start' }; },
    init: function(){ karten = $$('#heute .orbit-karte'); ring = $('#heute-ring'); },
    betreten: function(s){ t0 = jetzt(); basis = 0; flug = []; modus = s >= 1 ? 'weg' : 'kreis'; karten.forEach(function(k){ k.style.opacity = s >= 1 ? 0 : 0; k.dataset.a0 = ''; }); this.einblenden = jetzt() + .35; },
    schritt: function(s, vor){
      if (s === 1 && vor){
        modus = 'flug'; var z = ziel(), t = jetzt();
        flug = karten.map(function(k, i){ return { von: { x: +k.dataset.x, y: +k.dataset.y, s: +k.dataset.s }, t: t + i * .28, z: z }; });
      } else if (s === 0){ modus = 'kreis'; flug = []; this.einblenden = jetzt(); }
    },
    verlassen: function(){ flug = []; },
    bild: function(tt, dt){
      var t = jetzt();
      if (modus === 'kreis'){
        basis += dt * .32;
        var ein = U.clamp((t - this.einblenden) / .9, 0, 1);
        karten.forEach(function(k, i){
          var w = basis + i * Math.PI / 2 + .5, tiefe = Math.sin(w);
          var x = M.x + Math.cos(w) * M.rx, y = M.y + tiefe * M.ry, s = .78 + .22 * (tiefe + 1) / 2;
          k.dataset.x = x; k.dataset.y = y; k.dataset.s = s;
          k.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + (s * (.7 + .3 * U.aus(ein))).toFixed(3) + ') rotate(' + (Math.cos(w) * -4).toFixed(2) + 'deg)';
          k.style.zIndex = tiefe > 0 ? 10 : 1;
          k.style.opacity = ((.5 + .5 * (tiefe + 1) / 2) * U.aus(ein)).toFixed(3);
          k.style.filter = tiefe < -.2 ? 'blur(' + ((-tiefe - .2) * 3).toFixed(1) + 'px)' : 'none';
        });
      } else if (modus === 'flug'){
        var alle = true;
        flug.forEach(function(f, i){
          var k = karten[i], p = U.clamp((t - f.t) / .75, 0, 1), e = U.inaus(p);
          if (p < 1) alle = false;
          var mx = (f.von.x + f.z.x) / 2, my = Math.min(f.von.y, f.z.y) - 260;
          var x = (1 - e) * (1 - e) * f.von.x + 2 * (1 - e) * e * mx + e * e * f.z.x, y = (1 - e) * (1 - e) * f.von.y + 2 * (1 - e) * e * my + e * e * f.z.y;
          var s = U.lerp(f.von.s, .22, e);
          k.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ') rotate(' + (e * 8 * (i % 2 ? 1 : -1)).toFixed(1) + 'deg)';
          k.style.zIndex = 10; k.style.filter = 'none';
          k.style.opacity = (1 - Math.pow(e, 6)).toFixed(3);
          if (p >= 1 && !f.da){
            f.da = true; Tel.stoss(.5); Ton.spiel('plopp', 1.2);
            ring.style.left = f.z.x + 'px'; ring.style.top = f.z.y + 'px';
            ring.animate([{ transform: 'scale(.4)', opacity: .9 }, { transform: 'scale(1.9)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
            U.staubwolke(f.z.x, f.z.y, 14, { v: 260, rot: .4, leben: .6, groesse: 4 });
          }
        });
        if (alle && flug.length) modus = 'weg';
      } else {
        karten.forEach(function(k){ k.style.opacity = 0; });
      }
    }
  };
})();

/* ============================================================
   6  Video: Zeitachse mit Kapiteln und Zeitlupe
   ============================================================ */
(function(){
  var lauf, kopf, schritte, tempi, t0 = 0, KAP = [.0603, .3736, .6868];
  // Ein Durchlauf: normal bis zum Ende, dann Zeitlupe um das zweite Kapitel, dann Bild für Bild
  var PROG = [{ d: 6.5, a: 0, b: 1, tempo: 0 }, { d: 3.4, a: .33, b: .47, tempo: 1 }, { d: 3.6, a: .372, b: .40, tempo: 2, bild: true }, { d: .8, a: .40, b: .40, tempo: 2 }];
  SZ.video = {
    licht: .55,
    telefon: function(s){ return s === 0 ? { x: 520, y: 560, s: .9, ry: 14, rx: 4, rz: -2, bild: 'video' } : { x: 520, y: 560, s: .9, ry: 14, rx: 4, rz: -2, bild: 'video-3', art: 'scrollen' }; },
    init: function(){ lauf = $('#video .lauf'); kopf = $('#video .kopfpunkt'); schritte = $$('#video .schritt'); tempi = $$('#video .tempi span'); },
    betreten: function(s){ t0 = jetzt() + .6; $('#merkmal-fehler').classList.toggle('hell', s >= 1); },
    schritt: function(s){ $('#merkmal-fehler').classList.toggle('hell', s >= 1); },
    verlassen: function(){ $('#merkmal-fehler').classList.remove('hell'); },
    bild: function(){
      var t = Math.max(0, jetzt() - t0), sum = 0, i;
      var ges = PROG.reduce(function(a, p){ return a + p.d; }, 0); t = t % ges;
      for (i = 0; i < PROG.length; i++){ if (t < sum + PROG[i].d) break; sum += PROG[i].d; }
      var p = PROG[Math.min(i, PROG.length - 1)], u = (t - sum) / p.d;
      if (p.bild) u = Math.floor(u * 9) / 9;
      var x = p.a + (p.b - p.a) * (p.tempo === 0 ? U.inaus(u) : u);
      lauf.style.width = (x * 100).toFixed(2) + '%'; kopf.style.left = (x * 100).toFixed(2) + '%';
      var j = -1; KAP.forEach(function(k, n){ if (x >= k) j = n; });
      schritte.forEach(function(el, n){ el.classList.toggle('jetzt', n === j); });
      tempi.forEach(function(el, n){ el.classList.toggle('an', n === p.tempo); });
    }
  };
})();

/* ============================================================
   7  Pyramide: Ebenen fallen, die eigene füllt sich
   ============================================================ */
(function(){
  var L, t0 = 0, ebenen;
  var NAMEN = [['Foundational', 'U6 bis U13', '#2FA8A0', .6], ['Development', 'U8 bis U15', '#5FB04A', 0], ['Performance', 'U17 und U19', '#E8952F', 0], ['Professional', 'Profis', '#E24036', 0]];
  var CX = 660, UNTEN = 990, H = 128, LUECKE = 18, BU = 500, BO = 110, TX = 28, TY = -20;
  function hw(y){ var top = UNTEN - 4 * H - 3 * LUECKE; return U.lerp(BU, BO, (UNTEN - y) / (UNTEN - top)); }
  function rgba(hex, a){ var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function neu(){ ebenen = NAMEN.map(function(n, i){ return { i: i, oy: -1200 - i * 160, v: 0, start: .25 + i * .24, ruhe: false, fuell: 0, gelandet: 0 }; }); }
  SZ.pyramide = {
    licht: .5,
    telefon: function(){ return { x: 1600, y: 600, s: .68, ry: -20, rx: 4, rz: 2, bild: 'weg' }; },
    init: function(){ L = U.leinwand($('#c-pyramide'), 1); neu(); },
    betreten: function(){ t0 = jetzt(); neu(); if (U.reduziert) ebenen.forEach(function(e){ e.oy = 0; e.ruhe = true; e.fuell = NAMEN[e.i][3]; e.gelandet = 1; }); },
    bild: function(tt, dt){
      var t = jetzt() - t0, c = L.ctx;
      c.clearRect(0, 0, 1920, 1080);
      ebenen.forEach(function(e){
        if (!e.ruhe && t > e.start){
          e.v += 6200 * dt; e.oy += e.v * dt;
          if (e.oy >= 0){ e.oy = 0; if (e.v > 380){ e.v = -e.v * .26; Ton.spiel('klack', .35 + .15 * (3 - e.i));
              var yb = UNTEN - e.i * (H + LUECKE); U.staubwolke(CX - hw(yb), yb, 10, { v: 180, leben: .6, vy: -60 }); U.staubwolke(CX + hw(yb), yb, 10, { v: 180, leben: .6, vy: -60 }); }
            else { e.v = 0; e.ruhe = true; e.gelandet = t; } }
        }
        if (e.ruhe) e.fuell += (NAMEN[e.i][3] - e.fuell) * Math.min(1, dt * 1.6 * U.clamp((t - e.gelandet - .5) * 2, 0, 1));
      });
      for (var i = 0; i < 4; i++){
        var e = ebenen[i], n = NAMEN[i], yb = UNTEN - i * (H + LUECKE) + e.oy, yt = yb - H;
        if (yb < -200) continue;
        var wb = hw(yb - e.oy), wt = hw(yt - e.oy), farbe = n[2], mein = i === 0, naechste = i === 1;
        // Oberseite und rechte Seite für die Tiefe
        c.fillStyle = rgba(farbe, .22); c.beginPath(); c.moveTo(CX - wt, yt); c.lineTo(CX + wt, yt); c.lineTo(CX + wt + TX, yt + TY); c.lineTo(CX - wt + TX, yt + TY); c.closePath(); c.fill();
        c.fillStyle = rgba(farbe, .08); c.beginPath(); c.moveTo(CX + wb, yb); c.lineTo(CX + wb + TX, yb + TY); c.lineTo(CX + wt + TX, yt + TY); c.lineTo(CX + wt, yt); c.closePath(); c.fill();
        // Vorderseite
        c.fillStyle = rgba(farbe, mein ? .16 : .09); c.beginPath(); c.moveTo(CX - wb, yb); c.lineTo(CX + wb, yb); c.lineTo(CX + wt, yt); c.lineTo(CX - wt, yt); c.closePath(); c.fill();
        // Füllung mit Welle
        if (e.fuell > .005){
          c.save(); c.beginPath(); c.moveTo(CX - wb, yb); c.lineTo(CX + wb, yb); c.lineTo(CX + wt, yt); c.lineTo(CX - wt, yt); c.closePath(); c.clip();
          var hoehe = H * e.fuell, ys = yb - hoehe, g = c.createLinearGradient(0, ys, 0, yb); g.addColorStop(0, rgba(farbe, .75)); g.addColorStop(1, rgba(farbe, .45));
          c.fillStyle = g; c.beginPath(); c.moveTo(CX - wb - 10, yb + 2);
          for (var x = CX - wb - 10; x <= CX + wb + 10; x += 12){ c.lineTo(x, ys + Math.sin(x * .021 + tt * 2.6) * 5 + Math.sin(x * .047 - tt * 1.8) * 3); }
          c.lineTo(CX + wb + 10, yb + 2); c.closePath(); c.fill(); c.restore();
        }
        c.lineWidth = mein ? 4 : 2.5; c.strokeStyle = rgba(farbe, mein ? 1 : naechste ? .75 : .45);
        if (naechste) c.setLineDash([12, 10]); else c.setLineDash([]);
        c.beginPath(); c.moveTo(CX - wb, yb); c.lineTo(CX + wb, yb); c.lineTo(CX + wt, yt); c.lineTo(CX - wt, yt); c.closePath(); c.stroke(); c.setLineDash([]);
        c.textAlign = 'center'; c.fillStyle = '#F2F5F1'; c.font = '700 36px Inter, -apple-system, sans-serif';
        c.fillText(n[0], CX, yt + H / 2 + 4);
        c.font = '500 23px Inter, -apple-system, sans-serif'; c.fillStyle = 'rgba(242,245,241,.75)';
        c.fillText(n[1] + '  ·  ' + Math.round(n[3] * 5) + ' von 5', CX, yt + H / 2 + 38);
        if (mein && e.ruhe){
          var a = U.clamp((t - e.gelandet - .2) * 2, 0, 1);
          c.globalAlpha = a; c.fillStyle = farbe; var bx = CX + wb + 34, by = yt + H / 2 - 24;
          c.beginPath(); c.roundRect ? c.roundRect(bx, by, 180, 48, 24) : c.rect(bx, by, 180, 48); c.fill();
          c.fillStyle = '#fff'; c.font = '700 22px Inter, -apple-system, sans-serif'; c.fillText('Du bist hier', bx + 90, by + 32); c.globalAlpha = 1;
        }
        if (naechste && e.ruhe){
          var a2 = U.clamp((t - e.gelandet - .4) * 2, 0, 1); c.globalAlpha = a2;
          c.textAlign = 'left'; c.fillStyle = rgba(farbe, 1); c.font = '700 22px Inter, -apple-system, sans-serif'; c.fillText('Deine nächste Ebene', CX + wb + 40, yt + H / 2 + 8); c.globalAlpha = 1;
        }
      }
      // Pfeil an der linken Kante: Aufstieg
      var auf = U.clamp((t - 1.8) / .9, 0, 1);
      if (auf > 0){
        var top = UNTEN - 4 * H - 3 * LUECKE, ax = CX - BU, ay = UNTEN, bx2 = CX - BO, by2 = top;
        var dx = bx2 - ax, dy = by2 - ay, l = Math.hypot(dx, dy), nx = dy / l * 1, ny = -dx / l * 1, off = 62;
        var x1 = ax + dx * .06 + nx * off, y1 = ay + dy * .06 + ny * off, x2 = ax + dx * .9 + nx * off, y2 = ay + dy * .9 + ny * off;
        var xe = U.lerp(x1, x2, U.aus(auf)), ye = U.lerp(y1, y2, U.aus(auf)), w = Math.atan2(dy, dx);
        c.strokeStyle = 'rgba(242,245,241,.55)'; c.lineWidth = 3; c.setLineDash([3, 12]); c.lineCap = 'round';
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(xe, ye); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.moveTo(xe - Math.cos(w - .5) * 20, ye - Math.sin(w - .5) * 20); c.lineTo(xe, ye); c.lineTo(xe - Math.cos(w + .5) * 20, ye - Math.sin(w + .5) * 20); c.stroke();
        c.save(); c.translate((x1 + x2) / 2 + nx * 34, (y1 + y2) / 2 + ny * 34); c.rotate(w); c.textAlign = 'center';
        c.font = '700 21px "JetBrains Mono", monospace'; c.fillStyle = 'rgba(242,245,241,' + (.65 * auf).toFixed(3) + ')'; c.fillText('A U F S T I E G', 0, 0); c.restore();
      }
    }
  };
})();

/* ============================================================
   8  Pläne: Woche für Woche füllt sich das Raster
   ============================================================ */
SZ.plaene = {
  licht: .5,
  telefon: function(){ return { x: 1590, y: 560, s: .8, ry: -16, rx: 4, rz: 2, bild: 'plan' }; },
  betreten: function(){
    var p = $$('#plaene .punkt'); p.forEach(function(x){ x.classList.remove('voll'); });
    p.forEach(function(x){ var w = +x.dataset.w, e = +x.dataset.e; spaeter(function(){ x.classList.add('voll'); x.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' }); if (e === 0) Ton.spiel('tick'); }, 1100 + w * 230 + e * 80); });
  },
  verlassen: function(){ uhrenWeg(); $$('#plaene .punkt').forEach(function(x){ x.classList.remove('voll'); }); }
};

/* ============================================================
   9  Vergleich: zwei Bälle im selben Takt
   ============================================================ */
(function(){
  var pfade, baelle, uhren2, tempo, paket, t0 = 0, pos = 0;
  var TEMPI = [1, .5, .25, 0];
  SZ.vergleich = {
    licht: .5,
    telefon: function(){ return { x: 470, y: 560, s: .86, ry: 16, rx: 3, rz: -2, bild: 'vergleich' }; },
    init: function(){ pfade = $$('#vergleich .zz'); baelle = $$('#vergleich .ball'); uhren2 = $$('#vergleich .uhr'); tempo = $$('#vergleich .tempo span'); paket = $('#vergleich .paketchen'); },
    betreten: function(){ t0 = jetzt(); pos = 0; },
    bild: function(tt, dt){
      var t = jetzt() - t0, phase = Math.floor(t / 3.2) % 4, sp = TEMPI[phase];
      if (sp > 0) pos += dt * .32 * sp; else if (Math.floor(t * 2.5) !== Math.floor((t - dt) * 2.5)) pos += .02;
      pos = pos % 1;
      tempo.forEach(function(el, i){ el.classList.toggle('an', i === phase); });
      pfade.forEach(function(p, i){
        var len = p.getTotalLength(), q = i === 0 ? pos : (pos - .035 + Math.sin(t * 2.1) * .006 + 1) % 1, pt = p.getPointAtLength(q * len);
        baelle[i].setAttribute('cx', pt.x.toFixed(1)); baelle[i].setAttribute('cy', pt.y.toFixed(1));
        var sek = q * 21, m = Math.floor(sek / 60); uhren2[i].textContent = m + ':' + ('0' + Math.floor(sek % 60)).slice(-2) + (sp === 0 ? ' · Bild' : '');
      });
      // Das Paket prallt an der Wand ab
      var z = (t % 2.6) / 2.6, x;
      if (z < .45) x = 70 + U.aus(z / .45) * 108; else if (z < .6) x = 178 - Math.sin((z - .45) / .15 * Math.PI) * 14; else x = 178 - U.inaus((z - .6) / .4) * 108;
      paket.setAttribute('x', x.toFixed(1));
      if (z > .44 && z < .46 && !this.knall){ this.knall = true; Ton.spiel('tick', 1.4); } else if (z > .5) this.knall = false;
    }
  };
})();

/* ============================================================
   11  Rollen: acht Bahnen um das Telefon
   ============================================================ */
(function(){
  var orbs, basis = 0, vel = 0, gewaehlt = -1, legende, eb, name, satz;
  var CX = 1185, CY = 640, RX = 520, RY = 135;
  var R = [
    ['Spieler', 'Luis, 12', 'Übt jeden Tag, bekommt Hausaufgaben vom Trainer und geht seinen Weg durch die Pyramide.', '#FF9500', 'luis-start', 'spieler'],
    ['Eltern', 'Sandra', 'Sieht, was Luis übt, und gibt jedes Video und das Talentprofil frei.', '#34C759', 'sandra-start', 'eltern'],
    ['Trainer', 'Tim Hoffmann', 'Hausaufgaben, Feedback auf Videos und die Rangliste der U13.', '#2FA8A0', 'tim-team', 'trainer'],
    ['Akademie', 'Rheinblick', 'Vier Mannschaften, ihre Trainer und die Talente an einem Ort.', '#C77DEB', 'akademie', 'akademie'],
    ['Verein', 'FC Rheinstadt', 'Eine öffentliche Seite und der Nachwuchs. Bürgt für Trainer, Scouts und Profis.', '#7C9AB5', 'verein', 'verein'],
    ['Profi', 'Niklas Hartwig', 'Eine eigene Seite für die Fans. Anfragen kommen nur von geprüften Konten.', '#E0AE2A', 'profi', 'profi'],
    ['Scout', 'Marco Berger', 'Sieht Talente ab 16 oder mit Freigabe der Eltern. Kontakt nur über sie.', '#8B89F0', 'scout', 'scout'],
    ['KM1', 'Kader', 'Prüft, vergibt den Haken, schreibt Neuigkeiten und liest jede Meldung.', '#EE4A40', 'km1', 'km1']
  ];
  U.ROLLEN = R;
  function legendeSetzen(i, sofort){
    var w = $('#rollen .wechsel');
    function setzen(){
      if (i < 0){ eb.textContent = 'Acht Rollen'; name.textContent = 'Ein Netz'; satz.textContent = 'Tippe auf eine Rolle oder blättere weiter.'; legende.style.removeProperty('--farbe'); }
      else { eb.textContent = R[i][0]; name.textContent = R[i][1]; satz.textContent = R[i][2]; legende.style.setProperty('--farbe', R[i][3]); }
      w.classList.remove('raus');
    }
    if (sofort){ setzen(); return; }
    w.classList.add('raus'); setTimeout(setzen, 260);
  }
  SZ.rollen = {
    licht: .5,
    telefon: function(s){ var i = s - 1; return { x: CX, y: 590, s: .7, bild: i < 0 ? 'luis-start' : R[i][4], art: 'schieben' }; },
    init: function(){
      orbs = $$('#rollen .orb'); legende = $('#rollen .legende'); eb = $('#rolle-eb'); name = $('#rolle-name'); satz = $('#rolle-satz');
      orbs.forEach(function(o, i){ o.addEventListener('click', function(e){ e.stopPropagation(); U.setzeSchritt(i + 1); }); });
    },
    betreten: function(s){ gewaehlt = s - 1; legendeSetzen(gewaehlt, true); this.ein = jetzt(); },
    schritt: function(s){ gewaehlt = s - 1; legendeSetzen(gewaehlt); Ton.spiel('tick'); },
    bild: function(tt, dt){
      var schr = 2 * Math.PI / 8;
      if (gewaehlt < 0){ vel += (.22 - vel) * Math.min(1, dt * 2); basis += vel * dt; }
      else {
        var ziel = Math.PI / 2 + .78 - gewaehlt * schr, d = ((ziel - basis) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        var a = 30 * d - 9 * vel; vel += a * dt; basis += vel * dt;
      }
      var ein = U.aus(U.clamp((jetzt() - this.ein - .3) / 1.2, 0, 1));
      orbs.forEach(function(o, i){
        var w = basis + i * schr, tiefe = Math.sin(w), x = CX + Math.cos(w) * RX * (.4 + .6 * ein), y = CY + tiefe * RY;
        var s = .62 + .38 * (tiefe + 1) / 2 + (i === gewaehlt ? .18 : 0);
        o.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + (s * ein).toFixed(3) + ')';
        var vorn = tiefe > 0 && Math.abs(x - CX) > 200;
        o.style.zIndex = vorn ? 10 : 1;
        o.style.opacity = ((.35 + .65 * (tiefe + 1) / 2) * ein).toFixed(3);
        o.classList.toggle('an', i === gewaehlt);
      });
    }
  };
})();

/* 12  Trainer: zwei Bildschirme fächern sich auf */
SZ.trainer = {
  licht: .55,
  telefon: function(){ return { x: 1425, y: 560, s: .9, ry: -12, rx: 3, rz: 2, bild: 'tim-team' }; },
  betreten: function(){
    var l = $('#fach-l'), r = $('#fach-r');
    [l, r].forEach(function(f){ f.style.transition = 'none'; f.style.opacity = '0'; f.style.transform = 'translateX(' + (1425 - parseFloat(f.style.left)) + 'px) scale(.6)'; });
    void l.offsetWidth;
    spaeter(function(){
      [l, r].forEach(function(f){ f.style.transition = ''; f.style.opacity = '.92'; });
      l.style.transform = 'rotate(-9deg) scale(.6)'; r.style.transform = 'rotate(9deg) scale(.6)'; Ton.spiel('wusch', .6);
    }, 650);
  },
  verlassen: function(){ uhrenWeg(); }
};

/* ============================================================
   13  Eltern: die Anfrage wartet, bis Sandra freigibt
   ============================================================ */
(function(){
  var weg, paket, pos = 0, ziel = 0, anim = null;
  var LOCK = '', CHECK = '';
  function fahre(nach, dauer, fertig){
    var von = pos, t0 = performance.now(); if (anim) cancelAnimationFrame(anim);
    function f(){ var p = U.clamp((performance.now() - t0) / dauer, 0, 1); pos = von + (nach - von) * U.inaus(p); setze(); if (p < 1) anim = requestAnimationFrame(f); else { anim = null; if (fertig) fertig(); } }
    anim = requestAnimationFrame(f);
  }
  function setze(){ var L = weg.getTotalLength(), pt = weg.getPointAtLength(pos * L), hub = Math.sin(pos * Math.PI * 2) * 34; paket.style.transform = 'translate3d(' + pt.x.toFixed(1) + 'px,' + (pt.y - 96 - Math.abs(hub)).toFixed(1) + 'px,0) rotate(' + (Math.sin(pos * Math.PI * 4) * 12).toFixed(1) + 'deg)'; }
  function zustand(s, sofort){
    var sandra = $('#ab-sandra'), luis = $('#ab-luis'), scout = $('#ab-scout');
    luis.classList.add('an');
    sandra.classList.toggle('an', s >= 1);
    sandra.style.background = s >= 2 ? '#34C759' : '#8E8E93'; sandra.innerHTML = s >= 2 ? CHECK : LOCK;
    $('#sandra-satz').textContent = s >= 2 ? 'hat freigegeben' : s >= 1 ? 'Die Anfrage wartet auf sie' : 'entscheidet, ob das geht';
    var nach = s >= 2 ? 1 : s >= 1 ? .5 : 0;
    if (sofort){ pos = nach; setze(); scout.classList.toggle('an', s >= 2); return; }
    scout.classList.remove('an');
    if (s >= 2){
      Tel.tipp(288 / 390, 238 / 844);
      setTimeout(function(){ Tel.toast('Freigegeben. Geprüfte Scouts sehen jetzt das Profil.'); Ton.spiel('plopp'); }, 380);
      fahre(nach, 1300, function(){ scout.classList.add('an'); Ton.spiel('plopp', 1.3); });
    } else fahre(nach, 1300);
  }
  SZ.eltern = {
    licht: .5,
    telefon: function(s){ return { x: 1500, y: 560, s: .86, ry: -14, rx: 3, rz: 2, bild: s >= 1 ? 'freigabe' : 'familie', art: 'schieben' }; },
    init: function(){ weg = $('#fluss-weg'); paket = $('#paket'); LOCK = $('#ab-sandra').innerHTML; CHECK = $('#ab-scout').innerHTML; },
    betreten: function(s){ zustand(s, true); if (s === 0){ pos = 0; setze(); } },
    schritt: function(s, vor){ zustand(s, !vor); },
    verlassen: function(){ Tel.toastWeg(); }
  };
})();

/* 15  Regeln: drei Ringe um das Kind */
(function(){
  var ringe, t0 = 0;
  SZ.regeln = {
    licht: .45, farbe: [170, 205, 255],
    telefon: function(){ return null; },
    init: function(){ ringe = $$('#regeln .ring'); ringe.forEach(function(r){ var L = 2 * Math.PI * r.getAttribute('r'); r.dataset.l = L; r.style.strokeDasharray = L * .9 + ' ' + L * .1; r.style.strokeDashoffset = L; }); },
    betreten: function(s){ t0 = jetzt(); this.setze(s, true); },
    schritt: function(s){ this.setze(s, false); },
    setze: function(s, sofort){
      ringe.forEach(function(r, i){
        var L = +r.dataset.l, an = i <= s, war = r.dataset.an === '1';
        r.style.transition = sofort && !an ? 'none' : 'stroke-dashoffset 1.4s cubic-bezier(.65,0,.35,1)';
        r.style.strokeDashoffset = an ? 0 : L; r.style.opacity = an ? 1 : .15;
        if (an && !war && !sofort) Ton.spiel('klack', .4);
        r.dataset.an = an ? '1' : '';
      });
    },
    bild: function(tt){
      ringe.forEach(function(r, i){ r.setAttribute('transform', 'rotate(' + ((tt * (i % 2 ? -9 : 7) + i * 40) % 360).toFixed(2) + ' 370 370)'); });
    }
  };
})();

/* 16  Haken: das Abzeichen reist die Kette entlang */
(function(){
  var weg, reise, glieder, chip, t0 = 0, getippt = 0, CODE = 'RHB-T-2Q9M';
  SZ.haken = {
    licht: .45, farbe: [170, 205, 255],
    telefon: function(){ return { x: 1590, y: 560, s: .8, ry: -16, rx: 3, rz: 2, bild: 'km1' }; },
    init: function(){ weg = $('#kette-weg'); reise = $('#reise'); glieder = $$('#haken .glied'); chip = $('#code-chip'); },
    betreten: function(s){ t0 = jetzt(); glieder.forEach(function(g){ g.classList.remove('an'); }); this.fertig = false; chip.textContent = s >= 1 ? CODE : ''; getippt = s >= 1 ? CODE.length : 0; this.tippStart = s >= 1 ? -1 : 0; },
    schritt: function(s){ if (s >= 1){ this.tippStart = jetzt() + .4; getippt = 0; chip.textContent = ''; } else { chip.textContent = ''; } },
    bild: function(){
      var t = jetzt() - t0 - 1.1, L = weg.getTotalLength(), p = U.clamp(t / 3.4, 0, 1);
      if (t > 0 && p < 1){
        var e = U.inaus(p), pt = weg.getPointAtLength(e * L);
        reise.style.opacity = '1'; reise.style.transform = 'translate3d(' + pt.x + 'px,' + pt.y + 'px,0) scale(' + (1 + Math.sin(t * 9) * .06) + ')';
        glieder.forEach(function(g, i){ if (!g.classList.contains('an') && pt.x >= 131 + i * 300 - 10){ g.classList.add('an'); Ton.spiel('plopp'); U.staubwolke(140 + 131 + i * 300, 420 + 300, 10, { v: 160, leben: .5 }); } });
        if (Math.random() < .6) U.staubwolke(140 + pt.x, 420 + pt.y, 1, { v: 40, leben: .5, groesse: 3 });
      } else if (p >= 1){ reise.style.opacity = '0'; glieder.forEach(function(g){ g.classList.add('an'); }); }
      else reise.style.opacity = '0';
      if (this.tippStart > 0 && getippt < CODE.length && jetzt() > this.tippStart + getippt * .11){ getippt++; chip.textContent = CODE.slice(0, getippt); Ton.spiel('tick', .7); }
    }
  };
})();

/* 18  Geschäft: Karten werden aufgedeckt */
SZ.geschaeft = {
  licht: .5,
  telefon: function(){ return null; },
  betreten: function(){ var f = $('#geschaeft'); f.classList.remove('an'); void f.offsetWidth; spaeter(function(){ f.classList.add('an'); for (var i = 0; i < 5; i++) spaeter(function(){ Ton.spiel('tick', 1.2); }, 200 + i * 130); }, 250); },
  verlassen: function(){ uhrenWeg(); $('#geschaeft').classList.remove('an'); }
};

/* ============================================================
   19  Technik: eine Anzeigetafel wie im Stadion
   ============================================================ */
(function(){
  var zellen = [], ZEICHEN = '0123456789.';
  function flap(){
    var f = D.createElement('span'); f.className = 'flap';
    f.innerHTML = '<span class="h oben"><span></span></span><span class="h unten"><span></span></span><span class="h oben klappe"><span></span></span><span class="h unten klappe2"><span></span></span>';
    f._z = ' '; return f;
  }
  function setze(f, z){ f.querySelectorAll('.h>span').forEach(function(s){ s.textContent = z; }); f._z = z; f.classList.toggle('leer', z === ' '); }
  function klappe(f, z){
    return new Promise(function(fertig){
      var alt = f._z, o = f.querySelector('.oben:not(.klappe)>span'), u = f.querySelector('.unten:not(.klappe2)>span'), k1 = f.querySelector('.klappe'), k2 = f.querySelector('.klappe2');
      f.classList.remove('leer');
      o.textContent = z; u.textContent = alt; k1.firstChild.textContent = alt; k2.firstChild.textContent = z; k2.style.transform = 'rotateX(90deg)';
      var a = k1.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: 55, easing: 'ease-in', fill: 'forwards' });
      a.finished.then(function(){
        var b = k2.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: 55, easing: 'ease-out', fill: 'forwards' });
        return b.finished;
      }).then(function(){ setze(f, z); k2.style.transform = ''; k1.getAnimations().forEach(function(x){ x.cancel(); }); k2.getAnimations().forEach(function(x){ x.cancel(); }); fertig(); }).catch(function(){ setze(f, z); k2.style.transform = ''; fertig(); });
    });
  }
  function lauf(f, ziel, verz, runde){
    setTimeout(function(){
      if (runde !== SZ.technik.runde) return;
      var n = ziel === ' ' ? 0 : 6 + Math.floor(Math.random() * 6), k = 0;
      (function weiter(){
        if (runde !== SZ.technik.runde) return;
        if (k >= n){ if (ziel !== ' ') klappe(f, ziel).then(function(){ Ton.spiel('tick', .5); }); return; }
        var z = ZEICHEN[Math.floor(Math.random() * ZEICHEN.length)]; k++;
        klappe(f, z).then(weiter);
      })();
    }, U.reduziert ? 0 : verz);
  }
  SZ.technik = {
    licht: .45, runde: 0,
    telefon: function(){ return null; },
    init: function(){
      $$('#technik .flaps').forEach(function(el){
        var b = +el.dataset.breite, z = []; for (var i = 0; i < b; i++){ var f = flap(); setze(f, ' '); el.appendChild(f); z.push(f); }
        zellen.push({ el: el, z: z, text: el.dataset.flap });
      });
    },
    betreten: function(){
      var runde = ++this.runde;
      zellen.forEach(function(row, r){
        var text = row.text, b = row.z.length, pad = new Array(b - text.length + 1).join(' ') + text;
        row.z.forEach(function(f, i){ setze(f, ' '); if (U.reduziert){ setze(f, pad[i]); return; } lauf(f, pad[i], 700 + r * 260 + i * 70, runde); });
      });
    },
    verlassen: function(){ this.runde++; zellen.forEach(function(row){ row.z.forEach(function(f){ setze(f, ' '); }); }); }
  };
})();

/* ============================================================
   20  Weg: der Lauf übers Feld bis zum Anpfiff
   ============================================================ */
(function(){
  var pfad, grund, punkte, ball, heute, t0 = 0, HEUTE = .44;
  function legen(){
    var L = pfad.getTotalLength();
    punkte.forEach(function(p){
      var pt = pfad.getPointAtLength(+p.dataset.f * L), h = p.offsetHeight || 120, r = p.classList.contains('ziel') ? 31 : 23;
      p.style.left = pt.x.toFixed(1) + 'px';
      p.style.top = (p.classList.contains('oben') ? pt.y + r - h : pt.y - r).toFixed(1) + 'px';
    });
    var hp = pfad.getPointAtLength(HEUTE * L); heute.style.left = hp.x + 'px'; heute.style.top = (hp.y + 62) + 'px';
    SZ.weg.L = L;
  }
  SZ.weg = {
    licht: .5,
    telefon: function(){ return null; },
    init: function(){ pfad = $('#weg-pfad'); grund = $('#weg-grund'); ball = $('#weg-ball'); heute = $('#weg-heute'); punkte = $$('#weg .wegpunkt'); legen(); },
    schriftenDa: function(){ legen(); },
    betreten: function(){
      t0 = jetzt(); legen(); var L = this.L;
      pfad.style.strokeDasharray = L + ' ' + L; pfad.style.strokeDashoffset = L;
      punkte.forEach(function(p){ p.style.opacity = 0; p.style.transform = 'scale(.6)'; p.dataset.da = ''; });
      heute.style.opacity = 0;
    },
    bild: function(){
      var t = U.reduziert ? 99 : jetzt() - t0, L = this.L, zieh = U.inaus(U.clamp((t - .6) / 2.3, 0, 1)), f = HEUTE * zieh;
      pfad.style.strokeDashoffset = (L * (1 - f)).toFixed(1);
      var pt = pfad.getPointAtLength(f * L);
      ball.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') rotate(' + (f * 1500).toFixed(0) + ')');
      punkte.forEach(function(p, i){
        var fx = +p.dataset.f, sicht;
        if (fx <= HEUTE) sicht = U.clamp((f - fx) * 14 + .2, 0, 1);
        else sicht = U.clamp((t - 3.1 - i * .03 - (fx - HEUTE) * 2.6) * 2.4, 0, 1);
        p.style.opacity = sicht.toFixed(3); p.style.transform = 'scale(' + (.6 + .4 * U.aus(sicht)).toFixed(3) + ')';
        if (sicht >= 1 && !p.dataset.da){ p.dataset.da = 1; Ton.spiel(p.classList.contains('ziel') ? 'plopp' : 'tick'); if (p.classList.contains('ziel')){ var q = pfad.getPointAtLength(L); U.staubwolke(120 + q.x, 400 + q.y, 26, { v: 280, rot: .5, leben: .8, groesse: 4 }); } }
      });
      heute.style.opacity = U.clamp((t - 2.8) * 3, 0, 1).toFixed(3);
    }
  };
})();

/* ============================================================
   21  Live: die echte App im Telefon
   ============================================================ */
(function(){
  var knoepfe, satz;
  function waehle(r, i){
    knoepfe.forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.rolle === r); });
    if (!U.live.rolle(r)){ Tel.zeige(U.ROLLEN[i][4], 'schieben'); }
    Ton.spiel('tick');
  }
  SZ.live = {
    licht: .55,
    telefon: function(){ return { x: 1330, y: 545, s: .95, ry: -6, rx: 2, rz: 0 }; },
    init: function(){
      knoepfe = $$('#live .rollenwahl button'); satz = $('#live-satz');
      knoepfe.forEach(function(b, i){ b.addEventListener('click', function(e){ e.stopPropagation(); waehle(b.dataset.rolle, i); }); });
    },
    betreten: function(){
      knoepfe.forEach(function(b, i){ b.setAttribute('aria-pressed', i === 0); });
      Tel.zeige('luis-start', 'blende');
      setTimeout(function(){
        U.live.an(function(ok){
          if (ok){ U.live.rolle('spieler'); }
          if (!ok){ U.live.weg(); Tel.zeige('luis-start', 'blende', { immer: true }); satz.textContent = 'Die Knöpfe zeigen jede Rolle. Live auf dem eigenen Handy: einfach den QR-Code scannen.'; }
        });
      }, 700);
    },
    verlassen: function(){ U.live.weg(); Tel.bild = null; }
  };
})();

/* ============================================================
   22  Finale: ein Schuss ins Netz
   ============================================================ */
(function(){
  var L, knoten = [], stangen = [], ball = null, t0 = 0, geschossen = false, spur = [], cam, F = 1450, CX = 960, CY = 640;
  var B = 7.32, H = 2.44, TIEF = 1.9, SP = 26, ZE = 11, DA = 6;
  function v3(x, y, z){ return { x: x, y: y, z: z }; }
  function sub(a, b){ return v3(a.x - b.x, a.y - b.y, a.z - b.z); }
  function dot(a, b){ return a.x * b.x + a.y * b.y + a.z * b.z; }
  function norm(a){ var l = Math.hypot(a.x, a.y, a.z) || 1; return v3(a.x / l, a.y / l, a.z / l); }
  function kreuzp(a, b){ return v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
  function kamera(){
    var pos = v3(-3.2, 1.75, -10.5), ziel = v3(0, 1.15, .6), f = norm(sub(ziel, pos)), r = norm(kreuzp(f, v3(0, 1, 0))), u = kreuzp(r, f);
    cam = { pos: pos, f: f, r: r, u: u };
  }
  function proj(p){ var d = sub(p, cam.pos), zc = dot(d, cam.f); if (zc < .1) return null; return { x: CX + F * dot(d, cam.r) / zc, y: CY - F * dot(d, cam.u) / zc, z: zc }; }
  function netz(){
    knoten = []; stangen = [];
    // Rückwand: SP Spalten, ZE Zeilen; Dach: SP Spalten, DA Zeilen bis zur Latte
    var idx = function(r, c){ return r * (SP + 1) + c; }, reihen = ZE + DA;
    for (var r = 0; r <= reihen; r++) for (var c = 0; c <= SP; c++){
      var x = -B / 2 + B * c / SP, p;
      if (r <= ZE) p = v3(x, (H - .3) * r / ZE, TIEF);
      else { var k = (r - ZE) / DA; p = v3(x, U.lerp(H - .3, H, k), U.lerp(TIEF, 0, k)); }
      var fest = r === 0 || r === reihen || c === 0 || c === SP;
      knoten.push({ p: v3(p.x, p.y, p.z), alt: v3(p.x, p.y, p.z), ruhe: v3(p.x, p.y, p.z), fest: fest });
    }
    for (r = 0; r <= reihen; r++) for (c = 0; c <= SP; c++){
      if (c < SP) stangen.push([idx(r, c), idx(r, c + 1)]);
      if (r < reihen) stangen.push([idx(r, c), idx(r + 1, c)]);
    }
    stangen.forEach(function(s){ var a = knoten[s[0]].p, b = knoten[s[1]].p; s.push(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)); });
  }
  function schiess(zx, zy){
    var start = v3(2.1, .11, -9.6), ziel = v3(zx, zy, TIEF - .1), T = .78, g = -9.81;
    ball = { p: v3(start.x, start.y, start.z), v: v3((ziel.x - start.x) / T, (ziel.y - start.y - .5 * g * T * T) / T, (ziel.z - start.z) / T), dreh: 0, imNetz: false, t: 0 };
    spur = []; geschossen = true; Ton.spiel('kick');
  }
  function physik(dt){
    var g = -9.81;
    if (ball){
      ball.t += dt;
      ball.v.y += g * dt; ball.p.x += ball.v.x * dt; ball.p.y += ball.v.y * dt; ball.p.z += ball.v.z * dt; ball.dreh += dt * (ball.imNetz ? 4 : 14);
      if (ball.p.y < .11){ ball.p.y = .11; ball.v.y = Math.abs(ball.v.y) > .6 ? -ball.v.y * .38 : 0; ball.v.x *= Math.pow(.15, dt * 8); ball.v.z *= Math.pow(.15, dt * 8); }
      if (!ball.imNetz && ball.p.z > TIEF - .3 && Math.abs(ball.p.x) < B / 2 && ball.p.y < H){
        ball.imNetz = true; BG.blitz = .9; Ton.spiel('netz'); Ton.spiel('jubel');
        // Das Netz beult sich um den Treffpunkt nach hinten
        knoten.forEach(function(k){ if (k.fest) return; var d = Math.hypot(k.p.x - ball.p.x, k.p.y - ball.p.y); if (d < 1.6){ var w = Math.pow(1 - d / 1.6, 1.5); k.p.z += .75 * w; k.p.x += (k.p.x - ball.p.x) * .12 * w; } });
        ball.v.z = -Math.abs(ball.v.z) * .12; ball.v.x *= .25; ball.v.y *= .35;
        var q = proj(ball.p); if (q) U.staubwolke(q.x, q.y, 60, { v: 520, rot: .35, leben: 1.1, groesse: 5, g: 300 });
      }
      if (ball.imNetz){
        var rand = B / 2 - .2;
        if (ball.p.x < -rand){ ball.p.x = -rand; ball.v.x = Math.abs(ball.v.x) * .2; }
        if (ball.p.x > rand){ ball.p.x = rand; ball.v.x = -Math.abs(ball.v.x) * .2; }
        if (ball.p.z > TIEF - .18){ ball.p.z = TIEF - .18; ball.v.z = -Math.abs(ball.v.z) * .2; }
        if (ball.p.z < .35){ ball.p.z = .35; ball.v.z = Math.abs(ball.v.z) * .2; }
        ball.v.x *= Math.pow(.3, dt); ball.v.z *= Math.pow(.3, dt);
      }
      spur.push(v3(ball.p.x, ball.p.y, ball.p.z)); if (spur.length > 14) spur.shift();
      if (ball.imNetz && spur.length > 2) spur.shift();
    }
    var R = .5;
    knoten.forEach(function(k){
      if (k.fest) return;
      var p = k.p, vx = (p.x - k.alt.x) * .965, vy = (p.y - k.alt.y) * .965, vz = (p.z - k.alt.z) * .965;
      k.alt = v3(p.x, p.y, p.z);
      p.x += vx + (k.ruhe.x - p.x) * .035; p.y += vy - .9 * dt * dt + (k.ruhe.y - p.y) * .035; p.z += vz + (k.ruhe.z - p.z) * .035;
      if (ball){ var d = sub(p, ball.p), l = Math.hypot(d.x, d.y, d.z); if (l < R && l > 1e-4){ var m = (R - l) / l; p.x += d.x * m; p.y += d.y * m; p.z += d.z * m; } }
    });
    for (var it = 0; it < 5; it++){
      stangen.forEach(function(s){
        var a = knoten[s[0]], b = knoten[s[1]], d = sub(b.p, a.p), l = Math.hypot(d.x, d.y, d.z) || 1e-4, diff = (l - s[2]) / l * .5;
        if (l < s[2]) return;
        if (!a.fest){ a.p.x += d.x * diff; a.p.y += d.y * diff; a.p.z += d.z * diff; }
        if (!b.fest){ b.p.x -= d.x * diff; b.p.y -= d.y * diff; b.p.z -= d.z * diff; }
      });
    }
  }
  function linie(c, a, b, w, farbe){ var p = proj(a), q = proj(b); if (!p || !q) return; c.strokeStyle = farbe; c.lineWidth = w * F / ((p.z + q.z) / 2); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); }
  SZ.finale = {
    licht: .7,
    telefon: function(){ return null; },
    init: function(){
      L = U.leinwand($('#c-finale'), 1); kamera(); netz();
      $('#schuss').addEventListener('click', function(e){
        e.stopPropagation();
        var p = U.zuBuehne(e.clientX, e.clientY), xc = (p.x - CX) / F, yc = -(p.y - CY) / F;
        var dir = norm(v3(cam.r.x * xc + cam.u.x * yc + cam.f.x, cam.r.y * xc + cam.u.y * yc + cam.f.y, cam.r.z * xc + cam.u.z * yc + cam.f.z));
        var t = (TIEF - .1 - cam.pos.z) / dir.z, ziel = v3(cam.pos.x + dir.x * t, cam.pos.y + dir.y * t, 0);
        schiess(U.clamp(ziel.x, -B / 2 + .4, B / 2 - .4), U.clamp(ziel.y, .3, H - .35));
      });
    },
    betreten: function(){ t0 = jetzt(); netz(); ball = null; geschossen = false; },
    bild: function(tt, dt){
      var c = L.ctx, t = jetzt() - t0;
      if (!geschossen && t > .8) schiess(-2.75, 1.95);
      var n = Math.max(1, Math.round(dt / (1 / 120))); for (var i = 0; i < n; i++) physik(dt / n);
      c.clearRect(0, 0, 1920, 1080);
      // Rasen und Linien
      c.lineCap = 'round';
      var r1 = proj(v3(-14, 0, -12)), r2 = proj(v3(14, 0, -12)), r3 = proj(v3(14, 0, 6)), r4 = proj(v3(-14, 0, 6));
      if (r1 && r2 && r3 && r4){ var g = c.createLinearGradient(0, r4.y, 0, 1080); g.addColorStop(0, 'rgba(20,60,34,.0)'); g.addColorStop(.25, 'rgba(20,60,34,.35)'); g.addColorStop(1, 'rgba(14,44,25,.6)');
        c.fillStyle = g; c.beginPath(); c.moveTo(r1.x, r1.y); c.lineTo(r2.x, r2.y); c.lineTo(r3.x, r3.y); c.lineTo(r4.x, r4.y); c.closePath(); c.fill(); }
      linie(c, v3(-12, 0, 0), v3(12, 0, 0), .07, 'rgba(242,245,241,.5)');
      linie(c, v3(-9.16, 0, 0), v3(-9.16, 0, -5.5), .07, 'rgba(242,245,241,.32)'); linie(c, v3(9.16, 0, 0), v3(9.16, 0, -5.5), .07, 'rgba(242,245,241,.32)');
      linie(c, v3(-9.16, 0, -5.5), v3(9.16, 0, -5.5), .05, 'rgba(242,245,241,.22)');
      // Netz
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(242,245,241,.42)';
      var reihen = ZE + DA, idx = function(r, cc){ return r * (SP + 1) + cc; };
      c.beginPath();
      for (var r = 0; r <= reihen; r++){ var erst = true; for (var cc = 0; cc <= SP; cc++){ var q = proj(knoten[idx(r, cc)].p); if (!q) continue; if (erst){ c.moveTo(q.x, q.y); erst = false; } else c.lineTo(q.x, q.y); } }
      for (cc = 0; cc <= SP; cc++){ erst = true; for (r = 0; r <= reihen; r++){ q = proj(knoten[idx(r, cc)].p); if (!q) continue; if (erst){ c.moveTo(q.x, q.y); erst = false; } else c.lineTo(q.x, q.y); } }
      c.stroke();
      // Seitennetze, angedeutet
      [-1, 1].forEach(function(sd){ for (var k = 1; k < 6; k++){ var z = TIEF * k / 6; linie(c, v3(sd * B / 2, 0, z), v3(sd * B / 2, U.lerp(H, H - .3, k / 6), z), .012, 'rgba(242,245,241,.28)'); } });
      // Pfosten, Latte, hintere Stangen
      [[v3(-B / 2, 0, 0), v3(-B / 2, H, 0)], [v3(B / 2, 0, 0), v3(B / 2, H, 0)], [v3(-B / 2, H, 0), v3(B / 2, H, 0)]].forEach(function(s){ linie(c, s[0], s[1], .12, '#F4F7F3'); });
      [[v3(-B / 2, H, 0), v3(-B / 2, H - .3, TIEF)], [v3(B / 2, H, 0), v3(B / 2, H - .3, TIEF)], [v3(-B / 2, 0, TIEF), v3(B / 2, 0, TIEF)], [v3(-B / 2, 0, 0), v3(-B / 2, 0, TIEF)], [v3(B / 2, 0, 0), v3(B / 2, 0, TIEF)]].forEach(function(s){ linie(c, s[0], s[1], .035, 'rgba(242,245,241,.5)'); });
      // Ball mit Spur
      if (ball){
        for (var j = 0; j < spur.length - 1; j++){ var a = proj(spur[j]), b = proj(spur[j + 1]); if (!a || !b) continue; c.strokeStyle = 'rgba(255,255,255,' + (j / spur.length * .35).toFixed(3) + ')'; c.lineWidth = .22 * F / b.z * (j / spur.length); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
        var bp = proj(ball.p);
        if (bp){
          var rad = .11 * F / bp.z, sch = proj(v3(ball.p.x, 0, ball.p.z));
          if (sch){ c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(sch.x, sch.y, rad * 1.1, rad * .35, 0, 0, 6.283); c.fill(); }
          var gr = c.createRadialGradient(bp.x - rad * .35, bp.y - rad * .4, rad * .1, bp.x, bp.y, rad);
          gr.addColorStop(0, '#ffffff'); gr.addColorStop(.7, '#dfe5e1'); gr.addColorStop(1, '#8d9692');
          c.fillStyle = gr; c.beginPath(); c.arc(bp.x, bp.y, rad, 0, 6.283); c.fill();
          c.fillStyle = '#16201b';
          for (var k2 = 0; k2 < 5; k2++){ var w = ball.dreh + k2 * 1.2566, px = bp.x + Math.cos(w) * rad * .55, py = bp.y + Math.sin(w * 1.3) * rad * .45; if (Math.cos(w) > -.3){ c.beginPath(); c.arc(px, py, rad * .2, 0, 6.283); c.fill(); } }
          c.beginPath(); c.arc(bp.x + Math.cos(ball.dreh * .7) * rad * .1, bp.y, rad * .22, 0, 6.283); c.fill();
        }
      }
    }
  };
})();

return SZ;
};
