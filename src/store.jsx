import { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { store, KEYS } from './lib/storage.js';
import { enrich } from './lib/metrics.js';
import { applyTheme } from './lib/theme.js';
import { getGame } from './data/providers/index.js';
import { SAMPLE_CARDS } from './data/sampleCards.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const DEFAULT_SETTINGS = { game: 'pokemon', apiKey: '', platform: 'cardmarket', includeShipping: true, theme: 'dark', fxEurUsd: 1.08, pro: false, buyRules: null };

// Static daily snapshot produced by scripts/fetch-prices.mjs at deploy time.
// Same-origin, so no browser CORS limits (unlike calling the API directly).
const SNAPSHOT_URL = `${import.meta.env.BASE_URL}data/cards.json`;

export function StoreProvider({ children }) {
  const [rawCards, setRawCards] = useState([]);
  const [source, setSource] = useState(null); // 'live' | 'sample' | 'cache'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [sold, setSold] = useState([]);
  const [notes, setNotes] = useState({});
  const [tags, setTags] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [compareList, setCompareList] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Theme: apply synchronously during render so children read the right palette,
  // and reflect it on <html data-theme> for the CSS-variable based styles.
  const theme = settings.theme === 'light' ? 'light' : 'dark';
  applyTheme(theme);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  // ---- load persisted state once, then auto-refresh if stale ------------
  useEffect(() => {
    const wl = store.get(KEYS.watchlist);
    const pf = store.get(KEYS.portfolio);
    const sl = store.get(KEYS.sold);
    const nt = store.get(KEYS.notes);
    const tg = store.get(KEYS.tags);
    const ph = store.get(KEYS.priceHistory);
    const st = store.get(KEYS.settings);
    const cache = store.get(KEYS.cards);
    if (Array.isArray(wl)) setWatchlist(wl);
    if (Array.isArray(pf)) setPortfolio(pf);
    if (Array.isArray(sl)) setSold(sl);
    if (nt && typeof nt === 'object') setNotes(nt);
    if (tg && typeof tg === 'object') setTags(tg);
    if (ph && typeof ph === 'object') setPriceHistory(ph);
    const s = st && typeof st === 'object' ? { ...DEFAULT_SETTINGS, ...st } : DEFAULT_SETTINGS;
    if (st && typeof st === 'object') setSettings(s);

    if (cache && Array.isArray(cache.cards) && cache.cards.length) {
      setRawCards(cache.cards);
      setSource('cache');
      if (cache.ts) setLastUpdated(new Date(cache.ts));
    } else {
      setRawCards(SAMPLE_CARDS);
      setSource('sample');
    }

    // Always pull the freshly-deployed snapshot (same-origin JSON, no CORS).
    // Silent: on failure (offline / opened from file://) we keep the cached
    // or sample data shown above.
    loadSnapshot({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persistence ------------------------------------------------------
  useEffect(() => { store.set(KEYS.watchlist, watchlist); }, [watchlist]);
  useEffect(() => { store.set(KEYS.portfolio, portfolio); }, [portfolio]);
  useEffect(() => { store.set(KEYS.sold, sold); }, [sold]);
  useEffect(() => { store.set(KEYS.notes, notes); }, [notes]);
  useEffect(() => { store.set(KEYS.tags, tags); }, [tags]);
  useEffect(() => { store.set(KEYS.priceHistory, priceHistory); }, [priceHistory]);
  useEffect(() => { store.set(KEYS.settings, settings); }, [settings]);

  // ---- derived ----------------------------------------------------------
  const cards = useMemo(() => rawCards.map(enrich), [rawCards]);
  const cardById = useMemo(() => {
    const m = new Map();
    rawCards.forEach((c) => m.set(c.id, c));
    return m;
  }, [rawCards]);

  // ---- toast ------------------------------------------------------------
  const showToast = useCallback((msg) => {
    setToast({ msg, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ---- price-history accumulation --------------------------------------
  // Appends one observation per card per snapshot date, so the price chart
  // gains genuine measured points over time (bounded per card). The modelled
  // curve in lib/priceHistory.js fills in everything before these points.
  const accumulateHistory = useCallback((list, ts) => {
    const day = new Date(ts).toISOString().slice(0, 10);
    setPriceHistory((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const c of list) {
        const price = c?.prices?.trend ?? c?.prices?.market ?? c?.prices?.avg7;
        if (price == null) continue;
        const arr = next[c.id] || [];
        if (arr.length && arr[arr.length - 1].d === day) continue; // already today
        next[c.id] = [...arr, { d: day, p: Math.round(price * 100) / 100 }].slice(-160);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, []);

  const getPriceHistory = useCallback((cardId) => priceHistory[cardId] || [], [priceHistory]);

  // ---- data fetching ----------------------------------------------------
  // Loads the static daily snapshot baked into the site at deploy time.
  // `silent` = background load on mount (no error banner; keep current data).
  const loadSnapshot = useCallback(async ({ silent = false } = {}) => {
    setLoading(true);
    if (!silent) setError(null);
    try {
      const res = await fetch(SNAPSHOT_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.cards) ? data.cards : [];
      if (list.length === 0) throw new Error('Snapshot leer');
      const ts = data.generatedAt ? new Date(data.generatedAt).getTime() : Date.now();
      setRawCards(list);
      setSource('snapshot');
      setLastUpdated(new Date(ts));
      store.set(KEYS.cards, { cards: list, ts });
      accumulateHistory(list, ts);
      if (!silent) showToast(`✓ Aktuelle Marktdaten geladen · ${list.length} Karten`);
      return true;
    } catch (e) {
      if (!silent) setError(`Aktuelle Daten konnten nicht geladen werden (${e.message}). Es werden gespeicherte bzw. Beispieldaten gezeigt.`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast, accumulateHistory]);

  const loadSample = useCallback(() => {
    setRawCards(SAMPLE_CARDS);
    setSource('sample');
    setError(null);
    showToast('🃏 Beispieldaten geladen');
  }, [showToast]);

  const fetchCards = useCallback(() => loadSnapshot({ silent: false }), [loadSnapshot]);

  // ---- collection actions ----------------------------------------------
  const inWatchlist = useCallback((id) => watchlist.some((c) => c.id === id), [watchlist]);
  const inPortfolio = useCallback((id) => portfolio.some((c) => c.cardId === id), [portfolio]);
  const inCompare = useCallback((id) => compareList.some((c) => c.id === id), [compareList]);

  const toggleWatchlist = useCallback((card) => {
    setWatchlist((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      if (exists) { showToast('Aus Watchlist entfernt'); return prev.filter((c) => c.id !== card.id); }
      showToast('⭐ Zur Watchlist hinzugefügt');
      return [...prev, { ...card, addedAt: Date.now(), addedPrice: card.prices?.market ?? null }];
    });
  }, [showToast]);

  const addToPortfolio = useCallback((card, opts = {}) => {
    const { price, quantity = 1, condition = 'NM', location = '' } = typeof opts === 'object' ? opts : { price: opts };
    const entry = {
      id: `${card.id}-${Date.now()}`,
      cardId: card.id,
      card,
      actualBuyPrice: Number(price) || card.prices?.low || card.prices?.market || 0,
      quantity: Math.max(1, Number(quantity) || 1),
      condition: condition || 'NM',
      location: (location || '').trim(),
      purchaseDate: Date.now(),
    };
    setPortfolio((prev) => [...prev, entry]);
    showToast('📦 Zur Sammlung hinzugefügt');
  }, [showToast]);

  // Inline-edit an inventory position (quantity, unit cost, condition, location).
  const updatePortfolioEntry = useCallback((entryId, patch) => {
    setPortfolio((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      const next = { ...e, ...patch };
      if (patch.quantity != null) next.quantity = Math.max(1, Number(patch.quantity) || 1);
      if (patch.actualBuyPrice != null) next.actualBuyPrice = Math.max(0, Number(patch.actualBuyPrice) || 0);
      return next;
    }));
  }, []);

  // Bulk-add inventory positions (used by the CSV/mass importer).
  const addManyToPortfolio = useCallback((entries) => {
    if (!entries?.length) return;
    const stamped = entries.map((e, i) => ({
      id: `${e.cardId || 'imp'}-${Date.now()}-${i}`,
      cardId: e.cardId,
      card: e.card,
      actualBuyPrice: Math.max(0, Number(e.actualBuyPrice) || 0),
      quantity: Math.max(1, Number(e.quantity) || 1),
      condition: e.condition || 'NM',
      location: (e.location || '').trim(),
      purchaseDate: e.purchaseDate || Date.now(),
    }));
    setPortfolio((prev) => [...prev, ...stamped]);
    showToast(`📥 ${stamped.length} Positionen importiert`);
  }, [showToast]);

  const removeFromPortfolio = useCallback((entryId) => {
    setPortfolio((prev) => prev.filter((e) => e.id !== entryId));
    showToast('Aus Sammlung entfernt');
  }, [showToast]);

  // Record a sale: move the holding to the sold log with realized profit.
  const sellFromPortfolio = useCallback((entryId, sellPrice) => {
    const entry = portfolio.find((e) => e.id === entryId);
    if (!entry) return;
    const qty = entry.quantity || 1;
    const price = Number(sellPrice) || entry.card?.prices?.market || entry.actualBuyPrice || 0;
    const realized = (price - (entry.actualBuyPrice || 0)) * qty;
    setSold((prev) => [...prev, { ...entry, sellPrice: price, soldDate: Date.now(), realized }]);
    setPortfolio((prev) => prev.filter((e) => e.id !== entryId));
    showToast(`${realized >= 0 ? '✅' : '➖'} Verkauf erfasst: ${realized >= 0 ? '+' : ''}${realized.toFixed(2)} €`);
  }, [portfolio, showToast]);

  const removeSold = useCallback((entryId) => {
    setSold((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const saveNote = useCallback((cardId, text) => {
    setNotes((prev) => ({ ...prev, [cardId]: text }));
  }, []);

  const addTag = useCallback((cardId, tag) => {
    const t = (tag || '').trim().toLowerCase();
    if (!t) return;
    setTags((prev) => {
      const cur = prev[cardId] || [];
      if (cur.includes(t)) return prev;
      return { ...prev, [cardId]: [...cur, t] };
    });
  }, []);

  const removeTag = useCallback((cardId, tag) => {
    setTags((prev) => ({ ...prev, [cardId]: (prev[cardId] || []).filter((x) => x !== tag) }));
  }, []);

  const toggleCompare = useCallback((card) => {
    setCompareList((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev.filter((c) => c.id !== card.id);
      if (prev.length >= 3) { showToast('⚠️ Max. 3 Karten vergleichbar'); return prev; }
      return [...prev, card];
    });
  }, [showToast]);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const updateSettings = useCallback((patch) => setSettings((prev) => ({ ...prev, ...patch })), []);

  // current price for a portfolio entry (live if the card is in the dataset)
  const freshPrice = useCallback((entry) => {
    const live = cardById.get(entry.cardId);
    return live?.prices?.market ?? entry.card?.prices?.market ?? null;
  }, [cardById]);

  const value = {
    cards, source, lastUpdated, loading, error,
    watchlist, portfolio, sold, notes, tags, settings, compareList, toast,
    theme, toggleTheme,
    fetchCards, loadSample,
    inWatchlist, inPortfolio, inCompare,
    toggleWatchlist, addToPortfolio, updatePortfolioEntry, addManyToPortfolio, removeFromPortfolio, sellFromPortfolio, removeSold,
    saveNote, addTag, removeTag,
    toggleCompare, clearCompare,
    updateSettings, showToast, freshPrice,
    getPriceHistory,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
