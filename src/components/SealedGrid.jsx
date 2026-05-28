import { ExternalLink } from 'lucide-react';
import { C } from '../lib/theme.js';
import { SEALED } from '../data/sealedProducts.js';
import { EmptyState } from './ui.jsx';

// Sealed products (booster/display/etb). No live price from our data source, so
// each tile links to the current Cardmarket price instead of showing a number.
export default function SealedGrid({ type }) {
  const items = SEALED.filter((p) => p.type === type).sort((a, b) => b.year - a.year);
  if (items.length === 0) return <EmptyState icon="📦" title="Keine Produkte" hint="Für diese Kategorie sind noch keine Produkte hinterlegt." />;

  return (
    <>
      <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 12 }}>
        Versiegelte Produkte · <strong style={{ color: C.textSoft }}>Live-Preis direkt auf Cardmarket</strong> (für Sealed gibt es in unserer Datenquelle keine Preise)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {items.map((p) => (
          <a
            key={p.id}
            href={p.cardmarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover fade-in"
            style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, textDecoration: 'none', color: C.text, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ height: 96, borderRadius: 10, background: `linear-gradient(135deg, ${p.grad[0]}, ${p.grad[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, position: 'relative' }}>
              {p.emoji}
              <span style={{ position: 'absolute', top: 8, right: 8, background: '#00000033', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{p.typeLabel}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{p.set}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{p.typeLabel} · {p.year}</div>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: '#0066cc1f', border: '1px solid #0066cc44', color: C.blue, fontSize: 12, fontWeight: 700 }}>
              <span>🛒 Preis auf Cardmarket</span>
              <ExternalLink size={13} />
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
