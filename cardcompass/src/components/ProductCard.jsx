import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Bell } from 'lucide-react';
import { useState } from 'react';
import { ProductImage } from './ProductVisual.jsx';
import { useCart } from '../lib/cart.jsx';
import { useTilt } from '../lib/hooks.js';
import { money, pct } from '../lib/format.js';
import { defaultVariant, minPrice, isAvailable, lowStock, isNew, totalAvailable } from '../lib/catalog.js';
import { productPath } from '../lib/routes.js';

export default function ProductCard({ product, index = 0 }) {
  const tilt = useTilt(9);
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const v = defaultVariant(product);
  const available = isAvailable(product);
  const from = product.variants.length > 1 && new Set(product.variants.map((x) => x.price_cents)).size > 1;
  const price = from ? minPrice(product) : v?.price_cents;
  const was = v?.compare_at_price_cents;
  const off = pct(v?.price_cents, was);

  const quickAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!available) return;
    const variant = product.variants.find((x) => x.available > 0) || v;
    add(product, variant, 1, { from: e.currentTarget.getBoundingClientRect() });
    setAdded(true); setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link to={productPath(product.slug)} className={`pcard ${available ? '' : 'is-out'}`} style={{ '--i': index }}>
      <div className="pcard-media" ref={tilt}>
        <div className="pcard-stage">
          <ProductImage product={product} className="pcard-img" />
        </div>
        <div className="pcard-shine" aria-hidden="true" />
        <div className="pcard-badges">
          {off > 0 && <span className="badge badge-sale">−{off} %</span>}
          {isNew(product) && <span className="badge badge-violet">Neu</span>}
          {!available && <span className="badge badge-off">Ausverkauft</span>}
          {available && lowStock(product) && <span className="badge badge-warn">Nur noch {totalAvailable(product)}</span>}
        </div>
        <button
          type="button"
          className={`pcard-quick ${added ? 'is-added' : ''}`}
          onClick={quickAdd}
          disabled={!available}
          aria-label={available ? `${product.name} in den Warenkorb` : 'Ausverkauft'}
          title={available ? 'In den Warenkorb' : 'Ausverkauft'}
        >
          {added ? <Check size={18} strokeWidth={2.6} /> : available ? <ShoppingBag size={18} /> : <Bell size={17} />}
        </button>
      </div>
      <div className="pcard-body">
        <div className="pcard-meta">{product.franchise?.name || product.product_type?.name || 'Zubehör'}</div>
        <h3 className="pcard-title">{product.name}</h3>
        <div className="pcard-foot">
          <div className="pcard-price">
            {from && <span className="pcard-from">ab</span>}
            <strong>{money(price)}</strong>
            {!from && was && was > (v?.price_cents || 0) && <s>{money(was)}</s>}
          </div>
          <span className={`pcard-stock ${available ? 'ok' : 'off'}`}>{available ? 'Lieferbar' : 'Ausverkauft'}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="pcard pcard-skel" aria-hidden="true">
      <div className="pcard-media skeleton" />
      <div className="pcard-body"><div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} /><div className="skeleton" style={{ height: 18, width: '85%', borderRadius: 6, marginTop: 10 }} /><div className="skeleton" style={{ height: 22, width: '35%', borderRadius: 6, marginTop: 16 }} /></div>
    </div>
  );
}
