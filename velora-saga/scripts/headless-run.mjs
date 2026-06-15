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
  console.log(`✓ booted (${frames} title frames) + drove ${fx} battle-animation frames without runtime error`);
  process.exit(0);
} catch (e) {
  console.log(`✗ runtime error after ${frames} frames: ${e && e.stack || e}`);
  process.exit(1);
}
