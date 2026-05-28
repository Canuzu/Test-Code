import { X } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { PLATFORM_FEES } from '../lib/fees.js';
import { GAMES } from '../data/providers/index.js';

export default function SettingsModal({ onClose }) {
  const { settings, updateSettings, watchlist, portfolio, tags, showToast } = useStore();
  const label = { fontSize: 11, color: C.textFaint, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', backdropFilter: 'blur(6px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 20, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>⚙️ Einstellungen</div>
        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 20 }}>Wirken sich auf alle Berechnungen aus</div>

        <div style={{ marginBottom: 18 }}>
          <div style={label}>Trading Card Game</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {GAMES.map((g) => (
              <button key={g.id} disabled={!g.enabled}
                onClick={() => { updateSettings({ game: g.id }); showToast(`Spiel: ${g.label}`); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                  border: `1px solid ${settings.game === g.id ? C.gold : C.lineStrong}`,
                  background: settings.game === g.id ? '#ffd70015' : C.bg1,
                  color: g.enabled ? C.text : C.textFaint, cursor: g.enabled ? 'pointer' : 'not-allowed', opacity: g.enabled ? 1 : 0.6,
                }}>
                <span style={{ fontSize: 16 }}>{g.emoji}</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{g.label}</div>
                  <div style={{ fontSize: 9.5, color: C.textFaint }}>{g.enabled ? 'aktiv' : 'kommt bald'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={label}>pokemontcg.io API-Key (optional)</div>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            placeholder="Ohne Key: funktioniert mit niedrigerem Limit"
            style={{ width: '100%', background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: '9px 12px', color: C.text, fontSize: 12.5, outline: 'none' }}
          />
          <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 6 }}>
            Kostenlos auf pokemontcg.io/dashboard. Wird nur lokal in deinem Browser gespeichert und hebt das Anfragelimit an.
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={label}>Standard-Plattform für Netto-Gewinn</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(PLATFORM_FEES).map(([key, p]) => (
              <button key={key} onClick={() => { updateSettings({ platform: key }); showToast(`Plattform: ${p.label}`); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                  border: `1px solid ${settings.platform === key ? p.color : C.lineStrong}`, background: settings.platform === key ? `${p.color}15` : C.bg1, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: settings.platform === key ? p.color : '#dcdcec' }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: C.textFaint }}>{(p.commission * 100).toFixed(2)} % Provision · €{p.shipping} Versand</div>
                </div>
                {settings.platform === key && <span style={{ color: p.color, fontWeight: 700 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: C.bg1, borderRadius: 8, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Versandkosten einrechnen</div>
            <div style={{ fontSize: 10, color: C.textFaint }}>Reduziert den Netto-Gewinn um den Versand</div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.includeShipping} onChange={(e) => updateSettings({ includeShipping: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', inset: 0, background: settings.includeShipping ? C.gold : C.lineStrong, borderRadius: 20, transition: '0.2s' }}>
              <span style={{ position: 'absolute', height: 16, width: 16, left: settings.includeShipping ? 21 : 3, bottom: 3, background: '#0c0c1a', borderRadius: '50%', transition: '0.2s' }} />
            </span>
          </label>
        </div>

        <div style={{ fontSize: 10, color: C.textGhost, textAlign: 'center', borderTop: `1px solid ${C.lineStrong}`, paddingTop: 12 }}>
          Watchlist: {watchlist.length} · Sammlung: {portfolio.length} · Tags: {Object.keys(tags).length} Karten
        </div>
      </div>
    </div>
  );
}
