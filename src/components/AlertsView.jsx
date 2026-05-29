import { useState } from 'react';
import { Bell, BellOff, Trash2, Plus, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur, fmtDate } from '../lib/format.js';
import { EmptyState } from './ui.jsx';

export default function AlertsView() {
  const { cards, alerts, addAlert, removeAlert, requestNotificationPermission } = useStore();
  const [search, setSearch] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState('above');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const notifStatus = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

  const filtered = cards
    .filter((c) => search.length >= 2 && c.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const handleAdd = () => {
    if (!selectedCard || !targetPrice) return;
    addAlert({
      cardId: selectedCard.id,
      cardName: selectedCard.name,
      cardSet: selectedCard.set,
      direction,
      targetPrice: parseFloat(targetPrice),
      currentPrice: selectedCard.m.market,
    });
    setSelectedCard(null);
    setTargetPrice('');
    setSearch('');
    setShowForm(false);
  };

  const active = alerts.filter((a) => !a.triggered);
  const triggered = alerts.filter((a) => a.triggered);

  return (
    <div className="fade-in">
      {/* Notification permission banner */}
      {notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
        <div style={{ background: '#ffd70012', border: `1px solid ${C.gold}30`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={16} style={{ color: C.gold, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12, color: C.textSoft }}>
            <strong style={{ color: C.gold }}>Browser-Benachrichtigungen</strong> aktivieren, damit Alerts auch angezeigt werden, wenn die App nicht im Vordergrund ist.
          </div>
          <button onClick={requestNotificationPermission}
            style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.gold}50`, background: `${C.gold}20`, color: C.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Aktivieren
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.textFaint }}>
          <strong style={{ color: C.text }}>{active.length}</strong> aktive · <strong style={{ color: C.text }}>{triggered.length}</strong> ausgelöst
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid #448aff40`, background: '#448aff15', color: '#448aff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={13} /> Neuer Alert
        </button>
      </div>

      {/* Add alert form */}
      {showForm && (
        <div className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12 }}>🔔 Alert erstellen</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Karte suchen</div>
            <input className="control" placeholder="Kartenname eingeben…" value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedCard(null); }}
              style={{ width: '100%' }} />
            {filtered.length > 0 && !selectedCard && (
              <div style={{ background: C.bg1, border: `1px solid ${C.line}`, borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
                {filtered.map((c) => (
                  <button key={c.id} onClick={() => { setSelectedCard(c); setSearch(c.name); setTargetPrice(String(c.m.market?.toFixed(2) ?? '')); }}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${C.line}`, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: 12, color: C.text }}>{c.name} <span style={{ color: C.textFaint }}>· {c.set}</span></span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{fmtEur(c.m.market)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCard && (
              <div style={{ marginTop: 6, fontSize: 11, color: C.green2 }}>
                ✓ {selectedCard.name} · aktuell {fmtEur(selectedCard.m.market)}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Richtung</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['above', '↑ Über'], ['below', '↓ Unter']].map(([v, l]) => (
                  <button key={v} onClick={() => setDirection(v)}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: `1px solid ${direction === v ? '#448aff' : C.lineStrong}`, background: direction === v ? '#448aff20' : 'transparent', color: direction === v ? '#448aff' : C.textDim, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 4 }}>Zielpreis (€)</div>
              <input type="number" step="0.01" min="0" className="control" value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={!selectedCard || !targetPrice}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: selectedCard && targetPrice ? 'linear-gradient(135deg,#448aff,#6366f1)' : C.bg1, color: selectedCard && targetPrice ? '#fff' : C.textFaint, fontSize: 13, fontWeight: 700, cursor: selectedCard && targetPrice ? 'pointer' : 'default' }}>
              Alert setzen
            </button>
            <button onClick={() => { setShowForm(false); setSearch(''); setSelectedCard(null); }}
              style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textSoft, fontSize: 12, cursor: 'pointer' }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Active alerts */}
      {active.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} /> Aktiv ({active.length})
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
            {active.map((a, i) => (
              <AlertRow key={a.id} alert={a} onRemove={removeAlert} isLast={i === active.length - 1} />
            ))}
          </div>
        </div>
      )}

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={12} style={{ color: C.green2 }} /> Ausgelöst ({triggered.length})
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
            {triggered.map((a, i) => (
              <AlertRow key={a.id} alert={a} onRemove={removeAlert} isLast={i === triggered.length - 1} />
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && !showForm && (
        <EmptyState
          icon={<BellOff size={48} style={{ opacity: 0.3 }} />}
          title="Keine Preisalerts"
          hint="Klicke auf »Neuer Alert«, um benachrichtigt zu werden, wenn eine Karte einen Preis erreicht."
        />
      )}
    </div>
  );
}

function AlertRow({ alert, onRemove, isLast }) {
  const dir = alert.direction === 'above';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: isLast ? 'none' : `1px solid ${C.line}` }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: alert.triggered ? '#00e67615' : '#448aff15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {alert.triggered
          ? <CheckCircle size={15} style={{ color: C.green2 }} />
          : <Bell size={15} style={{ color: '#448aff' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.cardName}</div>
        <div style={{ fontSize: 10.5, color: C.textFaint }}>
          {dir ? '↑ Über' : '↓ Unter'} <strong style={{ color: C.gold }}>{fmtEur(alert.targetPrice)}</strong>
          {alert.currentPrice != null && ` · beim Setzen: ${fmtEur(alert.currentPrice)}`}
          {alert.triggered && alert.triggeredAt && ` · ausgelöst ${fmtDate(alert.triggeredAt)} bei ${fmtEur(alert.triggeredPrice)}`}
        </div>
      </div>
      <button onClick={() => onRemove(alert.id)} title="Alert löschen"
        style={{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6 }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}
