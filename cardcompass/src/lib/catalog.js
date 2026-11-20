// Catalogue data access. One API for the whole UI; backed by Supabase when
// configured (same tables/columns the current cardcompass.de uses: cc_products,
// cc_product_variants, cc_inventory, cc_product_images, …) and by the built-in
// demo catalogue otherwise. Every function resolves to plain objects:
//
// Product = { id, slug, name, short_description, description, is_featured,
//   published_at, franchise: {slug,name}|null, product_type: {name}|null,
//   category_slugs: string[], variants: Variant[], images: [{url, alt_text}],
//   attributes: [{key,value}], visual: {kind,c1,c2,label,sub} }
// Variant = { id, sku, title, language, condition, price_cents,
//   compare_at_price_cents, is_default, position, available }
import { LIVE, SHOP, SUPABASE_URL } from './config.js';
import { getSupabase } from './supabase.js';
import * as demo from './demoCatalog.js';
import { logoUrl } from './logos.js';

const PRODUCT_SELECT = `id, slug, name, short_description, description, is_featured, published_at,
  franchise:cc_franchises(slug, name),
  product_type:cc_product_types(name),
  variants:cc_product_variants(id, sku, title, language, condition, price_cents, compare_at_price_cents, is_default, position, inventory:cc_inventory(available)),
  images:cc_product_images(storage_path, alt_text, position),
  attributes:cc_product_attributes(key, value, sort_order),
  categories:cc_product_categories(category:cc_categories(slug))`;

const FR_COLORS = Object.fromEntries(demo.FRANCHISES.map((f) => [f.slug, f]));

// ---- helpers usable by every page ------------------------------------------
export const defaultVariant = (p) => p?.variants?.find((v) => v.is_default) || p?.variants?.[0] || null;
export const minPrice = (p) => Math.min(...(p?.variants || []).map((v) => v.price_cents).filter(Number.isFinite));
export const totalAvailable = (p) => (p?.variants || []).reduce((s, v) => s + Math.max(0, v.available || 0), 0);
export const isAvailable = (p) => totalAvailable(p) > 0;
export const lowStock = (p) => { const n = totalAvailable(p); return n > 0 && n <= 5; };
export const isNew = (p) => p?.published_at && Date.now() - new Date(p.published_at).getTime() < 14 * 86400000;
export const franchiseColors = (slug) => FR_COLORS[slug] || { c1: '#b26bff', c2: '#4c0099', short: 'CardCompass' };

function visualFor(p, cats) {
  const has = (s) => cats.includes(s);
  const kind = has('booster-displays') ? 'display' : has('booster') ? 'booster' : has('starter-decks') ? 'deck'
    : has('boxen-und-kollektionen') ? 'box' : has('tcg-zubehoer') ? 'sleeves' : has('manga') ? 'manga'
      : has('figuren-und-sammlerartikel') ? 'figure' : has('digivice-und-virtual-pets') ? 'digivice'
        : has('gunpla-und-modellbausaetze') ? 'gunpla' : 'box';
  const fc = p.franchise ? franchiseColors(p.franchise.slug) : franchiseColors('');
  return { kind, c1: fc.c1, c2: fc.c2, label: p.franchise?.name || 'CardCompass', sub: p.product_type?.name || '', logo: logoUrl(p.franchise) };
}

const publicImage = (path) => `${SUPABASE_URL}/storage/v1/object/public/product-images/${String(path).replace(/^\/+/, '')}`;

