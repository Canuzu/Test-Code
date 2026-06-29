import { Receipt } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C, riskColor, riskLabel, rarityColor } from '../lib/theme.js';
import { fmtEur } from '../lib/format.js';
import { CardImage, Pill, ScoreBadge } from './ui.jsx';

// Standard preview tile (shown BEFORE opening a card). Kept deliberately light:
// big artwork + the essentials (score, price, rarity/risk, popularity). The
// price curve, 7T/30T percentages and flip-margin live in the detail modal that
// opens on click — keeping the grid clean and easy to scan.
export default function CardTile({ card, onOpen }) {
  const { inWatchlist, inPortfolio, inCompare, toggleWatchlist, toggleCompare, tags, inBuylist, addToBuylist } = useStore();
  const m = card.m;
  const listed = inWatchlist(card.id);
  const owned = inPortfolio(card.id);
  const comparing = inCompare(card.id);
  const onBuylist = inBuylist(card.id);
  const cardTags = tags[card.id] || [];

  return (
    <div
      className="card-hover fade-in"
      onClick={() => onOpen(card, 'overview')}
      style={{
        background: comparing ? '#1a1f3a' : C.surface,
        border: `1px solid ${comparing ? '#448aff80' : C.line}`,
        borderRadius: 16,
        padding: 16,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: comparing ? '0 0 16px #448aff30' : undefined,
        // Skip rendering tiles that are off-screen → far smoother scrolling on
        // long grids. The intrinsic size keeps the scrollbar stable.
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 360px',
      }}
    >
      <div style={{ position: 'absolute', top: -9, right: 12 }}>
        <ScoreBadge tier={m.tier} score={m.score} />
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); addToBuylist(card); }}
        title={onBuylist ? 'In der Buylist' : 'Zur Buylist hinzufügen'}
        style={{
          position: 'absolute', top: -9, left: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
          background: onBuylist ? C.gold : C.surface2, color: onBuylist ? '#0c0c1a' : C.gold,
          border: `1px solid ${onBuylist ? C.gold : C.lineStrong}`, boxShadow: '0 2px 8px #00000040',
        }}
      >
        <Receipt size={14} />
      </button>

      <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
        <CardImage card={card} height={172} />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.3, paddingRight: 42 }}>{card.name}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>
            {card.set}{card.year ? ` · ${card.year}` : ''}{card.number ? ` · Nr. ${card.number}` : ''}
          </div>

          <div style={{ marginTop: 9, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {card.rarity && <Pill color={rarityColor(card.rarity)}>{card.rarity}</Pill>}
            <Pill color={riskColor(m.risk)}>{riskLabel(m.risk)}</Pill>
            {owned && <Pill color={C.green2}>💼 im Depot</Pill>}
            {cardTags.slice(0, 1).map((t) => <Pill key={t} color={C.purple}>#{t}</Pill>)}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 10 }}>
            {card.prices?.pricePending && m.market == null ? (
              <>
                <div style={{ fontSize: 11, color: C.textFaint }}>Neu erschienen</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, lineHeight: 1.1, paddingTop: 4 }} title="Karte ist neu – der Marktpreis folgt, sobald er auf Cardmarket verfügbar ist.">⏳ Preis folgt</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: C.textFaint }}>{card.prices?.estimated ? 'Marktpreis (geschätzt)' : 'Marktpreis'}</div>
                <div style={{ fontSize: 25, fontWeight: 800, color: C.text, lineHeight: 1.1 }} title={card.prices?.estimated ? 'Transparente Schätzung – echter Tagespreis auf Cardmarket' : undefined}>
                  {card.prices?.estimated && <span style={{ fontSize: 16, color: C.textFaint, fontWeight: 700 }}>≈ </span>}{fmtEur(m.market)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 13 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => toggleWatchlist(card)}
          style={btn(listed ? C.red : C.gold, listed)}
        >{listed ? '✕ Watchlist' : '⭐ Merken'}</button>
        <button
          onClick={() => toggleCompare(card)}
          style={btn(C.blue, comparing)}
        >{comparing ? '✓ Vergleich' : '⚖ Vergleich'}</button>
        <button
          onClick={() => onOpen(card, owned ? 'overview' : 'buy')}
          style={btn(C.green2, false)}
        >{owned ? '📋 Details' : '📦 Sammlung'}</button>
      </div>
    </div>
  );
}

const btn = (color, active) => ({
  padding: 8,
  borderRadius: 7,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 11.5,
  background: active ? color + '25' : color + '12',
  color,
  border: `1px solid ${color}${active ? '55' : '28'}`,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
