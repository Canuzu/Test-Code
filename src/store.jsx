import { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { store, KEYS } from './lib/storage.js';
import { enrich } from './lib/metrics.js';
import { applyTheme } from './lib/theme.js';
import { getGame } from './data/providers/index.js';
import { SAMPLE_CARDS } from './data/sampleCards.js';
import { supabase } from './lib/supabase.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const DEFAULT_SETTINGS = { game: 'pokemon', apiKey: '', platform: 'cardmarket', includeShipping: true, theme: 'dark' };
const SNAPSHOT_URL = `${import.meta.env.BASE_URL}data/cards.json`;

export function StoreProvider({ children }) {
  const [rawCards, setRawCards] = useState([]);
  const [source, setSource] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [sold, setSold] = useState([]);
  const [notes, setNotes] = useState({});
  const [tags, setTags] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [compareList, setCompareList] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const syncTimers = useRef({});
  const cloudSyncing = useRef(false); // skip cloud-saves during initial load

  // ── Theme ─────────────────────────────────────────────────────────────────
  const theme = settings.theme === 'light' ? 'light' : 'dark';
  applyTheme(theme);
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggleTheme = useCallback(() => {
    setSettings((p) => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  // ── Cloud save (debounced 800 ms per key) ─────────────────────────────────
  const cloudSave = useCallback((key, value) => {
    if (!supabase || !user || cloudSyncing.current) return;
    clearTimeout(syncTimers.current[key]);
    syncTimers.current[key] = setTimeout(async () => {
      const ownerId = team?.id || user.id;
      const ownerType = team ? 'team' : 'user';
      try {
        await supabase.from('user_store').upsert(
          { owner_id: ownerId, owner_type: ownerType, key, value, updated_at: new Date().toISOString() },
          { onConflict: 'owner_id,owner_type,key' }
        );
      } catch (e) {
        console.error('[cloud] save failed:', key, e.message);
      }
    }, 800);
  }, [user, team]);

  // ── Load all data from cloud ──────────────────────────────────────────────
  const loadFromCloud = useCallback(async (u) => {
    if (!supabase) return;
    cloudSyncing.current = true;
    try {
      const { data: prof } = await supabase
        .from('profiles').select('name, shop_name').eq('id', u.id).maybeSingle();
      if (prof) setProfile(prof);

      const { data: membership } = await supabase
        .from('team_members')
        .select('role, teams(id, name, invite_code, owner_id)')
        .eq('user_id', u.id)
        .maybeSingle();
      const t = membership?.teams ? { ...membership.teams, role: membership.role } : null;
      setTeam(t);

      const ownerId = t?.id || u.id;
      const ownerType = t ? 'team' : 'user';
      const { data: rows } = await supabase
        .from('user_store').select('key, value')
        .eq('owner_id', ownerId).eq('owner_type', ownerType);

      if (rows?.length) {
        const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        if (byKey.watchlist) setWatchlist(byKey.watchlist);
        if (byKey.portfolio) setPortfolio(byKey.portfolio);
        if (byKey.sold)      setSold(byKey.sold);
        if (byKey.notes)     setNotes(byKey.notes);
        if (byKey.tags)      setTags(byKey.tags);
      }
    } catch (e) {
      console.error('[cloud] load failed:', e.message);
    } finally {
      cloudSyncing.current = false;
    }
  }, []);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadFromCloud(session.user); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadFromCloud(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setTeam(null); setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadFromCloud]);

  // ── Load from localStorage on mount ───────────────────────────────────────
  useEffect(() => {
    const wl = store.get(KEYS.watchlist);
    const pf = store.get(KEYS.portfolio);
    const sl = store.get(KEYS.sold);
    const nt = store.get(KEYS.notes);
    const tg = store.get(KEYS.tags);
    const st = store.get(KEYS.settings);
    const cache = store.get(KEYS.cards);
    if (Array.isArray(wl)) setWatchlist(wl);
    if (Array.isArray(pf)) setPortfolio(pf);
    if (Array.isArray(sl)) setSold(sl);
    if (nt && typeof nt === 'object') setNotes(nt);
    if (tg && typeof tg === 'object') setTags(tg);
    const s = st && typeof st === 'object' ? { ...DEFAULT_SETTINGS, ...st } : DEFAULT_SETTINGS;
    if (st && typeof st === 'object') setSettings(s);
    if (cache && Array.isArray(cache.cards) && cache.cards.length) {
      setRawCards(cache.cards); setSource('cache');
      if (cache.ts) setLastUpdated(new Date(cache.ts));
    } else {
      setRawCards(SAMPLE_CARDS); setSource('sample');
    }
    loadSnapshot({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistence: localStorage + cloud ────────────────────────────────────
  useEffect(() => { store.set(KEYS.watchlist, watchlist); cloudSave('watchlist', watchlist); }, [watchlist, cloudSave]);
  useEffect(() => { store.set(KEYS.portfolio, portfolio); cloudSave('portfolio', portfolio); }, [portfolio, cloudSave]);
  useEffect(() => { store.set(KEYS.sold, sold);           cloudSave('sold', sold);           }, [sold, cloudSave]);
  useEffect(() => { store.set(KEYS.notes, notes);         cloudSave('notes', notes);         }, [notes, cloudSave]);
  useEffect(() => { store.set(KEYS.tags, tags);           cloudSave('tags', tags);           }, [tags, cloudSave]);
  useEffect(() => { store.set(KEYS.settings, settings); }, [settings]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const cards = useMemo(() => rawCards.map(enrich), [rawCards]);
  const cardById = useMemo(() => {
    const m = new Map();
    rawCards.forEach((c) => m.set(c.id, c));
    return m;
  }, [rawCards]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast({ msg, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Snapshot fetch ────────────────────────────────────────────────────────
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
      setRawCards(list); setSource('snapshot'); setLastUpdated(new Date(ts));
      store.set(KEYS.cards, { cards: list, ts });
      if (!silent) showToast(`✓ Aktuelle Marktdaten geladen · ${list.length} Karten`);
      return true;
    } catch (e) {
      if (!silent) setError(`Aktuelle Daten konnten nicht geladen werden (${e.message}). Es werden gespeicherte bzw. Beispieldaten gezeigt.`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadSample = useCallback(() => {
    setRawCards(SAMPLE_CARDS); setSource('sample'); setError(null);
    showToast('🃏 Beispieldaten geladen');
  }, [showToast]);

  const fetchCards = useCallback(() => loadSnapshot({ silent: false }), [loadSnapshot]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase nicht konfiguriert');
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email, password, name, shopName) => {
    if (!supabase) throw new Error('Supabase nicht konfiguriert');
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, shop_name: shopName } },
      });
      if (error) throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const createTeam = useCallback(async (name) => {
    if (!supabase || !user) return;
    const { data: newTeam, error } = await supabase
      .from('teams').insert({ name, owner_id: user.id }).select().single();
    if (error) throw error;
    await supabase.from('team_members')
      .insert({ team_id: newTeam.id, user_id: user.id, role: 'owner' });
    // migrate current user data into team context
    for (const [key, value] of Object.entries({ watchlist, portfolio, sold, notes, tags })) {
      await supabase.from('user_store').upsert(
        { owner_id: newTeam.id, owner_type: 'team', key, value, updated_at: new Date().toISOString() },
        { onConflict: 'owner_id,owner_type,key' }
      );
    }
    setTeam({ ...newTeam, role: 'owner' });
    showToast(`🏪 Team "${name}" erstellt!`);
    return newTeam;
  }, [user, watchlist, portfolio, sold, notes, tags, showToast]);

  const joinTeam = useCallback(async (code) => {
    if (!supabase || !user) return;
    const { data: t, error } = await supabase.from('teams')
      .select().eq('invite_code', code.trim().toUpperCase()).single();
    if (error || !t) throw new Error('Team nicht gefunden – Code prüfen.');
    const { error: joinErr } = await supabase.from('team_members')
      .insert({ team_id: t.id, user_id: user.id, role: 'member' });
    if (joinErr) throw new Error('Beitreten fehlgeschlagen – bereits Mitglied?');
    await loadFromCloud(user);
    showToast(`👥 Team "${t.name}" beigetreten!`);
  }, [user, loadFromCloud, showToast]);

  const leaveTeam = useCallback(async () => {
    if (!supabase || !user || !team) return;
    if (team.role === 'owner') {
      await supabase.from('teams').delete().eq('id', team.id);
    } else {
      await supabase.from('team_members').delete()
        .eq('team_id', team.id).eq('user_id', user.id);
    }
    setTeam(null);
    showToast('Team verlassen');
  }, [user, team, showToast]);

  // ── Collection actions ────────────────────────────────────────────────────
  const inWatchlist = useCallback((id) => watchlist.some((c) => c.id === id), [watchlist]);
  const inPortfolio = useCallback((id) => portfolio.some((c) => c.cardId === id), [portfolio]);
  const inCompare   = useCallback((id) => compareList.some((c) => c.id === id), [compareList]);

  const toggleWatchlist = useCallback((card) => {
    setWatchlist((prev) => {
      if (prev.some((c) => c.id === card.id)) {
        showToast('Aus Watchlist entfernt');
        return prev.filter((c) => c.id !== card.id);
      }
      showToast('⭐ Zur Watchlist hinzugefügt');
      return [...prev, { ...card, addedAt: Date.now(), addedPrice: card.prices?.market ?? null }];
    });
  }, [showToast]);

  const addToPortfolio = useCallback((card, opts = {}) => {
    const { price, quantity = 1, condition = 'NM' } = typeof opts === 'object' ? opts : { price: opts };
    setPortfolio((prev) => [...prev, {
      id: `${card.id}-${Date.now()}`, cardId: card.id, card,
      actualBuyPrice: Number(price) || card.prices?.low || card.prices?.market || 0,
      quantity: Math.max(1, Number(quantity) || 1),
      condition: condition || 'NM', purchaseDate: Date.now(),
    }]);
    showToast('📦 Zur Sammlung hinzugefügt');
  }, [showToast]);

  const removeFromPortfolio = useCallback((entryId) => {
    setPortfolio((prev) => prev.filter((e) => e.id !== entryId));
    showToast('Aus Sammlung entfernt');
  }, [showToast]);

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

  const removeSold    = useCallback((id) => setSold((p) => p.filter((e) => e.id !== id)), []);
  const saveNote      = useCallback((cardId, text) => setNotes((p) => ({ ...p, [cardId]: text })), []);
  const addTag        = useCallback((cardId, tag) => {
    const t = (tag || '').trim().toLowerCase();
    if (!t) return;
    setTags((p) => {
      const cur = p[cardId] || [];
      return cur.includes(t) ? p : { ...p, [cardId]: [...cur, t] };
    });
  }, []);
  const removeTag     = useCallback((cardId, tag) =>
    setTags((p) => ({ ...p, [cardId]: (p[cardId] || []).filter((x) => x !== tag) })), []);
  const toggleCompare = useCallback((card) => {
    setCompareList((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev.filter((c) => c.id !== card.id);
      if (prev.length >= 3) { showToast('⚠️ Max. 3 Karten vergleichbar'); return prev; }
      return [...prev, card];
    });
  }, [showToast]);
  const clearCompare  = useCallback(() => setCompareList([]), []);
  const updateSettings = useCallback((patch) => setSettings((p) => ({ ...p, ...patch })), []);
  const freshPrice    = useCallback((entry) => {
    const live = cardById.get(entry.cardId);
    return live?.prices?.market ?? entry.card?.prices?.market ?? null;
  }, [cardById]);

  const value = {
    cards, source, lastUpdated, loading, error,
    watchlist, portfolio, sold, notes, tags, settings, compareList, toast,
    theme, toggleTheme,
    fetchCards, loadSample,
    inWatchlist, inPortfolio, inCompare,
    toggleWatchlist, addToPortfolio, removeFromPortfolio, sellFromPortfolio, removeSold,
    saveNote, addTag, removeTag, toggleCompare, clearCompare,
    updateSettings, showToast, freshPrice,
    // auth
    user, team, profile, authLoading,
    signIn, signUp, signOut,
    createTeam, joinTeam, leaveTeam,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
