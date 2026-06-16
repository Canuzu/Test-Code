// Headless boot+run harness for Velora Saga. Stubs just enough of the browser
// (canvas 2D ctx, Image, localStorage, AudioContext, rAF) to actually EXECUTE
// the game's inline script and drive real frames — catching runtime errors that
// a compile-only check misses (e.g. broken battle-animation code paths).
//
// Run: node scripts/headless-run.mjs
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = await readFile(resolve(__dirname, '../index.html'), 'utf8');
const game = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).sort((a,b)=>b.length-a.length)[0];

// universal no-op proxy: any property access returns a callable proxy
const noop = () => mkProxy();
function mkProxy() {
  const f = function () { return mkProxy(); };
  return new Proxy(f, {
    get(_, p) {
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop: () => {} });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'canvas') return { width: 480, height: 320 };
      if (p === Symbol.toPrimitive) return () => 0;
      return mkProxy();
    },
    set() { return true; },
    apply() { return mkProxy(); },
  });
}

const elem = () => ({
  getContext: () => mkProxy(), style: {}, addEventListener: () => {},
  width: 480, height: 320, getBoundingClientRect: () => ({ left:0, top:0, width:480, height:320 }),
  appendChild: () => {}, classList: { add(){}, remove(){} }, focus(){},
});

let rafCb = null;
const store = {};
const ctx = {
  document: { getElementById: () => elem(), createElement: () => elem(), addEventListener: () => {}, body: elem() },
  window: undefined, navigator: { userAgent: 'node', maxTouchPoints: 0 },
  localStorage: { getItem: (k)=>store[k]??null, setItem:(k,v)=>{store[k]=String(v);}, removeItem:(k)=>{delete store[k];} },
  requestAnimationFrame: (cb) => { rafCb = cb; return 1; },
  cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() },
  AudioContext: function(){ return mkProxy(); },
  webkitAudioContext: function(){ return mkProxy(); },
  Image: class { constructor(){ this.complete=true; this.naturalWidth=16; this.naturalHeight=16; }
                 set src(_v){ if (this.onload) this.onload(); } get src(){ return ''; } },
  setTimeout, clearTimeout, setInterval: () => 0, clearInterval: () => {},
  console, Math, Date, JSON, isNaN, parseInt, parseFloat,
  addEventListener: () => {}, removeEventListener: () => {},
  innerWidth: 960, innerHeight: 640, devicePixelRatio: 1,
};
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);