function normalize(row) {
  const variants = (row.variants || []).map((v) => {
    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
    const { inventory, ...rest } = v;
    return { ...rest, available: Math.max(0, inv?.available ?? 0) };
  }).sort((a, b) => Number(b.is_default) - Number(a.is_default) || (a.position ?? 0) - (b.position ?? 0));
  const cats = (row.categories || []).map((c) => c.category?.slug).filter(Boolean);
  const p = {
    ...row,
    variants,
    category_slugs: cats,
    images: [...(row.images || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => ({ url: publicImage(i.storage_path), alt_text: i.alt_text || row.name })),
    attributes: [...(row.attributes || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };
  delete p.categories;
  p.visual = visualFor(p, cats);
  return p;
}

// ---- small in-memory cache so navigating back is instant ---------------------
const cache = new Map();
const cached = (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn().catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key);
};

async function allProducts() {
  if (!LIVE) return demo.PRODUCTS;
  return cached('products', async () => {
    const { data, error } = await getSupabase()
      .from('cc_products').select(PRODUCT_SELECT)
      .not('published_at', 'is', null)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalize);
  });
}

export async function getFranchises() {
  if (!LIVE) return demo.FRANCHISES;
  return cached('franchises', async () => {
    const { data, error } = await getSupabase().from('cc_franchises').select('id, slug, name').order('sort_order');
    if (error) throw error;
    return (data || []).map((f) => ({ ...f, ...franchiseColors(f.slug), short: franchiseColors(f.slug).short || f.name }));
  });
}

export async function getCategories() {
  if (!LIVE) return demo.CATEGORIES;
  return cached('categories', async () => {
    const { data, error } = await getSupabase().from('cc_categories').select('id, slug, name, parent_id').order('sort_order');
    if (error) throw error;
    return data || [];
  });
}

// Category slug + all its children (selecting "Trading Cards" includes Booster etc.).
async function categoryFamily(slug) {
  const cats = await getCategories();
  const root = cats.find((c) => c.slug === slug);
  if (!root) return [slug];
  return [root.slug, ...cats.filter((c) => c.parent_id === root.id).map((c) => c.slug)];
}

const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// listProducts({ franchise, category, q, available, sort, featured, limit })
// sort: 'new' | 'price-asc' | 'price-desc' | 'name'
export async function listProducts(opts = {}) {
  const { franchise, category, q, available, sort = 'new', featured, limit } = opts;
  let list = await allProducts();
  if (franchise) list = list.filter((p) => p.franchise?.slug === franchise);
  if (category) {
    const fam = await categoryFamily(category);
    list = list.filter((p) => p.category_slugs.some((s) => fam.includes(s)));
  }
  if (q && q.trim()) {
    const terms = fold(q).split(/\s+/).filter(Boolean);
    list = list.filter((p) => {
      const hay = fold(`${p.name} ${p.franchise?.name || ''} ${p.product_type?.name || ''} ${p.short_description || ''}`);
      return terms.every((t) => hay.includes(t));
    });
  }
  if (available) list = list.filter(isAvailable);
  if (featured) list = list.filter((p) => p.is_featured);
  const by = {
    new: (a, b) => (b.published_at || '').localeCompare(a.published_at || ''),
    'price-asc': (a, b) => minPrice(a) - minPrice(b),
    'price-desc': (a, b) => minPrice(b) - minPrice(a),
    name: (a, b) => a.name.localeCompare(b.name, 'de'),
  }[sort] || (() => 0);
  list = [...list].sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)) || by(a, b));
  return limit ? list.slice(0, limit) : list;
}

export async function getProduct(slug) {
  const list = await allProducts();
  return list.find((p) => p.slug === slug) || null;
}

export async function getRelated(product, limit = 4) {
  if (!product) return [];
  const list = await allProducts();
  const score = (p) => (p.franchise?.slug === product.franchise?.slug ? 2 : 0) + (p.category_slugs.some((s) => product.category_slugs.includes(s)) ? 1 : 0);
  return list.filter((p) => p.id !== product.id).map((p) => [score(p), p]).sort((a, b) => b[0] - a[0]).slice(0, limit).map(([, p]) => p);
}

// Live-search suggestions for the header.
export async function suggest(q, limit = 6) {
  if (!q || q.trim().length < 2) return [];
  return listProducts({ q, limit });
}

export async function getShippingRates() {
  if (!LIVE) return demo.SHIPPING;
  return cached('shipping', async () => {
    const { data, error } = await getSupabase().from('cc_shipping_rates')
      .select('price_cents, free_from_cents, method:cc_shipping_methods(name, sort_order)').eq('country_code', 'DE');
    if (error) throw error;
    const rates = (data || []).map((r) => ({ name: r.method?.name || 'Versand', price_cents: r.price_cents, free_from_cents: r.free_from_cents, sort: r.method?.sort_order ?? 0 }))
      .sort((a, b) => a.sort - b.sort);
    return rates.length ? rates : SHOP.shipping;
  });
}

export async function getSettings() {
  if (!LIVE) return { smallBusiness: SHOP.smallBusiness };
  return cached('settings', async () => {
    const { data } = await getSupabase().from('cc_settings').select('value').eq('key', 'tax_small_business').maybeSingle();
    const v = data?.value;
    return { smallBusiness: v == null ? SHOP.smallBusiness : (v === true || v === 'true' || v?.enabled === true) };
  });
}

// Shipping cost for a cart subtotal (cheapest rate; free above threshold).
export function shippingFor(subtotalCents, rates) {
  const r = (rates && rates[0]) || SHOP.shipping[0];
  const free = r.free_from_cents != null && subtotalCents >= r.free_from_cents;
  return { name: r.name, cents: subtotalCents === 0 ? 0 : free ? 0 : r.price_cents, freeFrom: r.free_from_cents, free };
}
