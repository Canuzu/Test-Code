import { useState } from 'react';
import { useDialog } from '../lib/useDialog.js';
import { X, Check, Crown } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { ALL_FEATURES, PRO_FEATURES } from '../lib/pro.js';
import { startCheckout, openPortal, priceLabel } from '../lib/billing.js';

// Two faces:
//   • billing OFF (no Stripe price configured) → honest "everything free" screen.
//   • billing ON  → real subscription: Stripe Checkout / Customer Portal.
export default function PricingModal({ onClose }) {
  const dialogRef = useDialog(onClose);
  const { pro, billingEnabled, account } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const go = async (fn) => {
    setErr(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(e?.message || 'Etwas ist schiefgelaufen. Bitte später erneut.'); setBusy(false); }
    // on success the call redirects to Stripe, so we leave busy=true.
  };

  const Shell = ({ children, maxWidth = 520 }) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(8px)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label="Preise und Pro" onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth, width: '100%', maxHeight: '92vh', overflow: 'auto', padding: 24, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        {children}
      </div>
    </div>
  );

  const crown = (
    <div style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.gold}, #ff9500)`, marginBottom: 12 }}>
      <Crown size={26} style={{ color: '#0c0c1a' }} />
    </div>
  );

  // ---- Billing OFF: everything is free -----------------------------------
  if (!billingEnabled) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {crown}
          <div style={{ fontSize: 22, fontWeight: 800 }}>Alle Funktionen kostenlos</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 6, lineHeight: 1.5 }}>
            Es gibt aktuell <strong style={{ color: C.textSoft }}>kein Abo</strong> – jede Funktion ist für alle frei nutzbar. Kein Konto-Zwang, keine Zahlung.
          </div>
        </div>
        <div style={{ background: C.bg1, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          {ALL_FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: C.textSoft, marginBottom: 9 }}>
              <Check size={15} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} /> {f}
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={onClose} style={{ width: '100%', padding: 11 }}>Los geht's</button>
        <div style={{ fontSize: 10.5, color: C.textGhost, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          Sollte später ein kostenpflichtiger Händler-Tarif kommen, wird er hier klar ausgewiesen – mit echtem, sicherem Bezahlvorgang.
        </div>
      </Shell>
    );
  }

  // ---- Billing ON: real subscription -------------------------------------
  return (
    <Shell>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        {crown}
        <div style={{ fontSize: 22, fontWeight: 800 }}>Cartograph Pro</div>
        <div style={{ fontSize: 13, color: C.textDim, marginTop: 6, lineHeight: 1.5 }}>
          Händler-Werkzeuge freischalten – jederzeit kündbar.
        </div>
        {priceLabel && <div style={{ fontSize: 26, fontWeight: 800, color: C.gold, marginTop: 10 }}>{priceLabel}</div>}
      </div>

      <div style={{ background: C.bg1, border: `1px solid ${C.gold}44`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: C.textSoft, marginBottom: 9 }}>
          <Check size={15} style={{ color: C.gold, flexShrink: 0, marginTop: 1 }} /> Alles aus Kostenlos
        </div>
        {Object.values(PRO_FEATURES).map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: C.textSoft, marginBottom: 9 }}>
            <Check size={15} style={{ color: C.gold, flexShrink: 0, marginTop: 1 }} /> {f}
          </div>
        ))}
      </div>

      {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 10, textAlign: 'center' }}>{err}</div>}

      {pro ? (
        <>
          <div style={{ textAlign: 'center', fontSize: 13, color: C.green, fontWeight: 700, marginBottom: 10 }}>👑 Du bist Pro – danke!</div>
          <button className="control" disabled={busy} onClick={() => go(openPortal)} style={{ width: '100%', padding: 11 }}>
            {busy ? '…' : 'Abo verwalten / kündigen'}
          </button>
        </>
      ) : !account ? (
        <div style={{ textAlign: 'center', fontSize: 12.5, color: C.textSoft, background: C.bg1, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
          Zum Abonnieren bitte zuerst <strong>anmelden</strong> (Konto-Symbol oben rechts).
        </div>
      ) : (
        <button className="btn-primary" disabled={busy} onClick={() => go(startCheckout)} style={{ width: '100%', padding: 12 }}>
          {busy ? '…' : 'Pro abonnieren'}
        </button>
      )}

      <div style={{ fontSize: 10.5, color: C.textGhost, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
        Sichere Zahlung über <strong>Stripe</strong>. Es werden keine Kartendaten auf dieser Seite gespeichert.
      </div>
    </Shell>
  );
}
