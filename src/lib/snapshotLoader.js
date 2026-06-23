// Off-main-thread snapshot loading with a safe fallback.
//
// loadSnapshotData() fetches, parses and rehydrates a game's catalogue in a Web
// Worker (see snapshot.worker.js) so the 8–9 MB JSON no longer blocks the UI on
// first load. If Workers are unavailable (old browser) or the worker errors, it
// transparently falls back to the exact same work on the main thread, so the
// result is identical and loading never breaks.
import { rehydrateCards } from './cardCodec.js';

let worker = null;
let workerDisabled = false;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (workerDisabled || typeof Worker === 'undefined') return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./snapshot.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, ok, cards, meta, error } = e.data || {};
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (ok) p.resolve({ cards, meta });
      else p.reject(new Error(error || 'worker error'));
    };
    worker.onerror = () => {
      // Worker-level crash: fail anything in flight and disable the worker so all
      // later loads use the main-thread fallback.
      for (const p of pending.values()) p.reject(new Error('worker crashed'));
      pending.clear();
      try { worker.terminate(); } catch { /* ignore */ }
      worker = null;
      workerDisabled = true;
    };
  } catch {
    worker = null;
    workerDisabled = true;
  }
  return worker;
}

const metaOf = (data, count) => ({
  generatedAt: data.generatedAt || null,
  pricesEstimated: !!data.pricesEstimated,
  cmEnriched: data.cmEnriched || 0,
  count,
});

// Main-thread fallback: identical fetch + parse + rehydrate, inline.
async function loadOnMain({ url, game }) {
  const res = await fetch(url, { cache: 'default' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data?.cards) ? data.cards : [];
  rehydrateCards(list, game, data.pricesUpdatedAt);
  return { cards: list, meta: metaOf(data, list.length) };
}

export function loadSnapshotData({ url, game }) {
  const w = getWorker();
  if (!w) return loadOnMain({ url, game });
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, url, game });
  }).catch(() => loadOnMain({ url, game })); // any worker hiccup → main-thread retry
}
