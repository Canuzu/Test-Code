import { useState } from 'react';
import { X, Check, Crown } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { PLANS, isPro } from '../lib/pro.js';

export default function PricingModal({ onClose }) {
  const { settings, updateSettings, showToast } = useStore();
  const [annual, setAnnual] = useState(true);
  const pro = isPro(settings);

  const activate = () => { updateSettings({ pro: true }); showToast('👑 Pro aktiviert (Demo)'); };
  const deactivate = () => { updateSettings({ pro: false }); showToast('Pro deaktiviert'); };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(8px)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 720, width: '100%', maxHeight: '92vh', overflow: 'auto', padding: 24, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 21, fontWeight: 800 }}>Wähle deinen Plan</div>
          <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 4 }}>Vom Sammler bis zum Laden – schalte Händler-Werkzeuge frei.</div>
          <div style={{ display: 'inline-flex', gap: 4, marginTop: 14, background: C.bg2, border: `1px solid ${C.lineStrong}`, borderRadius: 20, padding: 3 }}>
            {[['monthly', 'Monatlich'], ['annual', 'Jährlich −21 %']].map(([k, lbl]) => (
              <button key={k} onClick={() => setAnnual(k === 'annual')} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: (annual === (k === 'annual')) ? '#ffd70022' : 'transparent', color: (annual === (k === 'annual')) ? C.gold : C.textFaint }}>{lbl}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {PLANS.map((plan) => {
            const isProPlan = plan.id === 'pro';
            const price = annual ? plan.annual : plan.monthly;
            const active = (plan.id === 'pro') === pro;
            return (
              <div key={plan.id} style={{ background: C.bg1, border: `1.5px solid ${isProPlan ? C.gold : C.line}`, borderRadius: 14, padding: 18, position: 'relative', boxShadow: isProPlan ? `0 0 24px ${C.gold}22` : 'none' }}>
                {plan.badge && <div style={{ position: 'absolute', top: -10, right: 16, background: 'linear-gradient(90deg,#ffd700,#ff9500)', color: '#0c0c1a', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>{plan.badge}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isProPlan && <Crown size={18} style={{ color: C.gold }} />}
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{plan.name}</div>
                </div>
                <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 10 }}>{plan.tagline}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 800 }}>{price === 0 ? '0 €' : `${price} €`}</span>
                  <span style={{ fontSize: 12, color: C.textFaint }}>{price === 0 ? '' : '/ Monat'}</span>
                </div>
                {isProPlan && annual && <div style={{ fontSize: 10.5, color: C.green2, marginBottom: 10 }}>jährlich abgerechnet ({plan.annual * 12} €)</div>}

                <div style={{ margin: '12px 0' }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: C.textSoft, marginBottom: 7 }}>
                      <Check size={14} style={{ color: isProPlan ? C.gold : C.green, flexShrink: 0, marginTop: 1 }} /> {f}
                    </div>
                  ))}
                </div>

                {plan.id === 'free' ? (
                  <button disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textFaint, fontWeight: 700, fontSize: 13 }}>
                    {pro ? 'Im Pro enthalten' : '✓ Aktueller Plan'}
                  </button>
                ) : pro ? (
                  <button onClick={deactivate} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textSoft, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Pro deaktivieren</button>
                ) : (
                  <button className="btn-primary" onClick={activate} style={{ width: '100%', padding: 10 }}>Pro freischalten</button>
                )}
                {active && isProPlan && <div style={{ textAlign: 'center', fontSize: 11, color: C.green, marginTop: 8, fontWeight: 700 }}>👑 aktiv</div>}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 10.5, color: C.textGhost, textAlign: 'center', marginTop: 18, lineHeight: 1.6, borderTop: `1px solid ${C.lineStrong}`, paddingTop: 14 }}>
          Hinweis: Dies ist eine <strong>Demo-Freischaltung</strong> (lokal gespeichert) – es findet keine Zahlung statt.
          Für echtes Abo-Billing wird ein Backend (z. B. Stripe Checkout) angebunden, das nach erfolgreicher Zahlung denselben Pro-Status setzt.
        </div>
      </div>
    </div>
  );
}
