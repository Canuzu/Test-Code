import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Settings as Cog, GitCompare, Download, Sun, Moon, Crown, Smartphone, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { StoreProvider, useStore } from './store.jsx';
import { C } from './lib/theme.js';
import { isPro } from './lib/pro.js';
import { fmtNum } from './lib/format.js';
import { getGame } from './data/providers/index.js';
import Discover from './components/Discover.jsx';
import WatchlistView from './components/WatchlistView.jsx';
import PortfolioView from './components/PortfolioView.jsx';

// Heavy / on-demand views are code-split so the charting library (recharts)
// and modals are not part of the initial bundle.
const Analytics = lazy(() => import('./components/Analytics.jsx'));
const CardModal = lazy(() => import('./components/CardModal.jsx'));
const CompareModal = lazy(() => import('./components/CompareModal.jsx'));
const SettingsModal = lazy(() => import('./components/SettingsModal.jsx'));
const BuylistView = lazy(() => import('./components/BuylistView.jsx'));
const AlertsView = lazy(() => import('./components/AlertsView.jsx'));
const ImportModal = lazy(() => import('./components/ImportModal.jsx'));
const PricingModal = lazy(() => import('./components/PricingModal.jsx'));
const AuthModal = lazy(() => import('./components/AuthModal.jsx'));

function Loader() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, pointerEvents: 'none' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #ffffff22', borderTopColor: C.gold, borderRadius: '50%' }} className="spin" />
    </div>
  );
}

