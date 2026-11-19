import '../styles/shop.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShoppingBag, Check, Truck, PackageSearch, RotateCcw, Package, ArrowRight, AlertTriangle, Scale } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import { ProductImage } from '../components/ProductVisual.jsx';
import { TRUST } from '../components/Footer.jsx';
import { useCart } from '../lib/cart.jsx';
import {
  getProduct, getRelated, getShippingRates, getSettings, getCategories, defaultVariant, isNew, fairLimit } from '../lib/catalog.js';
import { useAsync, usePageMeta, useReveal, prefersReducedMotion } from '../lib/hooks.js';
import { money, pct, clamp } from '../lib/format.js';
import { R, shopPath } from '../lib/routes.js';
import { SHOP } from '../lib/config.js';

const MAX_QTY = 20;
const TABS = [
  { id: 'desc', label: 'Beschreibung' },
  { id: 'details', label: 'Details' },
  { id: 'ship', label: 'Versand & Rückgabe', short: 'Versand' },
];

const stockOf = (n) => (n <= 0
  ? { cls: 'off', text: 'Ausverkauft', short: 'Ausverkauft' }
  : n <= 5 ? { cls: 'low', text: `Nur noch ${n} verfügbar`, short: `Nur noch ${n}` }
    : { cls: 'ok', text: 'Sofort lieferbar', short: 'Lieferbar' });

const paragraphs = (s) => String(s || '').split(/\n{2,}|\r\n\r\n/).map((x) => x.trim()).filter(Boolean);

// ---------------------------------------------------------------------------
export default function Product() {
  const { slug } = useParams();
  const { data, error, loading } = useAsync(() => getProduct(slug), [slug]);
  // While the next product loads keep the previous one on screen (no flash).
  const product = data && (data.slug === slug || loading) ? data : null;
  usePageMeta(product ? product.name : !loading ? 'Produkt nicht gefunden' : undefined, product?.short_description || undefined);

  if (error && !product) {
    return (
      <div className="section"><div className="container pdp-missing" role="alert">
        <div className="empty-ic"><AlertTriangle size={32} /></div>
        <h1 className="h2">Das Produkt konnte nicht geladen werden</h1>
        <p className="lead">Prüfe deine Internetverbindung und lade die Seite neu.</p>
        <div className="pdp-missing-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}><RotateCcw size={17} /> Neu laden</button>
          <Link to={R.shop} className="btn btn-outline">Zum Shop</Link>
        </div>
      </div></div>
    );
  }
  if (!product && loading) return <ProductSkeleton />;
  if (!product) {
    return (
      <div className="section"><div className="container pdp-missing">
        <div className="empty-ic"><PackageSearch size={34} /></div>
        <p className="eyebrow">Produkt nicht gefunden</p>
        <h1 className="h2">Dieses Produkt gibt es nicht (mehr).</h1>
        <p className="lead">Vielleicht wurde es aus dem Sortiment genommen – im Shop wartet aber garantiert etwas anderes für deine Sammlung.</p>
        <div className="pdp-missing-actions">
          <Link to={R.shop} className="btn btn-primary">Zum Shop <ArrowRight size={17} /></Link>
          <Link to={R.home} className="btn btn-outline">Startseite</Link>
        </div>
      </div></div>
    );
  }
  return <ProductView key={product.id} product={product} />;
}

