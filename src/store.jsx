import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { store, KEYS } from './lib/storage.js';
import { enrich } from './lib/metrics.js';
import { getProvider, getGame } from './data/providers/index.js';
import { SAMPLE_CARDS } from './data/sampleCards.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const DEFAULT_SETTINGS = { game: 'pokemon', apiKey: '', platform: 'cardmarket', includeShipping: true };

export function StoreProvider({ children }) {
  const [rawCards, setRawCards] = useState([]);
  const [source, setSource] = useState(null); // 'live' | 'sample' | 'cache'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [notes, setNotes] = useState({});
  const [tags, setTags] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [compareList, setCompareList] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const abortRef = useRef(null);

  // ---- load persisted state once, then auto-refresh if stale ------------
  useEffect(() => {
    const wl = store.get(KEYS.watchlist);
    const pf = store.get(KEYS.portfolio);
    const nt = store.get(KEYS.notes);
    const tg = store.get(KEYS.tags);
    const st = store.get(KEYS.settings);
    const cache = store.get(KEYS.cards);
    if (Array.isArray(wl)) setWatchlist(wl);
    if (Array.isArray(pf)) setPortfolio(pf);
    if (nt && typeof nt === 'object') setNotes(nt);
    if (tg && typeof tg === 'object') setTags(tg);
    const s = st && typeof st === 'object' ? { ...DEFAULT_SETTINGS, ...st } : DEFAULT_SETTINGS;
    if (st && typeof st === 'object') setSettings(s);

    let cacheTs = null;
    if (cache && Array.isArray(cache.cards) && cache.cards.length) {
      setRawCards(cache.cards);
      setSource('cache');
      cacheTs = cache.ts || null;
      if (cache.ts) setLastUpdated(new Date(cache.ts));
    } else {
      setRawCards(SAMPLE_CARDS);
      setSource('sample');
    }

    // Background live refresh when the cache is empty or older than 12h.
    // Silent: if it fails (e.g. opened from file://) we quietly keep the
    // current data instead of showing an error.
    const STALE_MS = 12 * 60 * 60 * 1000;
    if (!cacheTs || Date.now() - cacheTs > STALE_MS) {
      runFetch('', { silent: true, gameId: s.game, apiKey: s.apiKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persistence ------------------------------------------------------
  useEffect(() => { store.set(KEYS.watchlist, watchlist); }, [watchlist]);
  useEffect(() => { store.set(KEYS.portfolio, portfolio); }, [portfolio]);
  useEffect(() => { store.set(KEYS.notes, notes); }, [notes]);
  useEffect(() => { store.set(KEYS.tags, tags); }, [tags]);
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

  // ---- data fetching ----------------------------------------------------
  const loadSample = useCallback(() => {
    setRawCards(SAMPLE_CARDS);
    setSource('sample');
    setError(null);
    showToast('🃏 Beispieldaten geladen');
  }, [showToast]);

  // Core fetch. `silent` = background auto-refresh (no error banner; keep the
  // current data on failure). gameId/apiKey overrides let the mount effect use
  // freshly-read settings before state has committed.
  const runFetch = useCallback(async (query = '', { silent = false, gameId, apiKey } = {}) => {
    const g = gameId ?? settings.game;
    const key = apiKey ?? settings.apiKey;
    const provider = getProvider(g);
    if (!provider) {
      if (!silent) showToast(`${getGame(g).label} kommt bald – aktuell nur Pokémon`);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    if (!silent) setError(null);
    try {
      const { cards: fetched } = await provider.search({ query, apiKey: key, signal: ctrl.signal });
      if (!fetched || fetched.length === 0) {
        if (!silent) setError('Keine Karten mit Preis gefunden. Anderen Suchbegriff probieren.');
      } else {
        const ts = Date.now();
        setRawCards(fetched);
        setSource('live');
        setLastUpdated(new Date(ts));
        store.set(KEYS.cards, { cards: fetched, ts });
        showToast(`${silent ? '🟢 Live-Preise aktualisiert' : '✓ Live-Preise (Cardmarket EU)'} · ${fetched.length} Karten`);
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (!silent) setError(`Live-Abruf fehlgeschlagen: ${e.message}. Du siehst weiter die zuletzt geladenen Daten.`);
    } finally {
      setLoading(false);
    }
  }, [settings.game, settings.apiKey, showToast]);

  const fetchCards = useCallback((query = '') => runFetch(query, { silent: false }), [runFetch]);

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

  const addToPortfolio = useCallback((card, actualPrice) => {
    const entry = {
      id: `${card.id}-${Date.now()}`,
      cardId: card.id,
      card,
      actualBuyPrice: Number(actualPrice) || card.prices?.low || card.prices?.market || 0,
      purchaseDate: Date.now(),
    };
    setPortfolio((prev) => [...prev, entry]);
    showToast('💼 Ins Portfolio aufgenommen');
  }, [showToast]);

  const removeFromPortfolio = useCallback((entryId) => {
    setPortfolio((prev) => prev.filter((e) => e.id !== entryId));
    showToast('Aus Portfolio entfernt');
  }, [showToast]);

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
    watchlist, portfolio, notes, tags, settings, compareList, toast,
    fetchCards, loadSample,
    inWatchlist, inPortfolio, inCompare,
    toggleWatchlist, addToPortfolio, removeFromPortfolio,
    saveNote, addTag, removeTag,
    toggleCompare, clearCompare,
    updateSettings, showToast, freshPrice,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
