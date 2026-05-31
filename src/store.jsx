import { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { store, KEYS, setNamespace, setGameNamespace } from './lib/storage.js';
import { enrich } from './lib/metrics.js';
import { ruleHit, fireNotification } from './lib/alerts.js';
import { currentAccount, getSession, register as authRegister, login as authLogin, logout as authLogout } from './lib/auth.js';
import { applyTheme } from './lib/theme.js';
import { getGame, gameSnapshot } from './data/providers/index.js';
import { SAMPLE_CARDS } from './data/sampleCards.js';
import { ONE_PIECE_CARDS } from './data/onePieceCards.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const DEFAULT_SETTINGS = { game: 'pokemon', apiKey: '', platform: 'cardmarket', includeShipping: true, theme: 'dark', fxEurUsd: 1.08, pro: false, buyRules: null };

// The last-selected game persists at the account level (outside the per-game
// namespace) so reopening the app returns you to the same TCG. '' = no game
// chosen yet → show the game-selection landing page.
const ACTIVE_GAME_KEY = 'kwde_active_game';

// Per-game bundled sample dataset (used until a live snapshot loads).
const SAMPLES = { pokemon: SAMPLE_CARDS, onepiece: ONE_PIECE_CARDS };
const sampleFor = (g) => SAMPLES[g] || [];

// Static daily snapshot for a game, produced at deploy time and served
// same-origin (no browser CORS limits). null = no snapshot yet (sample only).
const snapshotUrl = (g) => {
  const path = gameSnapshot(g);
  return path ? `${import.meta.env.BASE_URL}${path}` : null;
};

export function StoreProvider({ children }) {
  const [rawCards, setRawCards] = useState([]);
  const [source, setSource] = useState(null); // 'live' | 'sample' | 'cache'
  const [snapshotInfo, setSnapshotInfo] = useState(null); // { cmEnriched, pricesEstimated }
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [sold, setSold] = useState([]);
  const [notes, setNotes] = useState({});
  const [tags, setTags] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [alertLog, setAlertLog] = useState([]);
  const [buylist, setBuylist] = useState({ rules: null, items: [] });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [account, setAccount] = useState(null); // local account profile or null (guest)
  // Active TCG. '' until the user picks one on the landing page. Read once up
  // front so a returning visitor lands back on their last game (ignored if that
  // game is no longer enabled).
  const [activeGame, setActiveGame] = useState(() => {
    try {
      const g = localStorage.getItem(ACTIVE_GAME_KEY) || '';
      return g && getGame(g).enabled ? g : '';
    } catch { return ''; }
  });

  const [compareList, setCompareList] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const firingRef = useRef({}); // ruleId -> currently-firing (debounces repeats)

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

  // Loads ALL persisted user data for the CURRENT namespace into state. Always
  // sets every field (to a default when missing) so switching accounts cleanly
  // swaps profiles instead of leaking the previous account's data.
  const loadAll = useCallback(() => {
    const wl = store.get(KEYS.watchlist);
    const pf = store.get(KEYS.portfolio);
    const sl = store.get(KEYS.sold);
    const nt = store.get(KEYS.notes);
    const tg = store.get(KEYS.tags);
    const ph = store.get(KEYS.priceHistory);
    const al = store.get(KEYS.alerts);
    const alg = store.get(KEYS.alertLog);
    const bl = store.get(KEYS.buylist);
    const st = store.get(KEYS.settings);
    setWatchlist(Array.isArray(wl) ? wl : []);
    setPortfolio(Array.isArray(pf) ? pf : []);
    setSold(Array.isArray(sl) ? sl : []);
    setNotes(nt && typeof nt === 'object' ? nt : {});
    setTags(tg && typeof tg === 'object' ? tg : {});
    setPriceHistory(ph && typeof ph === 'object' ? ph : {});
    setAlerts(Array.isArray(al) ? al : []);
    setAlertLog(Array.isArray(alg) ? alg : []);
    setBuylist(bl && typeof bl === 'object' ? { rules: bl.rules || null, items: Array.isArray(bl.items) ? bl.items : [] } : { rules: null, items: [] });
    setSettings(st && typeof st === 'object' ? { ...DEFAULT_SETTINGS, ...st } : DEFAULT_SETTINGS);
    firingRef.current = {}; // reset alert debounce when switching profiles
  }, []);

  // Loads the card dataset for `g`: cached snapshot if present, else the bundled
  // sample, then pulls the fresh same-origin snapshot in the background.
  const loadGameData = useCallback((g) => {
    const cache = store.get(KEYS.cards);
    if (cache && Array.isArray(cache.cards) && cache.cards.length) {
      setRawCards(cache.cards);
      setSource('cache');
      setLastUpdated(cache.ts ? new Date(cache.ts) : null);
    } else {
      setRawCards(sampleFor(g));
      setSource('sample');
      setLastUpdated(null);
    }
    loadSnapshot({ silent: true, game: g });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- load persisted state once, then auto-refresh if stale ------------
  useEffect(() => {
    // Point storage at the signed-in account's namespace (guest = '' = the
    // original keys, so existing data is preserved).
    setNamespace(getSession() || '');
    setAccount(currentAccount());

    if (activeGame) {
      // Returning visitor with a chosen game: load that game's profile + data.
      setGameNamespace(activeGame);
      loadAll();
      loadGameData(activeGame);
    } else {
      // No game chosen yet → landing page. Still load account-level settings
      // (theme/pro) from the Pokémon/base namespace so the UI looks right.
      setGameNamespace('pokemon');
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick a game from the landing page (or switch games): re-key storage to that
  // game's namespace, load its profile + dataset, and remember the choice.
  const selectGame = useCallback((g) => {
    if (!g) return;
    setGameNamespace(g);
    setActiveGame(g);
    try { localStorage.setItem(ACTIVE_GAME_KEY, g); } catch { /* ignore */ }
    setSettings((prev) => ({ ...prev, game: g }));
    loadAll();
    loadGameData(g);
  }, [loadAll, loadGameData]);

  // Return to the game-selection landing page (does not erase any data).
  const leaveGame = useCallback(() => {
    setActiveGame('');
    try { localStorage.removeItem(ACTIVE_GAME_KEY); } catch { /* ignore */ }
  }, []);

  // ---- persistence ------------------------------------------------------
  useEffect(() => { store.set(KEYS.watchlist, watchlist); }, [watchlist]);
  useEffect(() => { store.set(KEYS.portfolio, portfolio); }, [portfolio]);
  useEffect(() => { store.set(KEYS.sold, sold); }, [sold]);
  useEffect(() => { store.set(KEYS.notes, notes); }, [notes]);
  useEffect(() => { store.set(KEYS.tags, tags); }, [tags]);
  useEffect(() => { store.set(KEYS.priceHistory, priceHistory); }, [priceHistory]);
  useEffect(() => { store.set(KEYS.alerts, alerts); }, [alerts]);
  useEffect(() => { store.set(KEYS.alertLog, alertLog); }, [alertLog]);
  useEffect(() => { store.set(KEYS.buylist, buylist); }, [buylist]);
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

  // ---- price alerts -----------------------------------------------------
  const addAlert = useCallback((rule) => { setAlerts((prev) => [...prev, rule]); showToast('🔔 Preis-Alarm angelegt'); }, [showToast]);
  const removeAlert = useCallback((id) => setAlerts((prev) => prev.filter((a) => a.id !== id)), []);
  const toggleAlert = useCallback((id) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))), []);
  const updateAlert = useCallback((id, patch) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch, target: patch.target != null ? Number(patch.target) || 0 : a.target } : a))), []);
  const clearAlertLog = useCallback(() => setAlertLog([]), []);

  // ---- buylist ----------------------------------------------------------
  const inBuylist = useCallback((id) => buylist.items.some((i) => i.id === id), [buylist.items]);
  const addToBuylist = useCallback((card) => {
    setBuylist((bl) => {
      if (bl.items.some((i) => i.id === card.id)) { showToast('Schon in der Buylist'); return bl; }
      showToast('🧾 Zur Buylist hinzugefügt');
      return { ...bl, items: [...bl.items, { id: card.id, condition: 'NM', qty: 1 }] };
    });
  }, [showToast]);
  const removeFromBuylist = useCallback((id) => setBuylist((bl) => ({ ...bl, items: bl.items.filter((i) => i.id !== id) })), []);
  const setBuylistItems = useCallback((updater) => setBuylist((bl) => ({ ...bl, items: typeof updater === 'function' ? updater(bl.items) : updater })), []);
  const setBuylistRules = useCallback((updater) => setBuylist((bl) => ({ ...bl, rules: typeof updater === 'function' ? updater(bl.rules) : updater })), []);

  // ---- local accounts ---------------------------------------------------
  // setNamespace only swaps the ACCOUNT part of the storage namespace; the
  // active game segment is preserved, so each account still keeps per-game data.
  const login = useCallback(async (creds) => {
    const res = await authLogin(creds);
    if (res.ok) { setNamespace(res.account.id); setAccount(res.account); loadAll(); if (activeGame) loadGameData(activeGame); showToast(`👤 Angemeldet: ${res.account.name}`); }
    return res;
  }, [loadAll, loadGameData, activeGame, showToast]);
  const register = useCallback(async (creds) => {
    const res = await authRegister(creds);
    if (res.ok) { setNamespace(res.account.id); setAccount(res.account); loadAll(); if (activeGame) loadGameData(activeGame); showToast(`✅ Konto erstellt: ${res.account.name}`); }
    return res;
  }, [loadAll, loadGameData, activeGame, showToast]);
  const logout = useCallback(() => {
    authLogout(); setNamespace(''); setAccount(null); loadAll(); if (activeGame) loadGameData(activeGame); showToast('Abgemeldet · Gast-Profil');
  }, [loadAll, loadGameData, activeGame, showToast]);

  // Evaluate alerts whenever fresh prices or the rules change. Fires once per
  // rule on the false→true transition (firingRef debounces repeats) and emits an
  // in-app toast plus a Web Notification.
  useEffect(() => {
    if (!cards.length || !alerts.length) return;
    const byId = new Map(cards.map((c) => [c.id, c]));
    const events = [];
    for (const rule of alerts) {
      if (!rule.active) { firingRef.current[rule.id] = false; continue; }
      const price = byId.get(rule.cardId)?.m?.market;
      if (price == null) continue;
      const hit = ruleHit(rule, price);
      if (hit && !firingRef.current[rule.id]) {
        events.push({ ruleId: rule.id, cardId: rule.cardId, name: rule.name, direction: rule.direction, target: rule.target, price });
      }
      firingRef.current[rule.id] = hit;
    }
    if (events.length) {
      const stamped = events.map((e, i) => ({ ...e, id: `ev-${Date.now()}-${i}`, at: Date.now() }));
      setAlertLog((prev) => [...stamped, ...prev].slice(0, 120));
      stamped.forEach(fireNotification);
      showToast(`🔔 ${stamped.length} Preis-Alert${stamped.length > 1 ? 's' : ''} ausgelöst`);
    }
  }, [cards, alerts, showToast]);

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
  // Loads the static daily snapshot baked into the site at deploy time, for the
  // given game (defaults to the active one). `silent` = background load on mount
  // (no error banner; keep current data). Games without a snapshot (e.g. One
  // Piece for now) simply keep their bundled sample data.
  const loadSnapshot = useCallback(async ({ silent = false, game } = {}) => {
    const g = game || activeGame || 'pokemon';
    const url = snapshotUrl(g);
    if (!url) { if (!silent) showToast('Für dieses Spiel gibt es noch keine Live-Daten – Beispieldaten aktiv.'); return false; }
    setLoading(true);
    if (!silent) setError(null);
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.cards) ? data.cards : [];
      if (list.length === 0) throw new Error('Snapshot leer');
      const ts = data.generatedAt ? new Date(data.generatedAt).getTime() : Date.now();
      setRawCards(list);
      setSource('snapshot');
      setSnapshotInfo({ cmEnriched: data.cmEnriched || 0, pricesEstimated: !!data.pricesEstimated });
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
  }, [showToast, accumulateHistory, activeGame]);

  const loadSample = useCallback(() => {
    setRawCards(sampleFor(activeGame || 'pokemon'));
    setSource('sample');
    setError(null);
    showToast('🃏 Beispieldaten geladen');
  }, [showToast, activeGame]);

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
    const { price, quantity = 1, condition = 'NM', location = '', variant = 'normal' } = typeof opts === 'object' ? opts : { price: opts };
    const entry = {
      id: `${card.id}-${Date.now()}`,
      cardId: card.id,
      card,
      actualBuyPrice: Number(price) || card.prices?.low || card.prices?.market || 0,
      quantity: Math.max(1, Number(quantity) || 1),
      condition: condition || 'NM',
      location: (location || '').trim(),
      variant: variant || 'normal',
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

  // Bulk-remove several inventory positions at once (multi-select).
  const removeManyFromPortfolio = useCallback((entryIds) => {
    const ids = new Set(entryIds || []);
    if (!ids.size) return;
    setPortfolio((prev) => prev.filter((e) => !ids.has(e.id)));
    showToast(`${ids.size} Position${ids.size > 1 ? 'en' : ''} entfernt`);
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
    cards, source, snapshotInfo, lastUpdated, loading, error,
    watchlist, portfolio, sold, notes, tags, settings, compareList, toast,
    theme, toggleTheme,
    fetchCards, loadSample,
    inWatchlist, inPortfolio, inCompare,
    toggleWatchlist, addToPortfolio, updatePortfolioEntry, addManyToPortfolio, removeFromPortfolio, removeManyFromPortfolio, sellFromPortfolio, removeSold,
    saveNote, addTag, removeTag,
    toggleCompare, clearCompare,
    updateSettings, showToast, freshPrice,
    getPriceHistory,
    alerts, alertLog, addAlert, removeAlert, toggleAlert, updateAlert, clearAlertLog,
    buylist, inBuylist, addToBuylist, removeFromBuylist, setBuylistItems, setBuylistRules,
    account, login, register, logout,
    activeGame, selectGame, leaveGame,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