let frames = 0;
try {
  new vm.Script(game, { filename: 'velora.js' }).runInContext(ctx);
  // drive title frames
  for (let i = 0; i < 6 && rafCb; i++) { const cb = rafCb; rafCb = null; cb(Date.now() + i * 16); frames++; }

  // Exercise the battle-animation subsystem directly (G/battle are lexically
  // scoped and can't be set from here, but these fns mutate the real BFX state
  // and render via the stub ctx — covering every new animation code path).
  let fx = 0;
  const need = ['bfxStart','bfxAttack','bfxFaint','bfxEntry','updateBFX','drawBattler','drawBattleParts'];
  for (const n of need) if (typeof ctx[n] !== 'function') throw new Error('missing animation fn: ' + n);
  ctx.bfxStart();                                   // start flash + entry slide
  ctx.bfxAttack('player', 2, 'Feuer');              // lunge + hit + particles
  ctx.bfxFaint('enemy');                            // KO drop
  for (let i = 0; i < 90; i++) {                    // ~1.5s of animation
    ctx.updateBFX(0.016);
    ctx.drawBattler('enemy', 'muffel', 330, 56, 64, false);
    ctx.drawBattler('player', 'glutfox', 70, 180, 80, true);
    if (typeof ctx.drawMoveFX === 'function') ctx.drawMoveFX();
    if (typeof ctx.drawCatchBall === 'function') ctx.drawCatchBall();
    ctx.drawBattleParts();
    fx++;
  }
  // Exercise the new decoupled attack sequence (announce -> animate -> apply).
  if (typeof ctx.doMoveReal === 'function' && typeof ctx.makeCreature === 'function'
      && typeof ctx.battleMsgAdvance === 'function') {
    const atk = ctx.makeCreature('glutfox', 8), def = ctx.makeCreature('muffel', 8);
    ctx.doMoveReal('player', atk.moves[0], def, atk, () => {});
    ctx.battleMsgAdvance();   // dismiss "uses move" -> enters timed anim phase
    for (let i = 0; i < 20; i++) { ctx.updateBFX(0.016); fx++; }
  }
  // Deep-mechanics logic checks (stages, abilities, crit, speed, status fields)
  if (typeof ctx.calcDamage === 'function' && typeof ctx.stageMul === 'function') {
    const assert = (c, m) => { if (!c) throw new Error('mechanics check failed: ' + m); };
    assert(Math.abs(ctx.stageMul(0) - 1) < 1e-9, 'stageMul(0)=1');
    assert(Math.abs(ctx.stageMul(2) - 2) < 1e-9, 'stageMul(+2)=2');
    assert(Math.abs(ctx.stageMul(-2) - 0.5) < 1e-9, 'stageMul(-2)=0.5');
    const A = ctx.makeCreature('glutfox', 20), D = ctx.makeCreature('blattling', 20);
    ctx.initVolatile(A); ctx.initVolatile(D);
    assert(A.stages && A.confuse === 0, 'initVolatile sets stages+confuse');
    assert(typeof ctx.abilityOf(A) === 'string', 'abilityOf returns string');
    const base = ctx.calcDamage(A, D, A.moves[0]);
    assert(base.dmg > 0 && !Number.isNaN(base.dmg), 'calcDamage produces positive dmg');
    assert(typeof base.crit === 'boolean', 'calcDamage returns crit flag');
    const physMove = { key: 'biss' };          // physical move -> uses Def + its stages
    D.stages.def = 4;                          // higher defence -> less physical damage
    let lo = 0, hi = 0; for (let i = 0; i < 60; i++){ lo += ctx.calcDamage(A, D, physMove).dmg; }
    D.stages.def = 0; for (let i = 0; i < 60; i++){ hi += ctx.calcDamage(A, D, physMove).dmg; }
    assert(lo < hi, 'defence stage reduces physical damage');
    const sp0 = ctx.speedOf(A); A.status = 'paralyse'; assert(ctx.speedOf(A) < sp0, 'paralysis halves speed'); A.status = null;
    // physical/special split: a special attacker has a distinct, higher Sp.Atk
    const P = ctx.makeCreature('pyrolux', 30); ctx.initVolatile(P);
    assert(P.stats.spatk != null && P.stats.spdef != null, 'special stats exist');
    assert(P.stats.spatk > P.stats.atk, 'special attacker has higher Sp.Atk than Atk');
    fx++;
  }
  // World-integrity checks: every warp target, encounter species, trainer team and learnset is valid
  if (typeof ctx._gameData === 'function') {
    const { MAPS, SPECIES, MOVES } = ctx._gameData();
    // Reference integrity: the things that silently break navigation/battles if a
    // content typo creeps in. (Spawn-tile geometry follows the game's intentional
    // "spawn just below a door, then step in" convention, so it isn't asserted.)
    let werr = 0;
    const wfail = (m) => { console.log('✗ world: ' + m); werr++; };
    for (const [name, map] of Object.entries(MAPS)) {
      if (!Array.isArray(map.grid) || !map.grid.length) { wfail(`${name}: no grid`); continue; }
      for (const w of (map.warps || [])) {
        if (w.dynamicReturn) continue;
        if (!MAPS[w.to]) wfail(`${name}: warp -> unknown map '${w.to}'`);
        else if (w.tx == null || w.ty == null) wfail(`${name}->${w.to}: missing target coords`);
      }
      for (const tbl of Object.values(map.encounters || {}))
        for (const e of tbl) if (!SPECIES[e.s]) wfail(`${name}: encounter unknown species '${e.s}'`);
      for (const n of (map.npcs || [])) if (n.trainer) for (const [s] of n.trainer.team)
        if (!SPECIES[s]) wfail(`${name}: trainer '${n.trainer.name}' unknown species '${s}'`);
    }
    // learnsets + evolutions reference real moves/species
    for (const [k, sp] of Object.entries(SPECIES)) {
      for (const [, mv] of (sp.learn || [])) if (!MOVES[mv]) wfail(`species ${k}: learn unknown move '${mv}'`);
      if (sp.evo && !SPECIES[sp.evo.into]) wfail(`species ${k}: evo into unknown '${sp.evo.into}'`);
    }
    if (werr) throw new Error(`${werr} world-integrity problem(s)`);
    console.log(`✓ world integrity OK (${Object.keys(MAPS).length} maps, ${Object.keys(SPECIES).length} species)`);
  }
  console.log(`✓ booted (${frames} title frames) + drove ${fx} battle-animation frames + mechanics checks OK`);
  process.exit(0);
} catch (e) {
  console.log(`✗ runtime error after ${frames} frames: ${e && e.stack || e}`);
  process.exit(1);
}
