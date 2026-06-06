import { ITEMS, SHOP_ITEMS } from '../data/items.js';

export default function Shop({ money, bag, onBuy, onClose }) {
  return (
    <div className="overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="title-big" style={{ fontSize: 14 }}>🛒 Naturladen</span>
        <button className="btn" onClick={onClose}>✕</button>
      </div>
      <div className="tiny">Dein Geld: 💰 {money} Taler</div>

      {SHOP_ITEMS.map((id) => {
        const it = ITEMS[id];
        const owned = bag[id] || 0;
        const can = money >= it.price;
        return (
          <div key={id} className="row">
            <span style={{ fontSize: 20 }}>{it.icon}</span>
            <div style={{ flex: 1 }}>
              <div className="small">{it.name} <span className="tiny">(hast {owned})</span></div>
              <div className="tiny">{it.desc}</div>
            </div>
            <button className="btn primary" disabled={!can} style={{ padding: '6px 10px' }} onClick={() => onBuy(id)}>
              💰 {it.price}
            </button>
          </div>
        );
      })}
    </div>
  );
}