function ProductSkeleton() {
  return (
    <div className="pdp" aria-busy="true" aria-label="Produkt wird geladen">
      <div className="container">
        <div className="skeleton pdp-skel-crumbs" />
        <div className="pdp-grid">
          <div className="pdp-media"><div className="pdp-stage skeleton" /></div>
          <div className="pdp-info">
            <div className="skeleton" style={{ height: 12, width: 120 }} />
            <div className="skeleton" style={{ height: 40, width: '90%', marginTop: 18 }} />
            <div className="skeleton" style={{ height: 40, width: '60%', marginTop: 10 }} />
            <div className="skeleton" style={{ height: 18, width: '80%', marginTop: 22 }} />
            <div className="skeleton" style={{ height: 96, marginTop: 32 }} />
            <div className="skeleton" style={{ height: 220, marginTop: 24 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function ProductView({ product }) {
  const nav = useNavigate();
  const { add, lines, subtotal } = useCart();
  const variants = product.variants || [];
  const initial = variants.find((v) => v.is_default && v.available > 0) || variants.find((v) => v.available > 0) || defaultVariant(product);
  const [vid, setVid] = useState(initial?.id);
  const variant = variants.find((v) => v.id === vid) || initial || null;
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState('desc');
  const [added, setAdded] = useState(false);
  const [barOn, setBarOn] = useState(false);
  const addedTimer = useRef(0);
  const buyRef = useRef(null);
  const tabsRef = useRef(null);
  const relRef = useReveal();

  const rates = useAsync(getShippingRates, []);
  const settings = useAsync(getSettings, []);
  const cats = useAsync(getCategories, []);
  const related = useAsync(() => getRelated(product, 4), [product.id]);

  const rate = rates.data?.[0] || SHOP.shipping[0];
  const freeFrom = rate?.free_from_cents ?? null;
  const smallBusiness = settings.data?.smallBusiness ?? SHOP.smallBusiness;

  const price = variant?.price_cents;
  const was = variant?.compare_at_price_cents;
  const off = pct(price, was);
  const avail = Math.max(0, variant?.available || 0);
  const soldOut = !variant || avail === 0;
  const inCart = lines.find((l) => l.variantId === variant?.id)?.qty || 0;
  const limit = fairLimit(variant);
  const room = Math.max(0, Math.min(MAX_QTY, avail, limit ?? MAX_QTY) - inCart);
  const maxQty = Math.max(1, room);
  const stock = stockOf(avail);
  const priceDiffers = new Set(variants.map((v) => v.price_cents)).size > 1;

  useEffect(() => { setQty((q) => clamp(q, 1, maxQty)); }, [maxQty]);
  useEffect(() => () => clearTimeout(addedTimer.current), []);

  // Breadcrumb middle level: franchise, otherwise the product's category.
  const cat = (cats.data || []).find((c) => product.category_slugs?.includes(c.slug));
  const crumbMid = product.franchise
    ? { label: product.franchise.name, to: shopPath({ franchise: product.franchise.slug }) }
    : cat ? { label: cat.name, to: shopPath({ category: cat.slug }) } : null;

  // Phone: sticky buy bar once the main button has scrolled away (upwards).
  useEffect(() => {
    const el = buyRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const hdr = document.querySelector('.hdr')?.offsetHeight || 64;
    const io = new IntersectionObserver(([e]) => setBarOn(!e.isIntersecting && e.boundingClientRect.top < hdr), { rootMargin: `-${hdr}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.body.classList.add('pdp-has-bar');
    return () => document.body.classList.remove('pdp-has-bar');
  }, []);

  const addToCart = (e) => {
    if (soldOut || room === 0) return;
    add(product, variant, Math.min(qty, room), { from: e?.currentTarget?.getBoundingClientRect?.() });
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1800);
    setQty(1);
  };
  const buyNow = () => {
    if (soldOut) return;
    if (room > 0) add(product, variant, Math.min(qty, room), { openDrawer: false });
    nav(R.checkout);
  };
  const showShipping = () => {
    setTab('ship');
    const el = tabsRef.current;
    if (!el) return;
    const hdr = document.querySelector('.hdr')?.offsetHeight || 72;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - hdr - 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const shown = img > 0 && product.images?.[img] ? { ...product, images: [product.images[img]] } : product;
  const lineTotal = (price || 0) * qty;
  const toFree = freeFrom != null ? freeFrom - subtotal - (soldOut ? 0 : lineTotal) : null;

  const ld = useMemo(() => {
    const url = typeof window !== 'undefined' ? window.location.href : undefined;
    const offers = variants.map((v) => ({
      '@type': 'Offer',
      sku: v.sku,
      name: v.title,
      price: (v.price_cents / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability: v.available > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
    }));
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.short_description || product.description || undefined,
      sku: defaultVariant(product)?.sku,
      category: product.product_type?.name,
      brand: product.franchise ? { '@type': 'Brand', name: product.franchise.name } : undefined,
      image: product.images?.length ? product.images.map((i) => i.url) : undefined,
      offers: offers.length === 1 ? offers[0] : offers,
    };
    return JSON.stringify(data).replace(/</g, '\\u003c');
  }, [product, variants]);

  return (
    <div className="pdp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
      <div className="container">
        <nav className="breadcrumbs pdp-crumbs" aria-label="Brotkrumen">
          <Link to={R.home}>Start</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <Link to={R.shop}>Shop</Link>
          {crumbMid && <><ChevronRight size={13} aria-hidden="true" /><Link to={crumbMid.to}>{crumbMid.label}</Link></>}
          <ChevronRight size={13} aria-hidden="true" />
          <span className="pdp-crumb-cur" aria-current="page">{product.name}</span>
        </nav>

        <div className="pdp-grid">
          {/* ---- media ---- */}
          <div className="pdp-media">
            <div className={`pdp-stage ${soldOut ? 'is-out' : ''}`}>
              <div className="pdp-stage-inner">
                <ProductImage product={shown} className="pdp-img" eager />
              </div>
              <div className="pdp-badges">
                {off > 0 && <span className="badge badge-sale">−{off} %</span>}
                {isNew(product) && <span className="badge badge-violet">Neu</span>}
                {soldOut && <span className="badge badge-off">Ausverkauft</span>}
              </div>
            </div>
            {product.images?.length > 1 && (
              <div className="pdp-thumbs" role="group" aria-label="Produktbilder">
                {product.images.map((im, i) => (
                  <button
                    key={im.url}
                    type="button"
                    className={`pdp-thumb ${i === img ? 'is-active' : ''}`}
                    aria-pressed={i === img}
                    aria-label={`Bild ${i + 1} von ${product.images.length}`}
                    onClick={() => setImg(i)}
                  >
                    <img src={im.url} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- info ---- */}
          <div className="pdp-info">
            <div className="pdp-head">
              {product.franchise ? (
                <Link to={shopPath({ franchise: product.franchise.slug })} className="pdp-fr">{product.franchise.name}</Link>
              ) : crumbMid ? (
                <Link to={crumbMid.to} className="pdp-fr">{crumbMid.label}</Link>
              ) : null}
              <h1 className="pdp-title">{product.name}</h1>
              {product.short_description && <p className="pdp-short">{product.short_description}</p>}
            </div>

            <div className="pdp-price">
              <div className="pdp-price-row">
                <strong className="pdp-price-now">{money(price)}</strong>
                {off > 0 && <s className="pdp-price-was">{money(was)}</s>}
                {off > 0 && <span className="badge badge-sale">−{off} %</span>}
              </div>
              {off > 0 && <p className="pdp-save">Du sparst {money(was - price)}</p>}
              <p className="pdp-tax">
                {smallBusiness ? 'Gem. § 19 UStG wird keine Umsatzsteuer berechnet.' : 'inkl. MwSt.'}
                <br />
                zzgl. <button type="button" className="pdp-inline-link" onClick={showShipping}>Versandkosten</button>
                {freeFrom != null && <> (Gratisversand ab {money(freeFrom)})</>}
              </p>
            </div>

            <div className="pdp-buy">
              {variants.length > 1 ? (
                <div className="pdp-variants">
                  <div className="pdp-label" id="pdp-variant-label">
                    Sprache / Edition <strong>{variant?.title}</strong>
                  </div>
                  <div className="pdp-opts" role="group" aria-labelledby="pdp-variant-label">
                    {variants.map((v) => {
                      const s = stockOf(v.available || 0);
                      const on = v.id === variant?.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          className={`pdp-opt ${on ? 'is-active' : ''} is-${s.cls}`}
                          aria-pressed={on}
                          disabled={!(v.available > 0)}
                          onClick={() => setVid(v.id)}
                        >
                          <span className="pdp-opt-t">{v.title}</span>
                          <span className="pdp-opt-s">
                            {priceDiffers && <b>{money(v.price_cents)}</b>}
                            <span className="pdp-opt-st"><span className={`pdp-dot is-${s.cls}`} aria-hidden="true" />{s.short}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : variant?.title ? (
                <div className="pdp-label">Sprache / Edition <strong>{variant.title}</strong></div>
              ) : null}

              <div className={`pdp-stock is-${stock.cls}`} role="status">
                <span className="pdp-dot" aria-hidden="true" />
                <span>{stock.text}</span>
                {inCart > 0 && <span className="pdp-incart">· {inCart} im Warenkorb</span>}
              </div>
              {limit && (
                <div className="pdp-fair">
                  <strong>Fair-Limit:</strong> max. {limit} pro Bestellung – damit Sammler zum Zug kommen, nicht Reseller.
                </div>
              )}

              <div className="pdp-actions" ref={buyRef}>
                {!soldOut && (
                  <div className="qty pdp-qty" role="group" aria-label="Menge">
                    <button type="button" onClick={() => setQty((q) => clamp(q - 1, 1, maxQty))} disabled={qty <= 1 || room === 0} aria-label="Menge verringern"><Minus size={16} /></button>
                    <span aria-live="polite" aria-label={`Menge ${qty}`}>{qty}</span>
                    <button type="button" onClick={() => setQty((q) => clamp(q + 1, 1, maxQty))} disabled={qty >= maxQty || room === 0} aria-label="Menge erhöhen"><Plus size={16} /></button>
                  </div>
                )}
                {soldOut ? (
                  <button type="button" className="btn btn-lg btn-block pdp-soldout" disabled>Ausverkauft</button>
                ) : (
                  <button type="button" className={`btn btn-primary btn-lg pdp-add ${added ? 'is-added' : ''}`} onClick={addToCart} disabled={room === 0}>
                    {added ? <><Check size={19} strokeWidth={2.6} /> Hinzugefügt</> : room === 0 ? 'Maximal im Warenkorb' : <><ShoppingBag size={19} /> In den Warenkorb</>}
                  </button>
                )}
              </div>
              {!soldOut && (
                <button type="button" className="btn btn-outline btn-lg btn-block" onClick={buyNow}>
                  Sofort kaufen
                </button>
              )}
              {room === 0 && !soldOut && <p className="pdp-note">Du hast bereits die maximal verfügbare Menge im Warenkorb.</p>}
              {soldOut && <p className="pdp-note muted">Dieser Artikel ist gerade vergriffen. Schau bald wieder vorbei – wir füllen regelmäßig auf.</p>}

              {freeFrom != null && !soldOut && (
                <p className={`pdp-ship ${toFree <= 0 ? 'is-free' : ''}`}>
                  <Truck size={17} aria-hidden="true" />
                  {toFree <= 0
                    ? <span>Mit diesem Einkauf ist dein <strong>Versand kostenlos</strong>.</span>
                    : <span>Noch <strong>{money(toFree)}</strong> bis zum Gratisversand</span>}
                </p>
              )}
            </div>

            <ul className="pdp-trust">
              {TRUST.map(({ Icon, t, d }) => (
                <li key={t}>
                  <Icon size={19} className="pdp-trust-ic" aria-hidden="true" />
                  <span><strong>{t}</strong><small>{d}</small></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- tabs ---- */}
        <InfoTabs
          tabsRef={tabsRef}
          tab={tab}
          setTab={setTab}
          product={product}
          variant={variant}
          rates={rates.data || SHOP.shipping}
        />

        {/* ---- related ---- */}
        <section className="pdp-related reveal" ref={relRef} aria-labelledby="pdp-related-title">
          <div className="section-head">
            <h2 className="h2" id="pdp-related-title">Das könnte dir auch gefallen</h2>
            <Link to={product.franchise ? shopPath({ franchise: product.franchise.slug }) : R.shop} className="link-arrow">
              {product.franchise ? `Mehr von ${product.franchise.name}` : 'Alle Produkte'} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid-products pdp-related-grid">
            {related.data
              ? related.data.map((p) => <ProductCard key={p.id} product={p} />)
              : Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </section>
      </div>

      {/* ---- phone: sticky buy bar ---- */}
      <div className={`pdp-bar ${barOn ? 'is-on' : ''}`} aria-hidden={!barOn}>
        <div className="pdp-bar-thumb"><ProductImage product={product} /></div>
        <div className="pdp-bar-info">
          <strong>{money(price)}</strong>
          <span className={`is-${stock.cls}`}>{variants.length > 1 && variant ? `${variant.title} · ` : ''}{stock.short}</span>
        </div>
        {soldOut ? (
          <button type="button" className="btn pdp-soldout" disabled tabIndex={barOn ? 0 : -1}>Ausverkauft</button>
        ) : (
          <button type="button" className={`btn btn-primary pdp-bar-add ${added ? 'is-added' : ''}`} onClick={addToCart} disabled={room === 0} tabIndex={barOn ? 0 : -1}>
            {added ? <><Check size={18} strokeWidth={2.6} /> Hinzugefügt</> : <><ShoppingBag size={18} /> In den Warenkorb</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function InfoTabs({ tabsRef, tab, setTab, product, variant, rates }) {
  const listRef = useRef(null);

  const onKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = TABS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    setTab(TABS[n].id);
    listRef.current?.querySelectorAll('[role="tab"]')[n]?.focus();
  };

  const attrs = product.attributes || [];
  const zustand = attrs.find((a) => /^zustand$/i.test(a.key))?.value || variant?.condition;
  const rows = [
    product.franchise && ['Franchise', product.franchise.name],
    product.product_type?.name && ['Produktart', product.product_type.name],
    ...attrs.filter((a) => !/^zustand$/i.test(a.key)).map((a) => [a.key, a.value]),
    variant?.title && ['Sprache / Edition', variant.title],
    zustand && ['Zustand', zustand],
    variant?.sku && ['Artikelnummer', <code key="sku">{variant.sku}</code>],
  ].filter(Boolean);
  const desc = paragraphs(product.description);
  const text = desc.length ? desc : paragraphs(product.short_description);

  return (
    <section className="pdp-tabs" ref={tabsRef} aria-label="Produktinformationen">
      <div className="pdp-tablist" role="tablist" aria-label="Produktinformationen" ref={listRef} onKeyDown={onKey}>
        {TABS.map(({ id, label, short }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`pdp-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`pdp-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={`pdp-tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            <span className={short ? 'pdp-tab-l' : ''}>{label}</span>
            {short && <span className="pdp-tab-s">{short}</span>}
          </button>
        ))}
      </div>

      <div className="pdp-panel" role="tabpanel" id={`pdp-panel-${tab}`} aria-labelledby={`pdp-tab-${tab}`} tabIndex={0} key={tab}>
        {tab === 'desc' && (
          <div className="pdp-desc">
            <div className="pdp-prose">
              <h2 className="h3">Über dieses Produkt</h2>
              {text.length ? text.map((p, i) => <p key={i}>{p}</p>) : <p className="muted">Für dieses Produkt gibt es noch keine ausführliche Beschreibung.</p>}
            </div>
            <aside className="pdp-desc-aside">
              <Scale size={20} className="pdp-trust-ic" aria-hidden="true" />
              <div>
                <strong>Fairer Preis</strong>
                <p>Auch begehrte Releases gibt es bei uns zum regulären Preis – ohne Scalper-Aufschlag.</p>
              </div>
            </aside>
          </div>
        )}
        {tab === 'details' && (
          <div>
            <h2 className="h3">Produktdetails</h2>
            <dl className="pdp-dl">
              {rows.map(([k, v]) => (
                <div key={k} className="pdp-dl-row"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
        )}
        {tab === 'ship' && (
          <div>
            <h2 className="h3">Versand &amp; Rückgabe</h2>
            <ul className="pdp-shiplist">
              <li>
                <Truck size={20} className="pdp-trust-ic" aria-hidden="true" />
                <div>
                  <strong>Versand mit DHL</strong>
                  {rates.map((r) => (
                    <p key={r.name}>
                      {r.name}: {r.price_cents === 0 ? 'kostenlos' : money(r.price_cents)}
                      {r.free_from_cents != null && <> – ab {money(r.free_from_cents)} Bestellwert versandkostenfrei.</>}
                    </p>
                  ))}
                </div>
              </li>
              <li>
                <Package size={20} className="pdp-trust-ic" aria-hidden="true" />
                <div>
                  <strong>Sicher verpackt</strong>
                  <p>Versiegelte Produkte verschicken wir gut gepolstert im stabilen Versandkarton – damit deine Sammlung unbeschadet ankommt.</p>
                </div>
              </li>
              <li>
                <RotateCcw size={20} className="pdp-trust-ic" aria-hidden="true" />
                <div>
                  <strong>14 Tage Widerrufsrecht</strong>
                  <p>
                    Du kannst deinen Vertrag innerhalb von 14 Tagen ohne Angabe von Gründen widerrufen. Alle Details findest du in unserer{' '}
                    <Link to={R.widerrufsbelehrung} className="pdp-link">Widerrufsbelehrung</Link>.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
