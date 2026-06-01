import { X, Check, Crown } from 'lucide-react';
import { C } from '../lib/theme.js';
import { ALL_FEATURES } from '../lib/pro.js';

// "Pro" screen. There is no payment backend yet, so rather than advertise a
// price that can't be charged, this screen honestly states that every feature is
// free right now. (When real billing is added, this becomes the upgrade screen
// again — the feature list is already here.)
export default function PricingModal({ onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(8px)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 520, width: '100%', maxHeight: '92vh', overflow: 'auto', padding: 24, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.gold}, #ff9500)`, marginBottom: 12 }}>
            <Crown size={26} style={{ color: '#0c0c1a' }} />
          </div>
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
      </div>
    </div>
  );
}
