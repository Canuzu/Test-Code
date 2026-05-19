/* ── FONT ── */
const fnt=new FontFace('WS',"url('https://cdn.jsdelivr.net/npm/@fontsource/great-vibes@4.5.4/files/great-vibes-latin-400-normal.woff2')");
fnt.load().then(l=>{document.fonts.add(l);document.querySelectorAll('.hwm').forEach(e=>e.style.fontFamily="'WS','Brush Script MT',cursive");}).catch(()=>{});

/* ── STORAGE ── */
const LS={
  get(k,d){try{const v=localStorage.getItem('rc_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('rc_'+k,JSON.stringify(v));}catch(e){}}
};

/* ── DATA ── */
const DATA={
  booster:[
    {n:'Prismatic Evolutions',s:'Scarlet & Violet',p:5.49,c:'#7c3aed',c2:'#a78bfa',bdg:'hot|BELIEBT',r:4.8,rv:312,stk:14,d:'Das aktuell beliebteste Set der Scarlet & Violet-Ära. Prismatic Evolutions überzeugt mit einzigartigen Prismatic-Illustrationen und einer beeindruckenden Seltenenauswahl.'},
    {n:'Twilight Masquerade',s:'Scarlet & Violet',p:4.99,c:'#5b21b6',c2:'#7c3aed',r:4.5,rv:187,stk:22,d:'Tauche ein in die mystische Welt der Twilight Masquerade. Mit vielen neuen ex-Pokémon und wunderschönen Illustrationen eine echte Bereicherung für jede Sammlung.'},
    {n:'Temporal Forces',s:'Scarlet & Violet',p:4.99,c:'#6d28d9',c2:'#9d77e8',r:4.6,rv:203,stk:19,d:'Temporal Forces bringt Paradox-Pokémon in neuen Varianten. Spannende Kombinationen aus Vergangenheit und Zukunft machen dieses Set besonders attraktiv.'},
    {n:'Paradox Rift',s:'Scarlet & Violet',p:5.49,c:'#4c1d95',c2:'#7c3aed',r:4.7,rv:256,stk:11,d:'Mit Paradox Rift treffen urzeitliche und futuristische Pokémon aufeinander. Einzigartige Artworks und starke Seltenenquote machen jeden Pack zum Erlebnis.'},
    {n:'Stellar Crown',s:'Scarlet & Violet',p:5.49,c:'#8b5cf6',c2:'#c4b5fd',bdg:'new|NEU',r:4.4,rv:98,stk:35,d:'Brandneu und bereits sehr gefragt: Stellar Crown glänzt mit neuen Stellar-Tera-Typen und aufwändig gestalteten Special Art Rares.'},
    {n:'Obsidian Flames',s:'Scarlet & Violet',p:4.99,c:'#3b0764',c2:'#6d28d9',r:4.6,rv:219,stk:8,d:'Obsidian Flames begeistert mit Tera-Pokémon in flammenden Illustrationen. Charizard ex als Highlight macht dieses Set zum Must-have.'},
    {n:'Shrouded Fable',s:'Scarlet & Violet',p:5.49,c:'#5b21b6',c2:'#8b5cf6',r:4.5,rv:141,stk:16,d:'Shrouded Fable entführt in eine märchenhafte Welt voller Geheimnisse. Atmosphärische Illustrationen und spannende Pulls.'},
    {n:'Scarlet & Violet 151',s:'Scarlet & Violet',p:6.99,c:'#6d28d9',c2:'#9d77e8',bdg:'hot|KLASSIKER',r:4.9,rv:445,stk:6,d:'Eine Hommage an die ersten 151 Pokémon – mit nostalgischen Designs und modernen Illustrationen. Eines der beliebtesten Sets überhaupt.'}
  ],
  single:[
    {n:'Charizard ex (SAR)',s:'Obsidian Flames',p:89.99,c:'#7c2020',c2:'#c45c5c',bdg:'ex|TOP PULL',r:4.9,rv:78,stk:2,d:'Der König der Pulls – Charizard ex als Special Art Rare. Atemberaubendes Artwork, Mint-Zustand, mit Toploader geliefert.'},
    {n:'Mewtwo ex (SAR)',s:'Scarlet & Violet 151',p:34.99,c:'#4c1d95',c2:'#7c3aed',bdg:'hot|BELIEBT',r:4.8,rv:112,stk:4,d:'Mewtwo ex in einer der schönsten Illustrationen des 151-Sets. Cinematisches Artwork, absoluter Hingucker in jeder Sammlung.'},
    {n:'Umbreon ex (SAR)',s:'Paldean Fates',p:78.99,c:'#1e1b4b',c2:'#4c1d95',r:4.8,rv:64,stk:1,d:'Umbreon ex aus Paldean Fates – eines der stimmungsvollsten Artworks der Scarlet & Violet-Ära. Sehr limitiert.'},
    {n:'Pikachu ex (SAR)',s:'Paldean Fates',p:42.99,c:'#854f0b',c2:'#ef9f27',r:4.7,rv:89,stk:3,d:'Das Maskottchen in einer unvergleichlich charmanten Special Art Rare-Illustration aus Paldean Fates.'},
    {n:'Gardevoir ex (SAR)',s:'Paldea Evolved',p:28.99,c:'#831843',c2:'#db2777',r:4.6,rv:97,stk:5,d:'Gardevoir ex mit elegantem Artwork aus Paldea Evolved. Eine der beliebtesten SAR-Karten des Sets.'},
    {n:'Lugia V (Alt Art)',s:'Silver Tempest',p:159.99,c:'#0c447c',c2:'#378add',bdg:'rare|ALT ART',r:5.0,rv:43,stk:1,d:'Das legendäre Lugia V als eines der meistdiskutierten Alt-Art-Artworks überhaupt. Extrem selten – absolutes Sammlerstück.'},
    {n:'Rayquaza ex (SAR)',s:'Pokémon GO MEW',p:64.99,c:'#14532d',c2:'#16a34a',r:4.7,rv:55,stk:2,d:'Rayquaza ex mit dynamischem Artwork. Dauerhaft sehr gefragt bei Sammlern.'},
    {n:'Miraidon ex (SAR)',s:'Scarlet & Violet',p:18.99,c:'#1e3a5f',c2:'#3b82f6',r:4.5,rv:134,stk:7,d:'Miraidon ex – futuristischer Einstieg in die Scarlet & Violet-Ära. Toller Einstiegspreis für eine hochwertige Special Art Rare.'}
  ],
  set:[
    {n:'Prismatic Evolutions Display',s:'Display (36 Packs)',p:189.99,c:'#7c3aed',c2:'#a78bfa',bdg:'hot|BELIEBT',r:4.9,rv:167,stk:5,d:'36 Booster Packs im Originalkarton. Maximale Chance auf seltene Pulls. Versiegelt, direkt vom Großhändler.'},
    {n:'Stellar Crown ETB',s:'Elite Trainer Box',p:54.99,c:'#8b5cf6',c2:'#c4b5fd',bdg:'new|NEU',r:4.5,rv:41,stk:9,d:'Die Elite Trainer Box zu Stellar Crown mit Booster Packs sowie exklusiven Sleeves, Würfeln, Münze und Energiekarten.'},
    {n:'Scarlet & Violet 151 Display',s:'Display (36 Packs)',p:149.99,c:'#6d28d9',c2:'#9d77e8',r:4.8,rv:123,stk:3,d:'Das komplette Display zum Kult-Set 151. 36 Packs für maximale Öffner-Freude.'},
    {n:'Paradox Rift ETB',s:'Elite Trainer Box',p:39.99,c:'#4c1d95',c2:'#7c3aed',r:4.6,rv:88,stk:12,d:'Die ETB zu Paradox Rift mit exklusiven Sleeves mit Roaring Moon oder Iron Valiant.'},
    {n:'Prismatic Evolutions ETB',s:'Elite Trainer Box',p:54.99,c:'#7c3aed',c2:'#a78bfa',r:4.8,rv:95,stk:4,d:'Die ETB zu Prismatic Evolutions mit exklusiven Sleeves, Würfeln, Münze und Booster Packs.'},
    {n:'Temporal Forces Display',s:'Display (36 Packs)',p:134.99,c:'#5b21b6',c2:'#8b5cf6',r:4.6,rv:76,stk:7,d:'36 Packs Temporal Forces im Displaykarton – ideal für Gruppenöffnungen.'}
  ],
  zubehoer:[
    {n:'Dragon Shield Matte Purple',s:'Sleeves (100er)',p:9.99,c:'#6d28d9',c2:'#9d77e8',bdg:'hot|TOP',r:4.8,rv:534,stk:48,d:'Dragon Shield Matte Purple – der Standard für Pokémon-Sammler. Perfekte Passform, matte Oberfläche, strapazierfähig.'},
    {n:'Dragon Shield Classic Clear',s:'Sleeves (100er)',p:8.99,c:'#374151',c2:'#6b7280',r:4.7,rv:389,stk:60,d:'Der Klassiker von Dragon Shield: transparente Sleeves für Turnierspieler.'},
    {n:'Ultra Pro 9-Pocket Binder',s:'Binder',p:19.99,c:'#1e3a5f',c2:'#3b82f6',r:4.5,rv:267,stk:22,d:'Hochwertiger Sammlerbinder mit 9 Taschen pro Seite, 360 Karten Kapazität, robuster Ringbindung.'},
    {n:'KMC Perfect Fit Sleeves',s:'Inner Sleeves (100er)',p:6.99,c:'#1a2e1a',c2:'#16a34a',r:4.8,rv:412,stk:75,d:'KMC Perfect Fit – der Standard für Double-Sleeving. Äußerst dünn und passgenau.'},
    {n:'BCW Card Storage Box 800',s:'Storage',p:14.99,c:'#3b2000',c2:'#9a5000',r:4.3,rv:156,stk:18,d:'Stabile Kartonbox für bis zu 800 Karten. Mit Trennkarten-Set. Perfekt für große Sammlungen.'},
    {n:'Toploader 3×4 (100er Pack)',s:'Toploaders',p:12.99,c:'#1c1c2e',c2:'#555577',r:4.6,rv:298,stk:40,d:'Hochwertige Semi-Rigid Toploaders im 100er Pack. Der Standard für Hochwert-Karten.'},
    {n:'RoyalCards Playmat',s:'Playmat',p:34.99,c:'#4c1d95',c2:'#7c3aed',bdg:'ex|EXKLUSIV',r:4.9,rv:87,stk:11,d:'Das exklusive RoyalCards Playmat der ersten Edition. Rutschfeste Unterseite, weiches Mikrofaser-Oberteil.'},
    {n:'Semi-Rigid Card Sleeves (50er)',s:'Card Savers',p:7.99,c:'#1e3a5f',c2:'#5b9bd5',r:4.5,rv:183,stk:55,d:'Halbsteife Card Savers im 50er Pack – die bevorzugte Lösung für den Versand von Singles.'}
  ]
};

const LEGAL={
  impressum:`<h3>ANGABEN GEMÄSS § 5 TMG</h3><p>RoyalCards GmbH<br>Musterstraße 42<br>50667 Köln</p><h3>KONTAKT</h3><p>Telefon: +49 (0) 221 123456<br>E-Mail: info@royalcards.de</p><h3>REGISTEREINTRAG</h3><p>Amtsgericht Köln · HRB 12345</p><h3>UMSATZSTEUER-ID</h3><p>DE123456789</p><h3>VERANTWORTLICH FÜR DEN INHALT</h3><p>Max Mustermann · Anschrift wie oben</p>`,
  datenschutz:`<h3>DATENSCHUTZERKLÄRUNG</h3><p>Der Schutz Ihrer persönlichen Daten ist uns wichtig. Wir verarbeiten Ihre Daten ausschließlich gemäß DSGVO.</p><h3>VERANTWORTLICHER</h3><p>RoyalCards GmbH, Musterstraße 42, 50667 Köln</p><h3>ERHOBENE DATEN</h3><p>Wir erheben Daten, die Sie bei Bestellung oder Kontakt freiwillig angeben. Diese werden ausschließlich zur Bestellabwicklung verwendet.</p><h3>COOKIES & LOKALE SPEICHERUNG</h3><p>Wir nutzen den Local Storage Ihres Browsers, um Warenkorb, Merkliste und Designeinstellung zu speichern. Diese Daten verlassen Ihr Gerät nicht.</p><h3>IHRE RECHTE</h3><p>Auskunft, Berichtigung, Löschung: datenschutz@royalcards.de</p>`,
  agb:`<h3>ALLGEMEINE GESCHÄFTSBEDINGUNGEN</h3><h3>VERTRAGSABSCHLUSS</h3><p>Erst durch Ihre Bestellung und unsere Bestätigungs-E-Mail kommt ein Kaufvertrag zustande.</p><h3>PREISE & ZAHLUNG</h3><p>Alle Preise inkl. gesetzlicher MwSt. Zahlung per PayPal, Kreditkarte, Klarna oder Überweisung.</p><h3>LIEFERUNG</h3><p>Lieferzeit 2–5 Werktage innerhalb Deutschlands. Versandkosten 3,99 €, ab 50 € versandkostenfrei.</p><h3>WIDERRUFSRECHT</h3><p>14 Tage ohne Angabe von Gründen. Kontakt: widerruf@royalcards.de</p>`,
  widerruf:`<h3>WIDERRUFSBELEHRUNG</h3><p>Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p><h3>FOLGEN DES WIDERRUFS</h3><p>Wir erstatten Ihnen alle Zahlungen unverzüglich, spätestens binnen 14 Tagen nach Eingang Ihres Widerrufs.</p><h3>MUSTER-WIDERRUFSFORMULAR</h3><p>An RoyalCards GmbH, Musterstraße 42, 50667 Köln · widerruf@royalcards.de</p><p>Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren …</p>`,
  versand:`<h3>VERSAND</h3><p>Lieferzeit 2–5 Werktage. Versandkosten: 3,99 € innerhalb Deutschlands (ab 50 € versandkostenfrei). Express: 7,99 €.</p><h3>RÜCKGABE</h3><p>14 Tage Rückgaberecht bei Originalzustand. Rücksendung kostenfrei innerhalb Deutschlands. E-Mail: retoure@royalcards.de</p><h3>VERPACKUNG</h3><p>Singles werden in Toploadern und gepolsterten Umschlägen versendet. Versiegelte Produkte original verpackt.</p>`,
  faq:`<h3>HÄUFIGE FRAGEN</h3><h3>Sind eure Singles geprüft?</h3><p>Ja, jede Einzelkarte wird von uns persönlich geprüft. Wir verkaufen ausschließlich Mint bis Near-Mint Karten.</p><h3>Kann ich eine Bestellung stornieren?</h3><p>Innerhalb von 2 Stunden nach Bestellung per E-Mail an storno@royalcards.de möglich.</p><h3>Wie werden Singles versendet?</h3><p>In Toploadern und gepolsterten Umschlägen. Karten über 20 € werden zusätzlich versichert.</p><h3>Kann ich Karten reservieren lassen?</h3><p>Bei seltenen Karten gerne per Anfrage an info@royalcards.de.</p>`,
  kontakt:`<h3>KONTAKT</h3><p>📧 info@royalcards.de<br>📞 +49 (0) 221 123456<br>🕐 Mo–Fr, 10–18 Uhr</p><h3>ANSCHRIFT</h3><p>RoyalCards GmbH<br>Musterstraße 42<br>50667 Köln</p><h3>SOCIAL MEDIA</h3><p>Folge uns für News, Pulls und Aktionen!</p>`,
  ueber:`<h3>ÜBER ROYALCARDS</h3><p>RoyalCards ist dein vertrauensvoller Shop für Pokémon-Karten aus Köln. Wir sind selbst Sammler und Spieler – und genau aus dieser Leidenschaft heraus entstand RoyalCards.</p><h3>UNSER VERSPRECHEN</h3><p>Geprüfte Qualität bei jeder Einzelkarte, sicherer Versand und ein Kundenservice, der seinen Namen verdient.</p><h3>UNSERE GESCHICHTE</h3><p>Was als kleines Hobby begann, ist heute ein vollwertiger Online-Shop mit kuratiertem Sortiment für Sammler aus ganz Deutschland.</p>`
};

/* ── HELPERS ── */
const PER_PAGE=6;
const pgState={};
let wishlist=new Set(LS.get('wl',[]));
const productReviews=LS.get('reviews',{});
let revRating=0, activeDiscount=null, satcObserver=null, currentDetail={cat:null,idx:null};
let srchHistory=LS.get('srch',[]), srchMinP='', srchMaxP='';
const SHIP_COST=3.99, SHIP_FREE=50;

function fmt(p){return p.toFixed(2).replace('.',',');}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());}
function stk(s){if(s<=0)return{cls:'out',txt:'Ausverkauft'};if(s<=3)return{cls:'low',txt:`Nur noch ${s} auf Lager`};return{cls:'ok',txt:'Auf Lager'};}
function stars(r,sz){sz=sz||11;let h='<div style="display:flex;gap:2px" aria-label="'+r+' von 5 Sternen">';for(let i=1;i<=5;i++){const f=i<=Math.round(r);h+=`<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${f?'#a78bfa':'none'}" stroke="#a78bfa" stroke-width="1.5" aria-hidden="true"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`;}return h+'</div>';}
function delivDate(){const d=new Date();let days=d.getHours()<15?2:3,added=0;while(added<days){d.setDate(d.getDate()+1);const dow=d.getDay();if(dow!==0&&dow!==6)added++;}const wd=['So','Mo','Di','Mi','Do','Fr','Sa'],mo=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];return`${wd[d.getDay()]}, ${d.getDate()}. ${mo[d.getMonth()]}`;}

