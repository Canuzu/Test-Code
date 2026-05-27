import { useState, lazy, Suspense } from 'react';
import { Settings as Cog, GitCompare, Download } from 'lucide-react';
import { StoreProvider, useStore } from './store.jsx';
import { C } from './lib/theme.js';
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
  { id: 'discover', label: '🔍 Entdecken' },
  { id: 'analytics', label: '📊 Analyse' },
  { id: 'watchlist', label: '⭐ Watchlist' },
  { id: 'portfolio', label: '💼 Portfolio' },
];

function Shell() {
  const { cards, watchlist, portfolio, compareList, toast, settings, source } = useStore();
  const [tab, setTab] = useState('discover');
  const [modal, setModal] = useState(null); // { card, tab }
  const [showCompare, setShowCompare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onOpen = (card, t = 'overview') => setModal({ card, tab: t });
  const game = getGame(settings.game);
  const badge = { watchlist: watchlist.length, portfolio: portfolio.length };
  const avgScore = cards.length ? fmtNum(cards.reduce((s, c) => s + c.m.score, 0) / cards.length, 0) : '–';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0a18 0%, #120820 100%)', color: C.text }}>
      {/* Header */}
      <header style={{ background: '#0e0e2099', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.lineStrong}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #ffd700, #ff6b35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, boxShadow: '0 0 18px #ffd70044' }}>{game.emoji}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, background: 'linear-gradient(90deg, #ffd700, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KartenwertDE</div>
            <div style={{ fontSize: 10, color: C.textFaint }}>Live-Preistracker · Cardmarket EU · {game.label}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cards.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: source === 'live' ? '#00e67615' : '#ffffff0c', border: `1px solid ${source === 'live' ? '#00e67630' : C.lineStrong}`, borderRadius: 20, padding: '4px 11px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: source === 'live' ? C.green : C.textFaint, animation: source === 'live' ? 'blink 2s infinite' : 'none' }} />
              <span style={{ fontSize: 11, color: source === 'live' ? C.green : C.textDim, fontWeight: 600 }}>{cards.length} · Ø {avgScore}</span>
            </div>
          )}
          <button onClick={() => exportCSV(cards)} disabled={!cards.length} title="CSV-Export" className="control" style={{ padding: '7px 9px', display: 'flex', alignItems: 'center', gap: 4, opacity: cards.length ? 1 : 0.4 }}>
            <Download size={13} />
          </button>
          <button onClick={() => setShowSettings(true)} title="Einstellungen" className="control" style={{ padding: '7px 9px', display: 'flex', alignItems: 'center' }}>
            <Cog size={14} />
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <nav style={{ display: 'flex', background: '#0e0e2a', borderBottom: `1px solid ${C.lineStrong}`, padding: '0 16px', overflowX: 'auto', position: 'sticky', top: 63, zIndex: 49 }}>
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
        {tab === 'analytics' && <Suspense fallback={<Loader />}><Analytics onOpen={onOpen} /></Suspense>}
        {tab === 'watchlist' && <WatchlistView onOpen={onOpen} />}
        {tab === 'portfolio' && <PortfolioView />}
      </main>

      <footer style={{ borderTop: `1px solid ${C.lineStrong}`, padding: '16px 20px', marginTop: 40, textAlign: 'center', fontSize: 10.5, color: C.textGhost, maxWidth: 900, margin: '40px auto 0', lineHeight: 1.6 }}>
        ⚠️ <strong>Hinweis:</strong> Preisdaten von Cardmarket (EU) via pokemontcg.io – können verzögert oder unvollständig sein.
        Keine Anlageberatung. TCG-Investments sind volatil; investiere nur, was du entbehren kannst.
        Investment-Score & Beliebtheit sind berechnete Heuristiken, keine garantierten Prognosen.
      </footer>

      {compareList.length > 0 && (
        <button onClick={() => setShowCompare(true)} style={{ position: 'fixed', bottom: 24, right: 24, background: 'linear-gradient(135deg, #448aff, #6366f1)', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px #448aff66', zIndex: 80 }}>
          <GitCompare size={16} /> Vergleichen ({compareList.length}/3)
        </button>
      )}

      <Suspense fallback={<Loader />}>
        {modal && <CardModal card={modal.card} initialTab={modal.tab} onClose={() => setModal(null)} />}
        {showCompare && <CompareModal onClose={() => setShowCompare(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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