const exportCSV = (cards) => {
  if (!cards.length) return;
  const head = ['Name', 'Set', 'Seltenheit', 'Markt', 'Guenstigste', 'Trend', 'Aenderung7T%', 'Aenderung30T%', 'Beliebtheit', 'Risiko', 'Score', 'Tier'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = cards.map((c) => [c.name, c.set, c.rarity, c.m.market, c.prices.low, c.prices.trend, c.m.change7?.toFixed(1), c.m.change30?.toFixed(1), c.m.popularity, c.m.risk, c.m.score, c.m.tier.l].map(esc).join(','));
  const blob = new Blob(['﻿' + [head.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kartenwert_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const TABS = [
  { id: 'discover', label: '🔍 Entdecken', icon: '🔍', short: 'Suchen' },
  { id: 'analytics', label: '📊 Analyse', icon: '📊', short: 'Analyse' },
  { id: 'watchlist', label: '⭐ Watchlist', icon: '⭐', short: 'Merken' },
  { id: 'portfolio', label: '📦 Sammlung', icon: '📦', short: 'Bestand' },
  { id: 'buylist', label: '🧾 Buylist', icon: '🧾', short: 'Buylist' },
  { id: 'alerts', label: '🔔 Alerts', icon: '🔔', short: 'Alerts' },
];

function Shell() {
  const { cards, watchlist, portfolio, compareList, toast, settings, source, theme, toggleTheme, alerts, account } = useStore();
  const [tab, setTab] = useState('discover');
  const [modal, setModal] = useState(null); // { card, tab }
  const [showCompare, setShowCompare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);

  // PWA install prompt: capture the event so we can offer an install button.
  useEffect(() => {
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const install = async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); };

  // ---- browser back/forward navigation -------------------------------------
  // Each navigable change (tab switch or opening a modal) becomes a history
  // entry, so the browser Back/Forward buttons (and the Android system back
  // button in the installed PWA) move through the app instead of leaving it.
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const isPopping = useRef(false);
  const firstNav = useRef(true);
  const navView = {
    tab,
    modal: modal ? { id: modal.card.id, tab: modal.tab } : null,
    showCompare, showSettings, showImport, showPricing, showAuth,
  };

  useEffect(() => {
    window.history.replaceState({ __kw: { tab: 'discover' } }, '');
    const onPop = (e) => {
      const v = e.state?.__kw || {};
      isPopping.current = true;
      setTab(v.tab || 'discover');
      setShowCompare(!!v.showCompare);
      setShowSettings(!!v.showSettings);
      setShowImport(!!v.showImport);
      setShowPricing(!!v.showPricing);
      setShowAuth(!!v.showAuth);
      if (v.modal) {
        const c = cardsRef.current.find((x) => x.id === v.modal.id);
        setModal(c ? { card: c, tab: v.modal.tab } : null);
      } else setModal(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (firstNav.current) { firstNav.current = false; return; }
    if (isPopping.current) { isPopping.current = false; return; }
    window.history.pushState({ __kw: navView }, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, modal, showCompare, showSettings, showImport, showPricing, showAuth]);

  const onOpen = (card, t = 'overview') => setModal({ card, tab: t });
  const game = getGame(settings.game);
  const pro = isPro(settings);
  const badge = { watchlist: watchlist.length, portfolio: portfolio.length, alerts: alerts.filter((a) => a.active).length };
  const avgScore = cards.length ? fmtNum(cards.reduce((s, c) => s + c.m.score, 0) / cards.length, 0) : '–';

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.appGrad1} 0%, ${C.appGrad2} 100%)`, color: C.text }}>
      {/* Header */}
      <header style={{ background: C.headerBg, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.lineStrong}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            <button onClick={() => window.history.back()} title="Zurück" className="control" style={{ padding: '7px 8px', display: 'flex', alignItems: 'center' }}><ArrowLeft size={15} /></button>
            <button onClick={() => window.history.forward()} title="Vor" className="control" style={{ padding: '7px 8px', display: 'flex', alignItems: 'center' }}><ArrowRight size={15} /></button>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #ffd700, #ff6b35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, boxShadow: '0 0 18px #ffd70044' }}>{game.emoji}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, background: 'linear-gradient(90deg, #ffd700, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KartenwertDE</div>
            <div style={{ fontSize: 10, color: C.textFaint }}>Live-Preistracker · Cardmarket EU · {game.label}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cards.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: source === 'snapshot' ? '#00e67615' : '#ffffff0c', border: `1px solid ${source === 'snapshot' ? '#00e67630' : C.lineStrong}`, borderRadius: 20, padding: '4px 11px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: source === 'snapshot' ? C.green : C.textFaint, animation: source === 'snapshot' ? 'blink 2s infinite' : 'none' }} />
              <span style={{ fontSize: 11, color: source === 'snapshot' ? C.green : C.textDim, fontWeight: 600 }}>{cards.length} · Ø {avgScore}</span>
            </div>
          )}
          <button onClick={() => exportCSV(cards)} disabled={!cards.length} title="CSV-Export" className="control" style={{ padding: '7px 9px', display: 'flex', alignItems: 'center', gap: 4, opacity: cards.length ? 1 : 0.4 }}>
            <Download size={13} />
          </button>
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'} className="control" style={{ padding: '7px 9px', display: 'flex', alignItems: 'center' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {installEvt && (
            <button onClick={install} title="Als App installieren" className="control" style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5, color: C.green2, borderColor: C.green2 + '55' }}>
              <Smartphone size={13} /> <span style={{ fontSize: 11, fontWeight: 700 }}>App</span>
            </button>
          )}
          <button onClick={() => setShowPricing(true)} title={pro ? 'Pro aktiv' : 'Pro freischalten'} className="control" style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5, color: pro ? C.gold : C.textSoft, borderColor: pro ? C.gold + '55' : undefined }}>
            <Crown size={13} /> <span style={{ fontSize: 11, fontWeight: 700 }}>{pro ? 'Pro ✓' : 'Pro'}</span>
          </button>
          <button onClick={() => setShowAuth(true)} title={account ? account.email : 'Anmelden'} className="control" style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {account
              ? <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#ffd700,#ff6b35)', color: '#0c0c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{(account.name || account.email).slice(0, 1).toUpperCase()}</span>
              : <User size={14} />}
            <span style={{ fontSize: 11, fontWeight: 700, maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account ? account.name : 'Anmelden'}</span>
          </button>
          <button onClick={() => setShowSettings(true)} title="Einstellungen" className="control" style={{ padding: '7px 9px', display: 'flex', alignItems: 'center' }}>
            <Cog size={14} />
          </button>
        </div>
      </header>

      {/* Tab nav (desktop / tablet — replaced by a bottom bar on phones) */}
      <nav className="desktop-nav" style={{ display: 'flex', background: C.bg1, borderBottom: `1px solid ${C.lineStrong}`, padding: '0 16px', overflowX: 'auto', position: 'sticky', top: 63, zIndex: 49 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 18px', border: 'none', background: 'none', color: tab === t.id ? C.gold : C.textFaint, borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.label}
            {badge[t.id] > 0 && <span style={{ background: tab === t.id ? '#ffd70022' : '#ffffff10', color: tab === t.id ? C.gold : C.textFaint, padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{badge[t.id]}</span>}
          </button>
        ))}
      </nav>

      {/* Body */}
      <main style={{ padding: '16px 20px', maxWidth: 1400, margin: '0 auto' }}>
        {tab === 'discover' && <Discover onOpen={onOpen} />}
        {tab === 'analytics' && <Suspense fallback={<Loader />}><Analytics onOpen={onOpen} pro={pro} onUpgrade={() => setShowPricing(true)} /></Suspense>}
        {tab === 'watchlist' && <WatchlistView onOpen={onOpen} />}
        {tab === 'portfolio' && <PortfolioView onImport={() => (pro ? setShowImport(true) : setShowPricing(true))} />}
        {tab === 'buylist' && <Suspense fallback={<Loader />}><BuylistView locked={!pro} onUpgrade={() => setShowPricing(true)} /></Suspense>}
        {tab === 'alerts' && <Suspense fallback={<Loader />}><AlertsView locked={!pro} onUpgrade={() => setShowPricing(true)} /></Suspense>}
      </main>

      <footer style={{ borderTop: `1px solid ${C.lineStrong}`, padding: '16px 20px', marginTop: 40, textAlign: 'center', fontSize: 10.5, color: C.textGhost, maxWidth: 900, margin: '40px auto 0', lineHeight: 1.6 }}>
        ⚠️ <strong>Hinweis:</strong> Preisdaten von Cardmarket (EU) via pokemontcg.io – können verzögert oder unvollständig sein.
        Keine Anlageberatung. TCG-Investments sind volatil; investiere nur, was du entbehren kannst.
        Investment-Score & Beliebtheit sind berechnete Heuristiken, keine garantierten Prognosen.
      </footer>

      {compareList.length > 0 && (
        <button onClick={() => setShowCompare(true)} className="fab-compare" style={{ position: 'fixed', bottom: 24, right: 24, background: 'linear-gradient(135deg, #448aff, #6366f1)', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px #448aff66', zIndex: 80 }}>
          <GitCompare size={16} /> Vergleichen ({compareList.length}/3)
        </button>
      )}

      {/* Mobile bottom navigation */}
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ color: tab === t.id ? C.gold : C.textFaint }}>
            <span style={{ fontSize: 18, lineHeight: 1, position: 'relative' }}>
              {t.icon}
              {badge[t.id] > 0 && <span style={{ position: 'absolute', top: -5, right: -10, background: C.red, color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: 8, padding: '0 4px', lineHeight: '13px' }}>{badge[t.id]}</span>}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: tab === t.id ? 700 : 600 }}>{t.short}</span>
          </button>
        ))}
      </nav>

      <Suspense fallback={<Loader />}>
        {modal && <CardModal card={modal.card} initialTab={modal.tab} onClose={() => setModal(null)} />}
        {showCompare && <CompareModal onClose={() => setShowCompare(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {showImport && <ImportModal onClose={() => setShowImport(false)} />}
        {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </Suspense>

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, color: C.text, boxShadow: '0 4px 24px #00000070', zIndex: 200, animation: 'slideUp 0.25s ease' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
