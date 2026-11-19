import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag, Truck, ArrowRight, Lock } from 'lucide-react';
import { useCart } from '../lib/cart.jsx';
import { ProductImage } from './ProductVisual.jsx';
import { money } from '../lib/format.js';
import { getShippingRates, shippingFor } from '../lib/catalog.js';
import { R, productPath } from '../lib/routes.js';

// Free-shipping progress bar, shared by drawer and cart page.
export function FreeShippingMeter({ subtotal, rates }) {
  const s = shippingFor(subtotal, rates);
  if (s.freeFrom == null || subtotal === 0) return null;
  const pctDone = Math.min(100, Math.round((subtotal / s.freeFrom) * 100));
  return (
    <div className={`fsm ${s.free ? 'is-done' : ''}`}>
      <div className="fsm-text"><Truck size={16} />{s.free ? <span><strong>Gratisversand</strong> ist freigeschaltet!</span> : <span>Noch <strong>{money(s.freeFrom - subtotal)}</strong> bis zum Gratisversand</span>}</div>
      <div className="fsm-bar"><span style={{ width: `${pctDone}%` }} /></div>
    </div>
  );
}

export function CartLine({ line, compact = false }) {
  const { setQty, remove, setOpen } = useCart();
  return (
    <div className={`cline ${compact ? 'is-compact' : ''}`}>
      <Link to={productPath(line.slug)} className="cline-img" onClick={() => setOpen(false)}>
        <ProductImage product={{ name: line.name, visual: line.visual, images: line.image ? [{ url: line.image }] : [] }} />
      </Link>
      <div className="cline-body">
        <Link to={productPath(line.slug)} className="cline-name" onClick={() => setOpen(false)}>{line.name}</Link>
        {line.variantTitle && <div className="cline-var">{line.variantTitle}</div>}
        <div className="cline-row">
          <div className="qty" role="group" aria-label="Menge">
            <button type="button" onClick={() => setQty(line.variantId, line.qty - 1)} aria-label="Weniger">{line.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}</button>
            <span aria-live="polite">{line.qty}</span>
            <button type="button" onClick={() => setQty(line.variantId, line.qty + 1)} disabled={line.qty >= line.max} aria-label="Mehr"><Plus size={14} /></button>
          </div>
          <strong className="cline-price">{money(line.priceCents * line.qty)}</strong>
        </div>
        {line.qty >= line.max && <div className="cline-note">Maximal verfügbare Menge im Warenkorb</div>}
      </div>
      {!compact && <button type="button" className="cline-remove" onClick={() => remove(line.variantId)} aria-label={`${line.name} entfernen`}><X size={16} /></button>}
    </div>
  );
}

export default function CartDrawer() {
  const { open, setOpen, lines, count, subtotal } = useCart();
  const [rates, setRates] = useState(null);
  const nav = useNavigate();
  useEffect(() => { getShippingRates().then(setRates).catch(() => {}); }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, setOpen]);

  const ship = shippingFor(subtotal, rates);
  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="drawer-back" onClick={() => setOpen(false)} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="Warenkorb">
        <div className="drawer-head">
          <h2 className="h3">Warenkorb <span className="muted" style={{ fontWeight: 600 }}>({count})</span></h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Warenkorb schließen"><X size={20} /></button>
        </div>
        {lines.length === 0 ? (
          <div className="drawer-empty">
            <div className="empty-ic"><ShoppingBag size={34} /></div>
            <h3 className="h3">Dein Warenkorb ist leer</h3>
            <p className="muted">Entdecke Displays, Booster und Zubehör – deine nächste Karte wartet schon.</p>
            <button className="btn btn-primary" onClick={() => { setOpen(false); nav(R.shop); }}>Zum Shop <ArrowRight size={17} /></button>
          </div>
        ) : (
          <>
            <FreeShippingMeter subtotal={subtotal} rates={rates} />
            <div className="drawer-lines">{lines.map((l) => <CartLine key={l.variantId} line={l} />)}</div>
            <div className="drawer-foot">
              <div className="sumrow"><span>Zwischensumme</span><strong>{money(subtotal)}</strong></div>
              <div className="sumrow muted"><span>Versand</span><span>{ship.cents === 0 ? 'kostenlos' : money(ship.cents)}</span></div>
              <button className="btn btn-primary btn-lg btn-block" onClick={() => { setOpen(false); nav(R.checkout); }}><Lock size={17} /> Zur Kasse · {money(subtotal + ship.cents)}</button>
              <button className="btn btn-ghost btn-block" onClick={() => { setOpen(false); nav(R.cart); }}>Warenkorb ansehen</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
