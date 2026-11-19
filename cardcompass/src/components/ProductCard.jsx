import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { ProductImage } from './ProductVisual.jsx';
import { useCart } from '../lib/cart.jsx';
import { money, pct } from '../lib/format.js';
import { defaultVariant, minPrice, isAvailable, lowStock, isNew, totalAvailable } from '../lib/catalog.js';
import { productPath } from '../lib/routes.js';

// Uniform product tile: fixed image stage (4:5), title clamped to exactly two
// lines, one price/stock row. Every tile in a row has the same height.
export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const v = defaultVariant(product);
  const available = isAvailable(product);
  const from = product.variants.length > 1 && new Set(product.variants.map((x) => x.price_cents)).size > 1;
  const price = from ? minPrice(product) : v?.price_cents;
  const was = !from ? v?.compare_at_price_cents : null;
  const off = pct(v?.price_cents, was);
  const n = totalAvailable(product);

  const quickAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!available) return;
    const variant = product.variants.find((x) => x.available > 0) || v;
    add(product, variant, 1);
    setAdded(true); setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link to={productPath(product.slug)} className={`pcard ${available ? '' : 'is-out'}`}>
      <div className="pcard-media">
        <ProductImage product={product} className="pcard-img" />
        <div className="pcard-badges">
          {!available ? <span className="badge badge-off">Ausverkauft</span> : (
            <>
              {isNew(product) && <span className="badge badge-violet">Neu</span>}
              {off > 0 && <span className="badge badge-sale">−{off} %</span>}
            </>
          )}
        </div>
        {available && (
          <button type="button" className={`pcard-add ${added ? 'is-added' : ''}`} onClick={quickAdd} aria-label={`${product.name} in den Warenkorb`}>
            {added ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
            <span>{added ? 'Hinzugefügt' : 'In den Warenkorb'}</span>
          </button>
        )}
      </div>
      <div className="pcard-body">
        <div className="pcard-meta">{product.franchise?.name || product.product_type?.name || 'Zubehör'}</div>
        <h3 className="pcard-title">{product.name}</h3>
        <div className="pcard-foot">
          <div className="pcard-price">
            {from && <span className="pcard-from">ab</span>}
            <strong>{money(price)}</strong>
            {was && was > (v?.price_cents || 0) && <s>{money(was)}</s>}
          </div>
          <span className={`pcard-stock ${!available ? 'off' : lowStock(product) ? 'low' : 'ok'}`}>
            {!available ? 'Ausverkauft' : lowStock(product) ? `Nur noch ${n}` : 'Lieferbar'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="pcard pcard-skel" aria-hidden="true">
      <div className="pcard-media skeleton" />
      <div className="pcard-body">
        <div className="skeleton" style={{ height: 11, width: '38%' }} />
        <div className="skeleton" style={{ height: 16, width: '88%', marginTop: 10 }} />
        <div className="skeleton" style={{ height: 16, width: '60%', marginTop: 6 }} />
        <div className="skeleton" style={{ height: 18, width: '34%', marginTop: 16 }} />
      </div>
    </div>
  );
}
