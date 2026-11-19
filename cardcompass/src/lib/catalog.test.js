import { describe, it, expect } from 'vitest';
import { listProducts, getProduct, getRelated, shippingFor, minPrice, isAvailable, defaultVariant } from './catalog.js';

// Runs against the built-in demo catalogue (no Supabase env in tests).
describe('catalog (demo mode)', () => {
  it('filters by franchise', async () => {
    const list = await listProducts({ franchise: 'pokemon' });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => p.franchise?.slug === 'pokemon')).toBe(true);
  });

  it('a root category includes its children', async () => {
    const all = await listProducts({ category: 'trading-cards' });
    const boosters = await listProducts({ category: 'booster' });
    expect(all.length).toBeGreaterThan(boosters.length);
    expect(boosters.every((b) => all.some((p) => p.id === b.id))).toBe(true);
  });

  it('searches accent-insensitively across name and franchise', async () => {
    const a = await listProducts({ q: 'pokemon display' });
    expect(a.some((p) => p.name === 'Pokémon TCG Booster Display')).toBe(true);
  });

  it('"nur verfügbare" hides sold-out products', async () => {
    const list = await listProducts({ available: true });
    expect(list.every(isAvailable)).toBe(true);
    const all = await listProducts({});
    expect(all.some((p) => !isAvailable(p))).toBe(true);
  });

  it('sorts by price and keeps sold-out items last', async () => {
    const list = await listProducts({ sort: 'price-asc' });
    const inStock = list.filter(isAvailable);
    for (let i = 1; i < inStock.length; i++) expect(minPrice(inStock[i])).toBeGreaterThanOrEqual(minPrice(inStock[i - 1]));
    const firstOut = list.findIndex((p) => !isAvailable(p));
    expect(list.slice(firstOut).every((p) => !isAvailable(p))).toBe(true);
  });

  it('finds a product by slug, its default variant and related items', async () => {
    const [first] = await listProducts({ limit: 1 });
    const p = await getProduct(first.slug);
    expect(p?.id).toBe(first.id);
    expect(defaultVariant(p)?.is_default).toBe(true);
    const rel = await getRelated(p, 4);
    expect(rel).toHaveLength(4);
    expect(rel.some((r) => r.id === p.id)).toBe(false);
  });

  it('shipping is free from the threshold on', () => {
    const rates = [{ name: 'DHL', price_cents: 549, free_from_cents: 10000 }];
    expect(shippingFor(0, rates).cents).toBe(0);
    expect(shippingFor(9999, rates).cents).toBe(549);
    expect(shippingFor(10000, rates)).toMatchObject({ cents: 0, free: true });
  });
});
