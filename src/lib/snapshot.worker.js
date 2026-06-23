// Web Worker: fetch + JSON-parse + rehydrate a game's catalogue snapshot off the
// main thread. The snapshot is 8–9 MB, so doing this on the UI thread froze the
// page on a game's first load; here the heavy JSON.parse and rehydrate run in
// the worker and only the finished card array is posted back.
//
// cardCodec is pure (no DOM/window deps), so it imports cleanly in a module
// worker. Driven by src/lib/snapshotLoader.js.
import { rehydrateCards } from './cardCodec.js';

self.onmessage = async (e) => {
  const { id, url, game } = e.data || {};
  try {
    // 'default' lets the HTTP cache + service worker serve the snapshot instantly
    // (stale-while-revalidate), same as the previous main-thread fetch.
    const res = await fetch(url, { cache: 'default' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data?.cards) ? data.cards : [];
    rehydrateCards(list, game, data.pricesUpdatedAt);
    self.postMessage({
      id,
      ok: true,
      cards: list,
      meta: {
        generatedAt: data.generatedAt || null,
        pricesEstimated: !!data.pricesEstimated,
        cmEnriched: data.cmEnriched || 0,
        count: list.length,
      },
    });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
