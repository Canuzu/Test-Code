import { useMemo, useState } from 'react';
import { Bell, BellOff, Search, Trash2, Plus } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { fmtEur, fmtRelative } from '../lib/format.js';
import { newRule, ruleHit, canNotify, notifyPermission, requestNotifyPermission } from '../lib/alerts.js';
import { fold } from '../lib/localize.js';
import { CardImage, EmptyState } from './ui.jsx';

export default function AlertsView({ locked, onUpgrade }) {
  const { cards, alerts, alertLog, addAlert, removeAlert, toggleAlert, updateAlert, clearAlertLog, showToast } = useStore();
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState(null);
  const [dir, setDir] = useState('above');
  const [target, setTarget] = useState('');
  const [perm, setPerm] = useState(notifyPermission());
  const [selected, setSelected] = useState(() => new Set()); // multi-select (alert ids)

  // ---- multi-select (#19) ----
  const toggleSel = (id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allSel = alerts.length > 0 && alerts.every((a) => selected.has(a.id));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(alerts.map((a) => a.id)));
  const bulkRemove = () => { if (selected.size && window.confirm(`${selected.size} Alert(s) löschen?`)) { [...selected].forEach((id) => removeAlert(id)); setSelected(new Set()); } };
  const bulkSetActive = (active) => { alerts.filter((a) => selected.has(a.id) && a.active !== active).forEach((a) => toggleAlert(a.id)); };

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const suggestions = useMemo(() => {
    const q = fold(search);
    if (!q) return [];
    return cards.filter((c) => (c.searchText || fold(`${c.name} ${c.nameEn || ''} ${c.baseName || ''} ${c.set || ''}`)).includes(q)).slice(0, 6);
  }, [search, cards]);

  if (locked) {
    return <EmptyState icon="🔒" title="Preis-Alerts sind ein Pro-Feature" hint="Lass dich benachrichtigen, sobald eine Karte über/unter deinen Wunschpreis kommt.">
      <button className="btn-primary" onClick={onUpgrade}>Pro freischalten</button>
    </EmptyState>;
  }

  const pick = (c) => { setPicked(c); setSearch(c.name); setTarget(String(Math.round((c.m.market || 0) * (dir === 'above' ? 1.2 : 0.8)))); };
  const create = () => {
    if (!picked) { showToast('Bitte zuerst eine Karte wählen'); return; }
    const t = Number(target);
    if (!t) { showToast('Bitte einen Zielpreis eingeben'); return; }
    addAlert(newRule({ cardId: picked.id, name: picked.name, direction: dir, target: t }));
    setPicked(null); setSearch(''); setTarget('');
  };

  const enableNotify = async () => { setPerm(await requestNotifyPermission()); };

  return (
    <div className="fade-in">
      {/* Notification permission */}
      {canNotify() && perm !== 'granted' && (
        <div style={{ background: '#448aff12', border: '1px solid #448aff35', borderRadius: 10, padding: '11px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Bell size={16} style={{ color: C.blue, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12.5, color: C.textSoft }}>Erlaube Browser-Benachrichtigungen, damit Alerts dich auch als Hinweis erreichen (am besten als installierte App).</span>
          <button className="btn-primary" onClick={enableNotify} style={{ fontSize: 12, padding: '7px 12px' }}>Aktivieren</button>
        </div>
      )}

      {/* Create alert */}
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔔 Neuen Alarm anlegen</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.textFaint }} />
            <input className="control" value={search} onChange={(e) => { setSearch(e.target.value); setPicked(null); }} placeholder="Karte suchen…" style={{ width: '100%', padding: '9px 10px 9px 32px' }} />
            {!picked && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 4, background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px #00000050' }}>
                {suggestions.map((c) => (
                  <button key={c.id} onClick={() => pick(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: `1px solid ${C.line}`, background: 'transparent', color: C.text, cursor: 'pointer' }}>
                    <CardImage card={c} height={34} radius={3} />
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div><div style={{ fontSize: 10.5, color: C.textFaint }}>{c.set}</div></div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{fmtEur(c.m.market)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select className="control" value={dir} onChange={(e) => setDir(e.target.value)}>
            <option value="above">steigt über</option>
            <option value="below">fällt unter</option>
          </select>
          <input className="control" type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="€" style={{ width: 110 }} />
          <button className="btn-primary" onClick={create} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Anlegen</button>
        </div>
      </div>

      {/* Multi-select bulk bar (#19) */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, fontSize: 12 }}>
          <button onClick={toggleAll} className="control" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${allSel ? C.gold : C.lineStrong}`, background: allSel ? C.gold : 'transparent', color: '#0c0c1a', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{allSel ? '✓' : ''}</span>
            {allSel ? 'Auswahl aufheben' : 'Alle auswählen'}
          </button>
          {selected.size > 0 && (
            <>
              <span style={{ color: C.textSoft, fontWeight: 700 }}>{selected.size} ausgewählt</span>
              <button onClick={() => bulkSetActive(true)} className="control">Aktivieren</button>
              <button onClick={() => bulkSetActive(false)} className="control">Pausieren</button>
              <button onClick={bulkRemove} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #ff525240', background: '#ff525212', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Trash2 size={13} /> Löschen</button>
            </>
          )}
        </div>
      )}

      {/* Active alerts */}
      {alerts.length === 0 ? (
        <EmptyState icon={<Bell size={52} style={{ opacity: 0.35 }} />} title="Noch keine Alerts" hint="Lege oben einen Alarm an, z. B.: Glurak ex steigt über 200 €." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 10, marginBottom: 24 }}>
          {alerts.map((a) => {
            const card = cardById.get(a.cardId);
            const price = card?.m?.market;
            const hit = ruleHit(a, price);
            return (
              <div key={a.id} style={{ background: C.surface, border: `1px solid ${selected.has(a.id) ? C.gold : hit && a.active ? C.green + '55' : C.line}`, boxShadow: selected.has(a.id) ? `0 0 0 1px ${C.gold}55` : undefined, borderRadius: 12, padding: 12, opacity: a.active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button onClick={() => toggleSel(a.id)} title={selected.has(a.id) ? 'Abwählen' : 'Auswählen'} style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: selected.has(a.id) ? C.gold : 'transparent', color: selected.has(a.id) ? '#0c0c1a' : C.textFaint, border: `1px solid ${selected.has(a.id) ? C.gold : C.lineStrong}` }}>{selected.has(a.id) ? '✓' : ''}</button>
                  {card && <CardImage card={card} height={48} radius={4} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                      {a.direction === 'above' ? '↑ über' : '↓ unter'}{' '}
                      <input type="number" step="0.01" defaultValue={a.target} onBlur={(e) => updateAlert(a.id, { target: e.target.value })}
                        style={{ width: 70, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 5, padding: '2px 5px', color: C.text, fontSize: 11, outline: 'none' }} /> €
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      aktuell <strong style={{ color: hit ? C.green : C.text }}>{fmtEur(price)}</strong>
                      {hit && a.active && <span style={{ color: C.green, fontWeight: 700 }}> · ausgelöst ✓</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => toggleAlert(a.id)} title={a.active ? 'Pausieren' : 'Aktivieren'} style={{ padding: 6, borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: a.active ? C.gold : C.textFaint, cursor: 'pointer', display: 'flex' }}>
                      {a.active ? <Bell size={13} /> : <BellOff size={13} />}
                    </button>
                    <button onClick={() => removeAlert(a.id)} title="Löschen" style={{ padding: 6, borderRadius: 6, border: '1px solid #ff525230', background: '#ff525210', color: C.red, cursor: 'pointer', display: 'flex' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trigger log */}
      {alertLog.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📜 Ausgelöste Alerts</div>
            <button onClick={clearAlertLog} style={{ fontSize: 11, color: C.textFaint, background: 'none', border: 'none', cursor: 'pointer' }}>Verlauf leeren</button>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
            {alertLog.slice(0, 40).map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < Math.min(alertLog.length, 40) - 1 ? `1px solid ${C.line}` : 'none', fontSize: 12 }}>
                <span style={{ fontSize: 14 }}>{e.direction === 'above' ? '🟢' : '🔴'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                  <div style={{ fontSize: 10.5, color: C.textFaint }}>{e.direction === 'above' ? 'über' : 'unter'} {fmtEur(e.target)} · {fmtRelative(e.at)}</div>
                </div>
                <strong style={{ color: e.direction === 'above' ? C.green : C.red }}>{fmtEur(e.price)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10.5, color: C.textGhost, textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
        Alerts werden bei jeder Preisaktualisierung (täglich) und beim Öffnen der App geprüft: in-app + Browser-Push.
        Echte <strong>E-Mail-Benachrichtigungen</strong> brauchen ein Backend — die Architektur dafür steht.
      </div>
    </div>
  );
}
