import { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { store, globalStore, KEYS, setNamespace, setGameNamespace, setWriteHook } from './lib/storage.js';
import { enrich } from './lib/metrics.js';
import { ruleHit, fireNotification } from './lib/alerts.js';
import { restore as authRestore, register as authRegister, login as authLogin, logout as authLogout, cloudEnabled } from './lib/authBackend.js';
import * as cloud from './lib/cloudSync.js';
import { planIsPro, billingEnabled } from './lib/pro.js';
import * as billing from './lib/billing.js';
import { applyTheme } from './lib/theme.js';
import { gameSnapshot } from './data/providers/index.js';
import { rehydrateCards } from './lib/cardCodec.js';
import { hashToView } from './lib/viewUrl.js';
import { SAMPLE_CARDS } from './data/sampleCards.js';
import { ONE_PIECE_CARDS } from './data/onePieceCards.js';
import { YUGIOH_CARDS } from './data/yugiohCards.js';
import { MAGIC_CARDS } from './data/magicCards.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const DEFAULT_SETTINGS = { game: 'pokemon', apiKey: '', platform: 'cardmarket', includeShipping: true, theme: 'dark', fxEurUsd: 1.08, pro: false, buyRules: null };

// Per-game bundled sample dataset (used until a live snapshot loads).
const SAMPLES = { pokemon: SAMPLE_CARDS, onepiece: ONE_PIECE_CARDS, yugioh: YUGIOH_CARDS, magic: MAGIC_CARDS };
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
  const [plan, setPlan] = useState('free');     // server-side billing plan ('free' | 'pro')
  const pro = planIsPro(plan);                  // free-for-all until billing is configured
  // Active TCG, derived solely from the URL. A deep link (#/<game>/...) — incl.
  // the hash the app keeps in sync while you browse, so an in-game refresh stays
  // put — lands on that game. A bare link with no game always opens the
  // game-selection landing page. '' = no game chosen → landing page.
  const [activeGame, setActiveGame] = useState(() => {
    try { const h = hashToView(window.location.hash); if (h.game) return h.game; } catch { /* ignore */ }
    return '';
  });

  const [compareList, setCompareList] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const firingRef = useRef({}); // ruleId -> currently-firing (debounces repeats)

  // Theme is a DEVICE-WIDE preference, kept OUTSIDE the per-account/per-game
  // namespace, so switching games (or signing in) never changes it — it only
  // flips when the user presses the toggle. Applied synchronously during render
  // so children read the right palette, and mirrored onto <html data-theme>.
  const [theme, setTheme] = useState(() => (globalStore.get('theme') === 'light' ? 'light' : 'dark'));
  applyTheme(theme);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      globalStore.set('theme', next);
      return next;
    });
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
    // Show the bundled sample instantly, then swap in the snapshot. The snapshot
    // fetch resolves from the service-worker Cache API on repeat visits, so the
    // sample is only ever a brief first-paint placeholder.
    setRawCards(sampleFor(g));
    setSource('sample');
    setLastUpdated(null);
    loadSnapshot({ silent: true, game: g });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- load persisted state once, then auto-refresh if stale ------------
  useEffect(() => {
    // Cloud sync writes through this hook on every persisted set() (a no-op until
    // a user signs in and cloud.start() arms it).
    setWriteHook(cloud.note);
    (async () => {
      // Restore the signed-in account (Supabase session, or local) and point
      // storage at its namespace (guest = '' = the original keys, so existing
      // data is preserved). For a cloud account, pull its data first.
      const acct = await authRestore();
      setNamespace(acct?.id || '');
      setGameNamespace(activeGame || 'pokemon');
      if (acct?.uid) { await cloud.pull(acct.id, acct.uid); cloud.start(acct.id, acct.uid); }
      if (billingEnabled && acct?.uid) setPlan(await billing.fetchPlan());
      setAccount(acct || null);
      loadAll();
      if (activeGame) loadGameData(activeGame);
    })();
    return () => setWriteHook(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick a game from the landing page (or switch games): re-key storage to that
  // game's namespace and load its profile + dataset. The choice is reflected in
  // the URL hash (App keeps it in sync), so a refresh stays on this game.
  const selectGame = useCallback((g) => {
    if (!g) return;
    setGameNamespace(g);
    setActiveGame(g);
    setSettings((prev) => ({ ...prev, game: g }));
    loadAll();
    loadGameData(g);
  }, [loadAll, loadGameData]);

  // Return to the game-selection landing page (does not erase any data).
  const leaveGame = useCallback(() => {
    setActiveGame('');
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
  // On a cloud login we pull the account's data from Supabase BEFORE loading
  // state, then arm write-through sync; local accounts skip both (no uid).
  const enterAccount = useCallback(async (account) => {
    setNamespace(account.id);
    if (account.uid) { await cloud.pull(account.id, account.uid); cloud.start(account.id, account.uid); }
    if (billingEnabled && account.uid) setPlan(await billing.fetchPlan());
    setAccount(account);
    loadAll();
    if (activeGame) loadGameData(activeGame);
  }, [loadAll, loadGameData, activeGame]);
  const login = useCallback(async (creds) => {
    const res = await authLogin(creds);
    if (res.ok && res.account) { await enterAccount(res.account); showToast(`👤 Angemeldet: ${res.account.name}`); }
    return res;
  }, [enterAccount, showToast]);
  const register = useCallback(async (creds) => {
    const res = await authRegister(creds);
    if (res.pending) { showToast('📧 Konto erstellt – bitte bestätige deine E-Mail, dann anmelden.'); return res; }
    if (res.ok && res.account) { await enterAccount(res.account); showToast(`✅ Konto erstellt: ${res.account.name}`); }
    return res;
  }, [enterAccount, showToast]);
  const logout = useCallback(async () => {
    await authLogout(); cloud.stop(); setNamespace(''); setAccount(null); setPlan('free'); loadAll(); if (activeGame) loadGameData(activeGame); showToast('Abgemeldet · Gast-Profil');
  }, [loadAll, loadGameData, activeGame, showToast]);

  // Re-check the plan from the server (e.g. after returning from Stripe Checkout).
  const refreshPlan = useCallback(async () => {
    if (billingEnabled) setPlan(await billing.fetchPlan());
  }, []);
  // Returning from Checkout: ?billing=success → confirm + refresh once the
  // webhook has flipped the plan; then strip the query param from the URL.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const b = q.get('billing');
    if (!b) return;
    if (b === 'success') { showToast('🎉 Danke! Pro wird aktiviert …'); setTimeout(refreshPlan, 3500); }
    q.delete('billing');
    window.history.replaceState({}, '', window.location.pathname + (q.toString() ? `?${q}` : '') + window.location.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // 'default' lets the HTTP cache + service worker serve the snapshot
      // instantly (stale-while-revalidate) instead of blocking on a revalidation
      // round-trip every load — the single biggest first-paint win for a daily
      // snapshot that changes at most once per day.
      const res = await fetch(url, { cache: 'default' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.cards) ? data.cards : [];
      if (list.length === 0) throw new Error('Snapshot leer');
      // Snapshots ship slimmed (see lib/cardCodec.js): restore the constant /
      // derivable fields so the rest of the app sees the full card shape.
      rehydrateCards(list, g, data.pricesUpdatedAt);
      const ts = data.generatedAt ? new Date(data.generatedAt).getTime() : Date.now();
      setRawCards(list);
      setSource('snapshot');
      setSnapshotInfo({ cmEnriched: data.cmEnriched || 0, pricesEstimated: !!data.pricesEstimated });
      setLastUpdated(new Date(ts));
      // NB: we deliberately do NOT cache the (8–9 MB) card list in localStorage —
      // it overflows the ~5 MB quota and the failed write wasted a full
      // JSON.stringify of the dataset on every load. The service worker's Cache
      // API holds the snapshot instead (no size limit), serving repeat loads.
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
    account, login, register, logout, cloudEnabled,
    pro, plan, billingEnabled, refreshPlan,
    activeGame, selectGame, leaveGame,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
