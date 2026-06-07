import { ITEMS, SHOP_STOCK } from '../data/items.js';

export default function ShopScreen({ npc, bag, money, onBuy, onClose }) {
  const stock = (npc?.stock || SHOP_STOCK).map((id) => ({ id, ...ITEMS[id] })).filter((it) => it.name);

  return (
    <div className="overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="title-big" style={{ fontSize: 14 }}>🛒 Shop</span>
        <button className="btn" onClick={onClose}>✕</button>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="small">Dein Geld</span>
        <span className="small" style={{ color: 'var(--accent)' }}>💰 {money} ₽</span>
      </div>

      {stock.map((it) => {
        const owned = bag[it.id] || 0;
        const afford = money >= it.price;
        return (
          <div key={it.id} className="row" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>{it.icon}</span>
            <div style={{ flex: 1 }}>
              <div className="small">{it.name} {owned > 0 && <span className="tiny">(hast {owned})</span>}</div>
              <div className="tiny">{it.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="tiny" style={{ color: afford ? 'var(--ink)' : 'var(--danger)' }}>{it.price} ₽</div>
              <button className="btn good" style={{ padding: '4px 8px', marginTop: 2 }}
                disabled={!afford} onClick={() => onBuy(it.id)}>Kaufen</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