function cardSVG(c1,c2,lg){const w=lg?180:50,h=lg?244:68;return `<svg width="${w}" height="${h}" viewBox="0 0 50 68" fill="none" aria-hidden="true"><rect x="1" y="9" width="32" height="46" rx="4" fill="#1a1228" stroke="#4a3a6e" stroke-width="0.7" transform="rotate(-8 17 32)"/><rect x="14" y="3" width="32" height="46" rx="4" fill="${c1}" stroke="${c2}" stroke-width="0.5" transform="rotate(4 30 26)"/><rect x="17" y="6" width="26" height="38" rx="2.5" fill="none" stroke="${c2}" stroke-width="0.4" opacity="0.45" transform="rotate(4 30 26)"/><text x="30" y="40" font-family="Cinzel,Georgia,serif" font-size="10" font-weight="600" fill="#0d0d1a" text-anchor="middle" transform="rotate(4 30 40)">RC</text></svg>`;}
function cardBack(lg){const w=lg?180:50,h=lg?244:68;return `<svg width="${w}" height="${h}" viewBox="0 0 50 68" fill="none" aria-hidden="true"><rect x="2" y="2" width="46" height="64" rx="4" fill="#13102a" stroke="#6d28d9" stroke-width="0.8"/><rect x="6" y="6" width="38" height="56" rx="3" fill="none" stroke="#3a2a5e" stroke-width="0.5"/><text x="25" y="37" font-family="Cinzel,Georgia,serif" font-size="8" fill="#4a3a6e" text-anchor="middle" letter-spacing="2">ROYAL</text><text x="25" y="47" font-family="Cinzel,Georgia,serif" font-size="8" fill="#4a3a6e" text-anchor="middle" letter-spacing="2">CARDS</text></svg>`;}
function cardGrade(c1,c2,lg){const w=lg?180:50,h=lg?244:68;return `<svg width="${w}" height="${h}" viewBox="0 0 50 68" fill="none" aria-hidden="true"><rect x="2" y="2" width="46" height="64" rx="4" fill="${c1}" stroke="${c2}" stroke-width="0.8"/><rect x="5" y="5" width="40" height="58" rx="3" fill="none" stroke="${c2}" stroke-width="0.4" opacity="0.4"/><rect x="8" y="8" width="34" height="10" rx="2" fill="rgba(0,0,0,.5)"/><text x="25" y="17" font-family="Cinzel,Georgia,serif" font-size="6" fill="#4ade80" text-anchor="middle" letter-spacing="1">MINT</text><text x="25" y="42" font-family="Cinzel,Georgia,serif" font-size="10" fill="${c2}" text-anchor="middle" font-weight="600">9.8</text></svg>`;}
function sleevesSVG(c1,c2,lg){const w=lg?210:70,h=lg?165:55;return `<svg width="${w}" height="${h}" viewBox="0 0 70 55" fill="none" aria-hidden="true"><rect x="0" y="12" width="38" height="38" rx="3" fill="#1a1228" stroke="${c2}" stroke-width="0.6" transform="rotate(-6 19 31)"/><rect x="16" y="8" width="38" height="38" rx="3" fill="${c1}" stroke="${c2}" stroke-width="0.6"/><rect x="19" y="11" width="32" height="32" rx="2" fill="none" stroke="${c2}" stroke-width="0.4" opacity="0.5"/><rect x="28" y="5" width="38" height="38" rx="3" fill="${c1}cc" stroke="${c2}" stroke-width="0.5" transform="rotate(5 47 24)" opacity="0.6"/></svg>`;}
function boxSVG(c1,c2,lg){const w=lg?240:80,h=lg?165:55;return `<svg width="${w}" height="${h}" viewBox="0 0 80 55" fill="none" aria-hidden="true"><rect x="5" y="18" width="70" height="34" rx="4" fill="#1a0a2e" stroke="${c2}" stroke-width="0.7"/><rect x="5" y="18" width="70" height="12" rx="4" fill="${c1}" stroke="${c2}" stroke-width="0.6"/><rect x="5" y="24" width="70" height="6" rx="0" fill="${c1}cc"/><rect x="15" y="6" width="50" height="26" rx="3" fill="#13102a" stroke="${c2}" stroke-width="0.6"/><rect x="15" y="6" width="50" height="9" rx="3" fill="${c1}99" stroke="${c2}" stroke-width="0.5"/><text x="40" y="20" font-family="Cinzel,Georgia,serif" font-size="7" fill="${c2}" text-anchor="middle" letter-spacing="1" opacity="0.8">DISPLAY</text></svg>`;}
function getImgFn(cat){return cat==='zubehoer'?sleevesSVG:cat==='set'?boxSVG:cardSVG;}

