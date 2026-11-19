// Shopping cart: React context + localStorage persistence.
// Line = { variantId, productId, slug, name, variantTitle, priceCents,
//          compareAtCents, qty, max, visual, image }
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from './format.js';

const KEY = 'cc_cart_v1';
const MAX_PER_LINE = 20;
const CartCtx = createContext(null);

const load = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};

export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);
  const [open, setOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const bumpRef = useRef(0);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage full/blocked */ } }, [lines]);
  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setLines(load()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product, variant, qty = 1, { openDrawer = true, from } = {}) => {
    if (!product || !variant) return;
    const max = Math.min(MAX_PER_LINE, Math.max(0, variant.available ?? MAX_PER_LINE));
    if (max <= 0) return;
    setLines((prev) => {
      const i = prev.findIndex((l) => l.variantId === variant.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: clamp(next[i].qty + qty, 1, max), max, priceCents: variant.price_cents };
        return next;
      }
      return [...prev, {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantTitle: product.variants.length > 1 ? variant.title : '',
        priceCents: variant.price_cents,
        compareAtCents: variant.compare_at_price_cents || null,
        qty: clamp(qty, 1, max),
        max,
        visual: product.visual,
        image: product.images?.[0]?.url || null,
      }];
    });
    bumpRef.current += 1;
    setLastAdded({ id: variant.id, n: bumpRef.current, from });
    if (openDrawer) setOpen(true);
  }, []);

  const setQty = useCallback((variantId, qty) => {
    setLines((prev) => prev.flatMap((l) => (l.variantId !== variantId ? [l] : qty <= 0 ? [] : [{ ...l, qty: clamp(qty, 1, l.max || MAX_PER_LINE) }])));
  }, []);
  const remove = useCallback((variantId) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = lines.reduce((s, l) => s + l.qty * l.priceCents, 0);
    const savings = lines.reduce((s, l) => s + (l.compareAtCents && l.compareAtCents > l.priceCents ? (l.compareAtCents - l.priceCents) * l.qty : 0), 0);
    return { lines, count, subtotal, savings, add, setQty, remove, clear, open, setOpen, lastAdded };
  }, [lines, add, setQty, remove, clear, open, lastAdded]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart outside CartProvider');
  return ctx;
};
