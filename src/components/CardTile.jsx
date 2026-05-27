import { useStore } from '../store.jsx';
import { C, riskColor, riskLabel, rarityColor, trendColor, trendIcon } from '../lib/theme.js';
import { fmtEur, fmtNum } from '../lib/format.js';
import { sparkSeries } from '../lib/metrics.js';
import { calcNet, PLATFORM_FEES } from '../lib/fees.js';
import { Spark, CardImage, Pill, ChangeBadge, ScoreBadge } from './ui.jsx';

export default function CardTile({ card, onOpen }) {
  const { inWatchlist, inPortfolio, inCompare, toggleWatchlist, toggleCompare, tags, settings } = useStore();
  const m = card.m;
  const listed = inWatchlist(card.id);
  const owned = inPortfolio(card.id);
  const comparing = inCompare(card.id);
  const cardTags = tags[card.id] || [];
  const net = calcNet(m.market, card.prices.low ?? m.market, settings.platform, settings.includeShipping);

  return (
    <div
      className="card-hover fade-in"
      onClick={() => onOpen(card, 'overview')}
      style={{
        background: comparing ? '#1a1f3a' : C.surface,
        border: `1px solid ${comparing ? '#448aff80' : C.line}`,
        borderRadius: 14,
        padding: 14,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: comparing ? '0 0 16px #448aff30' : undefined,
      }}
    >
      <div style={{ position: 'absolute', top: -9, right: 12 }}>
        <ScoreBadge tier={m.tier} score={m.score} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <CardImage card={card} height={132} />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3, paddingRight: 42 }}>{card.name}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
            {card.set}{card.year ? ` · ${card.year}` : ''}{card.number ? ` · Nr. ${card.number}` : ''}
          </div>

          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {card.rarity && <Pill color={rarityColor(card.rarity)}>{card.rarity}</Pill>}
            <Pill color={riskColor(m.risk)}>{riskLabel(m.risk)}</Pill>
            {owned && <Pill color={C.green2}>💼 im Depot</Pill>}
            {cardTags.slice(0, 1).map((t) => <Pill key={t} color={C.purple}>#{t}</Pill>)}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: C.textFaint }}>Marktpreis</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{fmtEur(m.market)}</div>
            </div>
            <Spark series={sparkSeries(card.prices)} />
          </div>
        </div>
      </div>

      {/* Value change row -- the headline feature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 10, padding: '7px 10px', background: '#ffffff06', borderRadius: 8 }}>
        <ChangeBadge value={m.change7} label="7T" />
        <ChangeBadge value={m.change30} label="30T" />
        <span style={{ fontSize: 12, fontWeight: 700, color: trendColor(m.trend) }}>{trendIcon(m.trend)}</span>
      </div>

      {/* Popularity + flip margin */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: C.textFaint }}>⭐ Beliebtheit</span>
            <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>{fmtNum(m.popularity, 1)}/10</span>
          </div>
          <div style={{ height: 4, background: '#ffffff10', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(m.popularity || 0) * 10}%`, background: 'linear-gradient(90deg,#ffd700,#ff6b35)' }} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: C.textFaint }}>Marge ab {fmtEur(card.prices.low)}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: net.netProfit >= 0 ? C.green : C.red }}>
            +{fmtEur(net.netProfit)} netto
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
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
        >{owned ? '📋 Details' : '💼 Kauf'}</button>
      </div>
    </div>
  );
}

const btn = (color, active) => ({
  padding: 7,
  borderRadius: 7,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 10.5,
  background: active ? color + '25' : color + '12',
  color,
  border: `1px solid ${color}${active ? '55' : '28'}`,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