/* ── CARD RENDER ── */
function mkCard(item,cat,feat,origIdx){
  const type=cat==='booster'?'BOOSTER PACK':cat==='single'?'SINGLE':cat==='set'?'DISPLAY / ETB':'ZUBEHÖR';
  const bd=item.bdg?item.bdg.split('|'):['',''];
  const bC=bd[0],bT=bd[1];
  const sk=stk(item.stk);
  const wlKey=`${cat}-${origIdx}`;
  const isWL=wishlist.has(wlKey);
  const nmEsc=esc(item.n);
  const nmAttr=item.n.replace(/"/g,'&quot;');
  return `<article class="prod${feat?' feat':''}" data-cat="${cat}" data-price="${item.p}" data-name="${nmAttr}" data-idx="${origIdx}" data-qty="1" onclick="openDetail(event,'${cat}',${origIdx})" tabindex="0" onkeydown="if(event.key==='Enter')openDetail(event,'${cat}',${origIdx})">
    <div class="pimg">
      ${getImgFn(cat)(item.c,item.c2,false)}
      <div class="p-ov"><p>${esc(item.d)}</p></div>
      <button class="wl-card-btn${isWL?' act':''}" type="button" data-wl="${wlKey}" onclick="event.stopPropagation();toggleWLItem('${cat}',${origIdx},this)" aria-label="${isWL?'Von Merkliste entfernen':'Auf Merkliste'}" aria-pressed="${isWL}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${isWL?'#f0eaff':'none'}" stroke="#f0eaff" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      ${bT?`<div class="pbdg ${bC}">${esc(bT)}</div>`:''}
    </div>
    <div class="pinfo">
      <div class="ptyp">${type}</div>
      <h3 class="pnm">${nmEsc}</h3>
      <div class="psub">${esc(item.s)}</div>
      <div class="pstars">${stars(item.r)}<span class="pstars-ct">(${item.rv})</span></div>
      <div class="pstock ${sk.cls}">${sk.txt}</div>
      <div class="qty-row" onclick="event.stopPropagation()" role="group" aria-label="Anzahl">
        <button class="qbtn" type="button" onclick="chQty(this,-1)" aria-label="Weniger">−</button>
        <div class="qty-val" aria-live="polite">1</div>
        <button class="qbtn" type="button" onclick="chQty(this,1)" aria-label="Mehr">+</button>
      </div>
      <div class="pft">
        <div class="prc">${fmt(item.p)} €</div>
        ${item.stk>0
          ?`<button class="abtn" type="button" onclick="event.stopPropagation();addCart(this)" aria-label="${nmAttr} in den Warenkorb">KAUFEN</button>`
          :`<button class="abtn dis" type="button" onclick="event.stopPropagation();openSA('${nmAttr}')" aria-label="Bei Verfügbarkeit benachrichtigen">ALARM</button>`
        }
      </div>
    </div>
  </article>`;
}

/* ── PAGINATION ── */
function renderPaged(gridId,items,cat){
  const st=pgState[gridId]||{page:1};
  pgState[gridId]={page:st.page||1,items,cat};
  showPage(gridId,pgState[gridId].page);
}
function showPage(gridId,pg){
  const st=pgState[gridId];
  if(!st) return;
  const total=Math.ceil(st.items.length/PER_PAGE);
  pg=Math.max(1,Math.min(pg,total||1));
  pgState[gridId].page=pg;
  const slice=st.items.slice((pg-1)*PER_PAGE,pg*PER_PAGE);
  const gridEl=document.getElementById(gridId);
  if(!st.items.length){
    gridEl.innerHTML=`<div class="empty-grid">Keine Produkte gefunden.<br><button type="button" onclick="sbReset('${st.cat}','${gridId}')">Filter zurücksetzen</button></div>`;
  } else {
    gridEl.innerHTML=slice.map((o,i)=>mkCard(o.it,st.cat,i===0&&pg===1,o.oi)).join('');
  }
  const cntMap={bGrid:'bCnt',sGrid:'sCnt',dGrid:'dCnt',zGrid:'zCnt'};
  const cntEl=document.getElementById(cntMap[gridId]);
  if(cntEl) cntEl.textContent=`${st.items.length} Produkt${st.items.length!==1?'e':''}`;
  const pag=document.getElementById('pag-'+gridId);
  if(pag) pag.innerHTML=total>1?`<button class="pag-btn" type="button" onclick="showPage('${gridId}',${pg-1})" ${pg===1?'disabled':''}>← ZURÜCK</button><span class="pag-info">${pg} / ${total}</span><button class="pag-btn" type="button" onclick="showPage('${gridId}',${pg+1})" ${pg>=total?'disabled':''}>WEITER →</button>`:'';
}
function initGrid(cat,gridId){
  const items=DATA[cat].map((it,oi)=>({it,oi}));
  pgState[gridId]={page:1};
  renderPaged(gridId,items,cat);
  const sets=Array.from(new Set(DATA[cat].map(p=>p.s)));
  const setMap={bGrid:'bSets',sGrid:'sSets',dGrid:'dSets',zGrid:'zSets'};
  const el=document.getElementById(setMap[gridId]);
  if(el) el.innerHTML=sets.map(s=>`<label class="sb-cb-row"><input type="checkbox" class="sb-set" value="${esc(s)}"> ${esc(s)}</label>`).join('');
}

/* ── SIDEBAR FILTER ── */
const catMinMax={booster:['bMin','bMax'],single:['sMin','sMax'],set:['dMin','dMax'],zubehoer:['zMin','zMax']};
const catSetIds={booster:'bSets',single:'sSets',set:'dSets',zubehoer:'zSets'};
function sbFilter(cat,gridId){
  const mm=catMinMax[cat];
  const mn=parseFloat(document.getElementById(mm[0]).value)||0;
  const mx=parseFloat(document.getElementById(mm[1]).value)||Infinity;
  const sets=Array.from(document.querySelectorAll('#'+catSetIds[cat]+' .sb-set:checked')).map(c=>c.value);
  const av=cat==='single'?document.getElementById('sAvail').checked:false;
  const filtered=DATA[cat].map((it,oi)=>({it,oi})).filter(o=>{
    if(o.it.p<mn||o.it.p>mx) return false;
    if(sets.length&&sets.indexOf(o.it.s)===-1) return false;
    if(av&&o.it.stk<=0) return false;
    return true;
  });
  pgState[gridId]={page:1};
  renderPaged(gridId,filtered,cat);
}
function sbReset(cat,gridId){
  const mm=catMinMax[cat];
  document.getElementById(mm[0]).value='';
  document.getElementById(mm[1]).value='';
  document.querySelectorAll('#'+catSetIds[cat]+' .sb-set').forEach(cb=>cb.checked=false);
  const av=document.getElementById('sAvail'); if(av) av.checked=false;
  const sortEl=document.getElementById(gridId.charAt(0)+'Sort'); if(sortEl) sortEl.value='';
  pgState[gridId]={page:1};
  initGrid(cat,gridId);
}
function sortG(cat,gridId,mode){
  const st=pgState[gridId];
  if(!st) return;
  const sorted=st.items.slice();
  if(mode==='asc') sorted.sort((a,b)=>a.it.p-b.it.p);
  else if(mode==='desc') sorted.sort((a,b)=>b.it.p-a.it.p);
  else if(mode==='az') sorted.sort((a,b)=>a.it.n.localeCompare(b.it.n));
  else if(mode==='rate') sorted.sort((a,b)=>b.it.r-a.it.r);
  pgState[gridId].page=1;
  renderPaged(gridId,sorted,cat);
}
function toggleSb(btn){
  const c=btn.nextElementSibling;
  const on=c.classList.toggle('on');
  btn.textContent=on?'✕ FILTER AUSBLENDEN':'⚙ FILTER ANZEIGEN';
}

/* ── MAIN GRID ── */
const mI=[{it:DATA.booster[0],oi:0,cat:'booster'},{it:DATA.set[0],oi:0,cat:'set'},{it:DATA.single[0],oi:0,cat:'single'},{it:DATA.booster[1],oi:1,cat:'booster'},{it:DATA.single[1],oi:1,cat:'single'},{it:DATA.zubehoer[0],oi:0,cat:'zubehoer'}];
document.getElementById('mainGrid').innerHTML=mI.map((o,i)=>mkCard(o.it,o.cat,i===1,o.oi)).join('');
initGrid('booster','bGrid');initGrid('single','sGrid');initGrid('set','dGrid');initGrid('zubehoer','zGrid');

/* ── PRODUCT DETAIL ── */
function openDetail(e,cat,idx){
  if(e&&(e.target.closest('.qty-row')||e.target.closest('.abtn')||e.target.closest('.wl-card-btn'))) return;
  populateDetail(cat,idx);
  navPage('detail');
  history.pushState({page:'detail',cat,idx},'','#detail');
}
let pdQty=1;
function populateDetail(cat,idx){
  currentDetail={cat,idx};
  const p=DATA[cat][idx];
  const type=cat==='booster'?'BOOSTER PACK':cat==='single'?'SINGLE':cat==='set'?'DISPLAY / ETB':'ZUBEHÖR';
  const catName=cat==='booster'?'BOOSTER PACKS':cat==='single'?'SINGLES':cat==='set'?'DISPLAYS & ETBs':'ZUBEHÖR';
  const bd=p.bdg?p.bdg.split('|'):['',''];
  const bC=bd[0],bT=bd[1];
  const sk=stk(p.stk);
  const wlKey=`${cat}-${idx}`;
  const isWL=wishlist.has(wlKey);
  const nmAttr=p.n.replace(/"/g,'&quot;');
  const imgFn=getImgFn(cat);
  pdQty=1;
  const sim=DATA[cat].map((it,oi)=>({it,oi})).filter(o=>o.oi!==idx).slice(0,3);
  const defaultRevs=[{av:'M',nm:'Markus H.',dt:'12.04.2025',r:5,txt:'Superschnelle Lieferung, perfekt verpackt. Sehr empfehlenswert!'},{av:'L',nm:'Laura K.',dt:'28.03.2025',r:4,txt:'Tolle Qualität, gut verpackt und schnell angekommen. Gerne wieder.'},{av:'P',nm:'Patrick S.',dt:'15.03.2025',r:5,txt:'Top Shop! Kommunikation war super, Karte genau wie beschrieben.'}];
  const revs=(productReviews[wlKey]||[]).concat(defaultRevs);
  document.getElementById('pdContent').innerHTML=`
    <nav class="pd-bc" aria-label="Brotkrumen"><button class="bc-lnk" type="button" onclick="nav('main')">HOME</button><span class="bc-sep">›</span><button class="bc-lnk" type="button" onclick="nav('${cat}')">${catName}</button><span class="bc-sep">›</span><span class="bc-cur">${esc(p.n)}</span></nav>
    <div class="pd-layout">
      <div class="pd-art-col">
        <div class="pd-main-img" id="pdMainImg">${imgFn(p.c,p.c2,true)}</div>
        <div class="pd-thumbs" role="tablist" aria-label="Bildgalerie">
          <button class="pd-thumb act" type="button" onclick="switchGallery(0,this,'${cat}',${idx})" aria-label="Vorderseite"><svg width="36" height="48" viewBox="0 0 50 68" fill="none" aria-hidden="true"><rect x="14" y="3" width="32" height="46" rx="4" fill="${p.c}" stroke="${p.c2}" stroke-width="0.5" transform="rotate(4 30 26)"/></svg></button>
          <button class="pd-thumb" type="button" onclick="switchGallery(1,this,'${cat}',${idx})" aria-label="Rückseite"><svg width="36" height="48" viewBox="0 0 50 68" fill="none" aria-hidden="true"><rect x="2" y="2" width="46" height="64" rx="4" fill="#13102a" stroke="#6d28d9" stroke-width="0.8"/></svg></button>
          <button class="pd-thumb" type="button" onclick="switchGallery(2,this,'${cat}',${idx})" aria-label="Grading"><svg width="36" height="48" viewBox="0 0 50 68" fill="none" aria-hidden="true"><rect x="2" y="2" width="46" height="64" rx="4" fill="${p.c}" stroke="${p.c2}" stroke-width="0.8"/><text x="25" y="37" font-family="Cinzel,Georgia,serif" font-size="8" fill="${p.c2}" text-anchor="middle">MINT</text></svg></button>
        </div>
        ${bT?`<div class="pd-art-bdg pbdg ${bC}">${esc(bT)}</div>`:''}
      </div>
      <div class="pd-info-col" id="pdInfoCol">
        <div class="pd-type">${type}</div>
        <h1 class="pd-name">${esc(p.n)}</h1>
        <div class="pd-series">${esc(p.s)}</div>
        <div class="pd-rating-row">${stars(p.r,13)}<span class="pd-rval">${p.r}</span><span class="pd-rct">(${p.rv} Bewertungen)</span></div>
        <div class="pd-div"></div>
        <div class="pd-price">${fmt(p.p)} €</div>
        <div class="pd-stock-row"><div class="pd-sdot ${sk.cls}"></div><div class="pd-stxt ${sk.cls}">${sk.txt}</div></div>
        <div class="pd-delivery">📦 Heute bestellt → Lieferung <span>${delivDate()}</span></div>
        <div class="pd-desc-s">${esc(p.d)}</div>
        <div class="pd-div"></div>
        <div class="pd-qrow" role="group" aria-label="Anzahl"><button class="pd-qbtn" type="button" onclick="pdChQty(-1)" aria-label="Weniger">−</button><div class="pd-qval" id="pdQval" aria-live="polite">1</div><button class="pd-qbtn" type="button" onclick="pdChQty(1)" aria-label="Mehr">+</button></div>
        <button class="pd-abtn${p.stk<=0?' dis':''}" type="button" onclick="pdAddCart('${nmAttr}',${p.p},${p.stk})">${p.stk>0?'IN DEN WARENKORB':'BEI VERFÜGBARKEIT BENACHRICHTIGEN'}</button>
        <div class="pd-actions">
          <button class="pd-wl-btn${isWL?' act':''}" type="button" id="pdWlBtn" onclick="toggleWLItem('${cat}',${idx},null,true)" aria-pressed="${isWL}">${isWL?'♥ AUF MERKLISTE':'♡ AUF MERKLISTE'}</button>
          <div style="position:relative;flex:1">
            <button class="pd-share-btn" type="button" onclick="toggleShareDrop()" aria-haspopup="true" aria-expanded="false" id="shareBtn">TEILEN ↗</button>
            <div class="share-drop" id="shareDrop" role="menu">
              <a onclick="shareWA('${nmAttr}',${p.p})" role="menuitem" tabindex="0">📱 WhatsApp</a>
              <a onclick="shareMail('${nmAttr}',${p.p})" role="menuitem" tabindex="0">✉️ E-Mail</a>
              <a onclick="copyLink()" role="menuitem" tabindex="0">🔗 Link kopieren</a>
            </div>
          </div>
        </div>
        <div class="pd-sec-strip"><div class="pd-sec-item">🔒 SSL</div><div class="pd-sec-item">🛡️ Käuferschutz</div><div class="pd-sec-item">📦 Schneller Versand</div><div class="pd-sec-item">↩ 14 Tage Rückgabe</div></div>
      </div>
    </div>
    <div class="pd-tabs-wrap">
      <div class="pd-tab-bar" role="tablist"><button class="pd-tab act" type="button" onclick="switchTab(this,'tc-d')" role="tab">BESCHREIBUNG</button><button class="pd-tab" type="button" onclick="switchTab(this,'tc-dt')" role="tab">DETAILS</button><button class="pd-tab" type="button" onclick="switchTab(this,'tc-r')" role="tab">BEWERTUNGEN (${p.rv})</button></div>
      <div class="pd-tc on" id="tc-d" role="tabpanel"><p class="pd-tc-txt">${esc(p.d)} Alle Karten werden von uns sorgfältig geprüft und sicher verpackt versendet. Singles werden in Toploadern geliefert, Booster und Sets original versiegelt.</p></div>
      <div class="pd-tc" id="tc-dt" role="tabpanel"><table class="pd-dtbl"><tbody><tr><td>KATEGORIE</td><td>${type}</td></tr><tr><td>SET / SERIE</td><td>${esc(p.s)}</td></tr><tr><td>PREIS</td><td>${fmt(p.p)} €</td></tr><tr><td>VERFÜGBARKEIT</td><td>${sk.txt}</td></tr><tr><td>ZUSTAND</td><td>${cat==='single'?'Mint / Near-Mint':'Originalverpackt'}</td></tr><tr><td>BEWERTUNG</td><td>${p.r} / 5.0</td></tr></tbody></table></div>
      <div class="pd-tc" id="tc-r" role="tabpanel">
        <div id="revList">${revs.map(rv=>`<div class="review"><div class="rev-av" aria-hidden="true">${esc(rv.av||rv.nm[0])}</div><div><div class="rev-nm">${esc(rv.nm)}</div><div class="rev-dt">${esc(rv.dt)}</div>${stars(rv.r,11)}<div class="rev-txt">${esc(rv.txt)}</div></div></div>`).join('')}</div>
        <div class="rev-form">
          <div class="rev-form-ttl">BEWERTUNG ABGEBEN</div>
          <div class="rev-stars-wrap" role="radiogroup" aria-label="Sternebewertung">${[1,2,3,4,5].map(i=>`<button type="button" class="rev-star" onclick="setRevStar(${i})" data-s="${i}" aria-label="${i} Sterne">★</button>`).join('')}</div>
          <label class="sr" for="revText">Bewertungstext</label>
          <textarea class="rev-ta" id="revText" placeholder="Deine Erfahrung mit diesem Produkt…"></textarea>
          <label class="sr" for="revName">Dein Name</label>
          <input class="rev-inp" id="revName" placeholder="Dein Name (optional)">
          <button class="rev-submit" type="button" onclick="submitRev('${cat}',${idx})">BEWERTUNG ABGEBEN</button>
        </div>
      </div>
    </div>
    <div class="pd-sim"><div class="pd-sim-ttl">ÄHNLICHE PRODUKTE</div><div class="sim-grid">${sim.map(o=>mkCard(o.it,cat,false,o.oi)).join('')}</div></div>`;
  initSATC(p.n,p.p,p.stk);
}
function switchGallery(n,el,cat,idx){
  const p=DATA[cat][idx];
  const imgs=[getImgFn(cat)(p.c,p.c2,true),cardBack(true),cardGrade(p.c,p.c2,true)];
  document.getElementById('pdMainImg').innerHTML=imgs[n];
  el.closest('.pd-thumbs').querySelectorAll('.pd-thumb').forEach(t=>t.classList.remove('act'));
  el.classList.add('act');
}
function pdChQty(d){pdQty=Math.max(1,pdQty+d);const el=document.getElementById('pdQval');if(el)el.textContent=pdQty;}
function pdAddCart(name,price,stock){
  if(stock<=0){openSA(name);return;}
  const ex=cart.find(i=>i.name===name);
  if(ex)ex.qty+=pdQty; else cart.push({name,price,qty:pdQty});
  saveCart();renderCart();flashCart();
  showToast(pdQty>1?`${pdQty}× ${name.length>20?name.substring(0,20)+'…':name} hinzugefügt`:`${name.length>28?name.substring(0,28)+'…':name} hinzugefügt`);
  pdQty=1; const el=document.getElementById('pdQval');if(el)el.textContent=1;
}
function initSATC(name,price,stock){
  const bar=document.getElementById('satc');
  document.getElementById('satcName').textContent=name;
  document.getElementById('satcPrice').textContent=fmt(price)+' €';
  document.getElementById('satcBtn').textContent=stock>0?'IN DEN WARENKORB':'NICHT VERFÜGBAR';
  document.getElementById('satcBtn').onclick=()=>pdAddCart(name,price,stock);
  if(satcObserver){satcObserver.disconnect();satcObserver=null;}
  bar.classList.remove('vis');bar.setAttribute('aria-hidden','true');
  setTimeout(()=>{
    const t=document.getElementById('pdInfoCol');
    if(!t) return;
    satcObserver=new IntersectionObserver(e=>{
      const vis=!e[0].isIntersecting;
      bar.classList.toggle('vis',vis);
      bar.setAttribute('aria-hidden',vis?'false':'true');
    },{threshold:0,rootMargin:'-60px 0px 0px 0px'});
    satcObserver.observe(t);
  },100);
}
function switchTab(btn,tcId){
  btn.closest('.pd-tab-bar').querySelectorAll('.pd-tab').forEach(t=>t.classList.remove('act'));
  btn.classList.add('act');
  document.querySelectorAll('.pd-tc').forEach(t=>t.classList.remove('on'));
  document.getElementById(tcId).classList.add('on');
}

/* ── REVIEWS ── */
function setRevStar(n){revRating=n;document.querySelectorAll('.rev-star').forEach((s,i)=>{s.style.color=i<n?'#a78bfa':'var(--br)';});}
function submitRev(cat,idx){
  const txt=(document.getElementById('revText').value||'').trim();
  const nm=(document.getElementById('revName').value||'').trim()||'Anonym';
  if(!revRating){showToast('Bitte Sterne vergeben',true);return;}
  if(!txt){showToast('Bitte Text eingeben',true);return;}
  const key=`${cat}-${idx}`;
  if(!productReviews[key]) productReviews[key]=[];
  const now=new Date();
  productReviews[key].unshift({av:nm.charAt(0).toUpperCase(),nm,r:revRating,txt,dt:`${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`});
  LS.set('reviews',productReviews);
  showToast('Bewertung eingereicht – Danke!');
  document.getElementById('revText').value='';
  document.getElementById('revName').value='';
  revRating=0;
  document.querySelectorAll('.rev-star').forEach(s=>s.style.color='var(--br)');
  const defaultRevs=[{av:'M',nm:'Markus H.',dt:'12.04.2025',r:5,txt:'Superschnelle Lieferung, perfekt verpackt!'},{av:'L',nm:'Laura K.',dt:'28.03.2025',r:4,txt:'Tolle Qualität, gerne wieder.'}];
  const revs=(productReviews[key]||[]).concat(defaultRevs);
  const rl=document.getElementById('revList');
  if(rl) rl.innerHTML=revs.map(rv=>`<div class="review"><div class="rev-av">${esc(rv.av)}</div><div><div class="rev-nm">${esc(rv.nm)}</div><div class="rev-dt">${esc(rv.dt)}</div>${stars(rv.r,11)}<div class="rev-txt">${esc(rv.txt)}</div></div></div>`).join('');
}

/* ── WISHLIST ── */
function toggleWLItem(cat,idx,btn,fromDetail){
  const key=`${cat}-${idx}`;
  if(wishlist.has(key)) wishlist.delete(key); else wishlist.add(key);
  LS.set('wl',Array.from(wishlist));
  document.querySelectorAll('[data-wl="'+key+'"]').forEach(b=>{
    const on=wishlist.has(key);
    b.classList.toggle('act',on);
    b.setAttribute('aria-pressed',on);
    b.setAttribute('aria-label',on?'Von Merkliste entfernen':'Auf Merkliste');
    b.querySelector('svg').setAttribute('fill',on?'#f0eaff':'none');
  });
  const pdBtn=document.getElementById('pdWlBtn');
  if(pdBtn&&fromDetail){
    const on=wishlist.has(key);
    pdBtn.className='pd-wl-btn'+(on?' act':'');
    pdBtn.textContent=on?'♥ AUF MERKLISTE':'♡ AUF MERKLISTE';
    pdBtn.setAttribute('aria-pressed',on);
  }
  updateWLBadge();renderWL();
  showToast(wishlist.has(key)?'Zur Merkliste hinzugefügt':'Von Merkliste entfernt');
}
function updateWLBadge(){const b=document.getElementById('wlBdg');b.textContent=wishlist.size;b.classList.toggle('on',wishlist.size>0);}
function renderWL(){
  const el=document.getElementById('wlItems');
  if(!el) return;
  if(!wishlist.size){el.innerHTML='<div class="cart-empty"><div class="cart-empty-ico" aria-hidden="true">♡</div>Noch keine Artikel auf der Merkliste.</div>';return;}
  el.innerHTML=Array.from(wishlist).map(key=>{
    const parts=key.split('-');
    const cat=parts[0],idx=parseInt(parts[1]);
    const p=DATA[cat]&&DATA[cat][idx];
    if(!p) return '';
    const nmAttr=p.n.replace(/"/g,'&quot;');
    return `<div class="wl-item"><div class="wl-item-l"><div class="wl-item-nm">${esc(p.n)}</div><div class="wl-item-pr">${fmt(p.p)} €</div></div><div class="wl-item-r"><button class="wl-atc" type="button" onclick="addCartDirect('${nmAttr}',${p.p});" aria-label="In den Warenkorb">+ KORB</button><button class="wl-rm" type="button" onclick="toggleWLItem('${cat}',${idx},null)" aria-label="Entfernen">×</button></div></div>`;
  }).join('');
}
function toggleWLPanel(){
  const on=document.getElementById('wlPanel').classList.toggle('on');
  document.getElementById('wlBd').classList.toggle('on',on);
  document.getElementById('wlPanel').setAttribute('aria-hidden',on?'false':'true');
  if(on){closeCart();renderWL();}
  document.body.style.overflow=on||document.getElementById('cPanel').classList.contains('on')?'hidden':'';
}

/* ── SHARE ── */
function toggleShareDrop(){
  const d=document.getElementById('shareDrop');
  const open=d.classList.toggle('on');
  document.getElementById('shareBtn').setAttribute('aria-expanded',open);
}
function shareWA(name,price){const txt=encodeURIComponent(`Schau dir ${name} für ${fmt(price)} € bei RoyalCards an! ${location.href}`);window.open(`https://wa.me/?text=${txt}`,'_blank','noopener');document.getElementById('shareDrop').classList.remove('on');}
function shareMail(name,price){location.href=`mailto:?subject=${encodeURIComponent(name+' bei RoyalCards')}&body=${encodeURIComponent('Schau dir das mal an: '+name+' für '+fmt(price)+' €. '+location.href)}`;document.getElementById('shareDrop').classList.remove('on');}
function copyLink(){
  if(navigator.clipboard){navigator.clipboard.writeText(location.href).then(()=>showToast('Link kopiert!')).catch(()=>showToast('Konnte nicht kopieren',true));}
  else{showToast('Link: '+location.href);}
  document.getElementById('shareDrop').classList.remove('on');
}
document.addEventListener('click',e=>{
  if(!e.target.closest('[onclick="toggleShareDrop()"]')&&!e.target.closest('.share-drop')){
    const d=document.getElementById('shareDrop');
    if(d){d.classList.remove('on');const b=document.getElementById('shareBtn');if(b)b.setAttribute('aria-expanded','false');}
  }
});

/* ── STOCK ALERT ── */
let saLastFocus=null;
function openSA(name){
  saLastFocus=document.activeElement;
  document.getElementById('saName').textContent=name;
  const inp=document.getElementById('saEmail');
  inp.value='';inp.classList.remove('err');
  document.getElementById('saBd').classList.add('on');
  setTimeout(()=>inp.focus(),50);
}
function closeSA(){document.getElementById('saBd').classList.remove('on');if(saLastFocus)saLastFocus.focus();}
function submitSA(){
  const inp=document.getElementById('saEmail');
  const v=inp.value.trim();
  if(!isEmail(v)){inp.classList.add('err');showToast('Bitte gültige E-Mail angeben',true);return;}
  closeSA();showToast('Alarm gesetzt! Wir melden uns.');
}

/* ── SEARCH ── */
function nsOpen(){
  const drop=document.getElementById('nsDrop');
  drop.classList.add('on');
  const q=document.getElementById('nsInp').value.trim();
  if(!q) showNsHistory(); else nsSearch(q);
}
function nsClose(){const inp=document.getElementById('nsInp');inp.value='';document.getElementById('nsDrop').classList.remove('on');}
document.addEventListener('click',e=>{if(!e.target.closest('.ns-wrap')){document.getElementById('nsDrop').classList.remove('on');}});
document.addEventListener('keydown',e=>{
  if(e.key==='/'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();document.getElementById('nsInp').focus();}
  if(e.key==='Escape'){
    document.getElementById('nsDrop').classList.remove('on');
    closeSA();closeLg();
    if(document.getElementById('cPanel').classList.contains('on')) toggleCart();
    if(document.getElementById('wlPanel').classList.contains('on')) toggleWLPanel();
    if(document.getElementById('coBd').classList.contains('on')) closeCo();
  }
});
function showNsHistory(){
  const drop=document.getElementById('nsDrop');
  if(!srchHistory.length){drop.innerHTML='<div class="ns-empty">Wonach suchst du?<br><span style="font-size:9px;opacity:.7;letter-spacing:2px">Tipp: Drücke "/" zum Schnellsuchen</span></div>';return;}
  drop.innerHTML=`<div class="ns-hist"><span>ZULETZT GESUCHT</span><button class="ns-hist-clr" type="button" onclick="clearHist()">leeren</button></div>${srchHistory.map(h=>`<div class="ns-hist-item" onclick="document.getElementById('nsInp').value='${esc(h)}';nsSearch('${esc(h)}')" role="option">🕐 ${esc(h)}</div>`).join('')}`;
}
function clearHist(){srchHistory=[];LS.set('srch',[]);showNsHistory();}
function fuzzyScore(str,q){
  const s=String(str).toLowerCase(),g=String(q).toLowerCase();
  if(s.indexOf(g)!==-1) return 100;
  let sc=0,qi=0;
  for(let i=0;i<s.length&&qi<g.length;i++){if(s[i]===g[qi]){sc++;qi++;}}
  return qi===g.length?(sc/s.length)*70:0;
}
function nsSearch(q){
  const drop=document.getElementById('nsDrop');
  if(!q.trim()){showNsHistory();return;}
  const minP=parseFloat(srchMinP)||0, maxP=parseFloat(srchMaxP)||Infinity;
  const cats=['booster','single','set','zubehoer'];
  const cNames={booster:'BOOSTER',single:'SINGLES',set:'DISPLAYS',zubehoer:'ZUBEHÖR'};
  let html=`<div class="ns-pf"><span class="ns-pf-lbl">PREIS</span><input class="ns-pf-inp" type="number" placeholder="Min" value="${esc(srchMinP)}" oninput="srchMinP=this.value;nsSearch(document.getElementById('nsInp').value)" aria-label="Min-Preis"><span style="font-size:11px;color:var(--t4)">–</span><input class="ns-pf-inp" type="number" placeholder="Max" value="${esc(srchMaxP)}" oninput="srchMaxP=this.value;nsSearch(document.getElementById('nsInp').value)" aria-label="Max-Preis"></div>`;
  let total=0;
  cats.forEach(cat=>{
    const hits=DATA[cat].map((p,oi)=>({p,oi,sc:Math.max(fuzzyScore(p.n,q),fuzzyScore(p.s,q))})).filter(o=>o.sc>30&&o.p.p>=minP&&o.p.p<=maxP).sort((a,b)=>b.sc-a.sc).slice(0,3);
    if(!hits.length) return;
    html+=`<div class="ns-cat-lbl">${cNames[cat]}</div>`;
    hits.forEach(o=>{
      const escQ=q.replace(/'/g,'').replace(/"/g,'');
      html+=`<div class="ns-item" role="option" tabindex="0" onclick="addToHist('${esc(escQ)}');nsClose();openDetail(null,'${cat}',${o.oi})" onkeydown="if(event.key==='Enter'){addToHist('${esc(escQ)}');nsClose();openDetail(null,'${cat}',${o.oi})}"><div><div class="ns-item-nm">${esc(o.p.n)}</div><div class="ns-item-sub">${esc(o.p.s)}</div></div><div class="ns-item-pr">${fmt(o.p.p)} €</div></div>`;
      total++;
    });
  });
  drop.innerHTML=total?html:html+`<div class="ns-empty">Keine Ergebnisse für „${esc(q)}".<br><span style="font-size:9px;opacity:.7">Probiere einen anderen Suchbegriff.</span></div>`;
}
function addToHist(q){if(!q.trim()) return;srchHistory=[q].concat(srchHistory.filter(h=>h!==q)).slice(0,5);LS.set('srch',srchHistory);}

/* ── NAV ── */
function navPage(page){document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));const el=document.getElementById('page-'+page);if(el)el.classList.add('on');window.scrollTo(0,0);}
function nav(page,push){
  if(push===undefined) push=true;
  navPage(page);
  if(page!=='detail'){
    const pg=document.getElementById('page-'+page);
    if(pg) pg.querySelectorAll('.sh-art,.sh-eye,.sh-ttl,.sh-tag,.sh-ln').forEach(el=>{el.style.animation='none';void el.offsetHeight;el.style.animation='';});
  }
  const catPages=['booster','single','set','zubehoer'];
  const cqb=document.getElementById('catqbar');
  cqb.classList.toggle('on',catPages.indexOf(page)!==-1);
  document.querySelectorAll('.cqb-item').forEach(el=>el.classList.toggle('act',el.dataset.page===page));
  document.querySelectorAll('#navDrop a[data-page]').forEach(a=>a.classList.toggle('act',a.dataset.page===page));
  document.getElementById('satc').classList.remove('vis');
  document.getElementById('satc').setAttribute('aria-hidden','true');
  if(satcObserver){satcObserver.disconnect();satcObserver=null;}
  if(push) history.pushState({page},'','#'+page);
  document.title=page==='main'?'RoyalCards · Pokémon-Karten Shop':`${page.charAt(0).toUpperCase()+page.slice(1)} · RoyalCards`;
}
window.addEventListener('popstate',e=>{
  const st=e.state||{page:'main'};
  if(st.page==='detail'&&st.cat!=null) populateDetail(st.cat,st.idx);
  navPage(st.page||'main');
  const catPages=['booster','single','set','zubehoer'];
  const cqb=document.getElementById('catqbar');
  cqb.classList.toggle('on',catPages.indexOf(st.page)!==-1);
  document.querySelectorAll('.cqb-item').forEach(el=>el.classList.toggle('act',el.dataset.page===st.page));
});
(function(){
  const h=location.hash.replace('#','');
  const v=['main','booster','single','set','zubehoer'];
  if(h&&v.indexOf(h)!==-1){nav(h,false);}
  else{history.replaceState({page:'main'},'','#main');}
})();

/* ── QTY ── */
function chQty(btn,d){const c=btn.closest('.prod');let q=parseInt(c.dataset.qty||1)+d;q=Math.max(1,Math.min(99,q));c.dataset.qty=q;c.querySelector('.qty-val').textContent=q;}

/* ── CART ── */
let cart=LS.get('cart',[]);
function saveCart(){LS.set('cart',cart);}
function flashCart(){const b=document.getElementById('cartBtn');b.classList.remove('flash');void b.offsetHeight;b.classList.add('flash');setTimeout(()=>b.classList.remove('flash'),400);}
function closeCart(){const p=document.getElementById('cPanel');if(p.classList.contains('on')){p.classList.remove('on');document.getElementById('cBd').classList.remove('on');p.setAttribute('aria-hidden','true');document.body.style.overflow='';}}
function toggleCart(){
  const on=document.getElementById('cPanel').classList.toggle('on');
  document.getElementById('cBd').classList.toggle('on',on);
  document.getElementById('cPanel').setAttribute('aria-hidden',on?'false':'true');
  if(on){
    const wlP=document.getElementById('wlPanel');
    if(wlP.classList.contains('on')){wlP.classList.remove('on');document.getElementById('wlBd').classList.remove('on');wlP.setAttribute('aria-hidden','true');}
  }
  document.body.style.overflow=on||document.getElementById('wlPanel').classList.contains('on')?'hidden':'';
}
function addCart(btn){
  const card=btn.closest('.prod');
  const name=card.dataset.name;
  const price=parseFloat(card.dataset.price);
  const qty=parseInt(card.dataset.qty||1);
  addCartDirect(name,price,qty);
  card.dataset.qty=1;card.querySelector('.qty-val').textContent=1;
  card.classList.remove('added');void card.offsetHeight;card.classList.add('added');
}
function addCartDirect(name,price,qty){
  qty=qty||1;
  const ex=cart.find(i=>i.name===name);
  if(ex)ex.qty=Math.min(99,ex.qty+qty); else cart.push({name,price,qty});
  saveCart();renderCart();flashCart();
  showToast(`${name.length>22?name.substring(0,22)+'…':name} hinzugefügt`);
}
function adjustCart(i,d){cart[i].qty=Math.max(1,Math.min(99,cart[i].qty+d));saveCart();renderCart();}
function rmCart(i){cart.splice(i,1);saveCart();renderCart();}
function renderCart(){
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const ship=subtotal>=SHIP_FREE||subtotal===0?0:SHIP_COST;
  const tot=subtotal+ship;
  document.getElementById('cCnt').textContent=cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById('cTot').textContent=fmt(tot)+' €';
  const shipEl=document.getElementById('cShip');
  if(shipEl) shipEl.textContent=ship===0?(subtotal>=SHIP_FREE?'Kostenlos':'—'):fmt(ship)+' €';
  const coBtn=document.getElementById('cCoBtn');
  if(coBtn) coBtn.disabled=cart.length===0;
  document.getElementById('cItems').innerHTML=cart.length
    ?cart.map((it,i)=>`<div class="ci"><div class="ci-l"><div class="ci-nm">${esc(it.name)}</div><div class="ci-qrow"><button class="ci-qbtn" type="button" onclick="adjustCart(${i},-1)" aria-label="Weniger">−</button><div class="ci-qval">${it.qty}</div><button class="ci-qbtn" type="button" onclick="adjustCart(${i},1)" aria-label="Mehr">+</button></div><div class="ci-meta">${fmt(it.price)} € / Stk.</div></div><div class="ci-r"><div class="ci-pr">${fmt(it.price*it.qty)} €</div><button class="ci-rm" type="button" onclick="rmCart(${i})" aria-label="Entfernen">×</button></div></div>`).join('')+
      (subtotal<SHIP_FREE?`<div style="padding:10px 0;font-size:10px;color:var(--t4);text-align:center;letter-spacing:1px">Noch <strong style="color:var(--t3)">${fmt(SHIP_FREE-subtotal)} €</strong> bis zum kostenlosen Versand</div>`:'')
    :`<div class="cart-empty"><div class="cart-empty-ico" aria-hidden="true">🛒</div>Noch keine Artikel im Warenkorb.</div><button type="button" class="cart-cont" onclick="toggleCart()">← WEITER SHOPPEN</button>`;
}
renderCart();updateWLBadge();

/* ── CHECKOUT ── */
const DISC={'ROYALCARDS10':{pct:10,lbl:'-10% Rabatt'},'WELCOME5':{pct:5,lbl:'-5% Rabatt'},'POKEMON15':{pct:15,lbl:'-15% Rabatt'}};
let coStep=1,coPay=null;
function openCo(){
  if(!cart.length){showToast('Warenkorb ist leer',true);return;}
  toggleCart();
  document.getElementById('coBd').classList.add('on');
  document.body.style.overflow='hidden';
  activeDiscount=null;coPay=null;
  document.getElementById('discMsg').innerHTML='';
  document.getElementById('discCode').value='';
  document.getElementById('coPayNext').disabled=true;
  document.getElementById('coPayInfo').textContent='Wähle eine Zahlungsmethode.';
  document.querySelectorAll('.co-pay').forEach(p=>{p.classList.remove('sel');p.setAttribute('aria-checked','false');});
  document.querySelectorAll('.co-inp').forEach(i=>i.classList.remove('err'));
  document.querySelectorAll('.co-err').forEach(e=>e.classList.remove('on'));
  coGo(1);
}
function closeCo(){
  document.getElementById('coBd').classList.remove('on');
  document.getElementById('coSucc').classList.remove('on');
  document.body.style.overflow='';
  document.querySelectorAll('.co-step').forEach(s=>s.classList.remove('on'));
  document.getElementById('coProg').style.display='';
}
function validateAddr(){
  const fields=[['coFn','errFn',v=>v.length>0],['coLn','errLn',v=>v.length>0],['coEm','errEm',isEmail],['coSt','errSt',v=>v.length>2],['coZip','errZip',v=>/^\d{4,5}$/.test(v)],['coCt','errCt',v=>v.length>0]];
  let ok=true,firstErr=null;
  fields.forEach(f=>{
    const inp=document.getElementById(f[0]);
    const err=document.getElementById(f[1]);
    const valid=f[2]((inp.value||'').trim());
    inp.classList.toggle('err',!valid);
    err.classList.toggle('on',!valid);
    if(!valid){ok=false;if(!firstErr)firstErr=inp;}
  });
  if(!ok&&firstErr) firstErr.focus();
  return ok;
}
function coGo(n){
  if(n===2&&coStep===1&&!validateAddr()){showToast('Bitte alle Felder korrekt ausfüllen',true);return;}
  if(n===3&&!coPay){showToast('Bitte Zahlungsmethode wählen',true);return;}
  coStep=n;
  document.querySelectorAll('.co-step').forEach(s=>s.classList.remove('on'));
  document.getElementById('cos'+n).classList.add('on');
  ['cps1','cps2','cps3'].forEach((id,i)=>{document.getElementById(id).className='co-ps'+(i+1===n?' act':i+1<n?' done':'');});
  if(n===3){
    const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
    const ship=subtotal>=SHIP_FREE?0:SHIP_COST;
    const disc=activeDiscount?subtotal*(activeDiscount.pct/100):0;
    const total=subtotal-disc+ship;
    document.getElementById('coRevItems').innerHTML=cart.map(it=>`<div class="co-ri"><span>${esc(it.name)} ×${it.qty}</span><span>${fmt(it.price*it.qty)} €</span></div>`).join('')+
      `<div class="co-ri"><span>Versand</span><span>${ship===0?'Kostenlos':fmt(ship)+' €'}</span></div>`;
    document.getElementById('coDiscRow').innerHTML=activeDiscount?`<div class="co-disc-row2"><span>${activeDiscount.lbl}</span><span>−${fmt(disc)} €</span></div>`:'';
    document.getElementById('coTot').textContent=fmt(total)+' €';
  }
}
function selPay(el,method,info){
  document.querySelectorAll('.co-pay').forEach(p=>{p.classList.remove('sel');p.setAttribute('aria-checked','false');});
  el.classList.add('sel');el.setAttribute('aria-checked','true');
  document.getElementById('coPayInfo').textContent=info;
  coPay=method;
  document.getElementById('coPayNext').disabled=false;
}
function applyDisc(){
  const code=(document.getElementById('discCode').value||'').trim().toUpperCase();
  const d=DISC[code];
  const msg=document.getElementById('discMsg');
  if(!code){msg.innerHTML='';activeDiscount=null;coGo(3);return;}
  if(d){activeDiscount=d;msg.innerHTML=`<span style="color:var(--ok)">✓ ${d.lbl} wird angewendet</span>`;}
  else{activeDiscount=null;msg.innerHTML=`<span style="color:var(--err)">✗ Ungültiger Code</span>`;}
  coGo(3);
}
function placeOrder(){
  const btn=document.getElementById('coPlace');
  btn.disabled=true;btn.textContent='WIRD VERARBEITET…';
  setTimeout(()=>{
    const items=cart.slice();
    cart=[];saveCart();renderCart();
    document.querySelectorAll('.co-step').forEach(s=>s.classList.remove('on'));
    document.getElementById('coProg').style.display='none';
    document.getElementById('coSuccItems').innerHTML=items.map(it=>`<div class="co-succ-item"><span>${esc(it.name)} ×${it.qty}</span><span>${fmt(it.price*it.qty)} €</span></div>`).join('');
    document.getElementById('coSucc').classList.add('on');
    activeDiscount=null;
    btn.disabled=false;btn.textContent='🔒 JETZT BESTELLEN';
  },700);
}

/* ── LEGAL ── */
let lgLastFocus=null;
function openLg(key){
  const titles={impressum:'IMPRESSUM',datenschutz:'DATENSCHUTZ',agb:'AGB',versand:'VERSAND & RÜCKGABE',faq:'FAQ',kontakt:'KONTAKT',widerruf:'WIDERRUF',ueber:'ÜBER UNS'};
  lgLastFocus=document.activeElement;
  document.getElementById('lgTtl').textContent=titles[key]||key.toUpperCase();
  document.getElementById('lgBody').innerHTML=LEGAL[key]||'';
  document.getElementById('lgBd').classList.add('on');
  document.body.style.overflow='hidden';
}
function closeLg(){document.getElementById('lgBd').classList.remove('on');document.body.style.overflow='';if(lgLastFocus)lgLastFocus.focus();}

/* ── TOAST ── */
let tT;
function showToast(msg,err){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.toggle('err',!!err);
  t.classList.add('show');
  clearTimeout(tT);
  tT=setTimeout(()=>t.classList.remove('show'),2600);
}

/* ── THEME ── */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);
  const icon=document.getElementById('themeIcon');
  const btn=document.getElementById('themeBtn');
  if(theme==='light'){
    icon.innerHTML=`<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" stroke="var(--t2)" stroke-width="1.5" fill="none"/>`;
    btn.setAttribute('aria-label','Zu dunklem Design wechseln');
  } else {
    icon.innerHTML=`<circle cx="12" cy="12" r="5" stroke="var(--t2)" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="4" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="20" x2="12" y2="22" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/><line x1="2" y1="12" x2="4" y2="12" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/><line x1="20" y1="12" x2="22" y2="12" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93" stroke="var(--t2)" stroke-width="1.5" stroke-linecap="round"/>`;
    btn.setAttribute('aria-label','Zu hellem Design wechseln');
  }
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='dark'?'light':'dark';
  applyTheme(next);
  LS.set('theme',next);
}
(function(){
  const saved=LS.get('theme',null);
  if(saved) applyTheme(saved);
  else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches) applyTheme('light');
})();

/* ── MAIN FILTER ── */
function fAll(btn){document.querySelectorAll('.frow .fbtn').forEach(b=>b.classList.remove('act'));btn.classList.add('act');document.querySelectorAll('#mainGrid .prod').forEach(p=>p.style.display='');}
function fTag(cat,btn){document.querySelectorAll('.frow .fbtn').forEach(b=>b.classList.remove('act'));btn.classList.add('act');document.querySelectorAll('#mainGrid .prod').forEach(p=>p.style.display=p.dataset.cat===cat?'':'none');}

/* ── NEWSLETTER ── */
function subNL(){const e=document.getElementById('nlEmail');const v=(e.value||'').trim();if(!isEmail(v)){showToast('Bitte gültige E-Mail eingeben',true);e.focus();return;}showToast('Erfolgreich angemeldet!');e.value='';}
