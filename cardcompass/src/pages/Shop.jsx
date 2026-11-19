import '../styles/shop.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronRight, SearchX, AlertTriangle, RotateCcw, Check, ArrowRight,
} from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import { listProducts, getFranchises, getCategories } from '../lib/catalog.js';
import { useAsync, usePageMeta, prefersReducedMotion } from '../lib/hooks.js';
import { R, shopPath } from '../lib/routes.js';

const SORTS = [
  { id: 'new', label: 'Neueste zuerst' },
  { id: 'price-asc', label: 'Preis aufsteigend' },
  { id: 'price-desc', label: 'Preis absteigend' },
  { id: 'name', label: 'Name A–Z' },
];
const PAGE = 24;
const EMPTY_FILTERS = { franchise: '', category: '', available: false };

const readFilters = (sp) => {
  const sort = sp.get('sort');
  return {
    franchise: sp.get('franchise') || '',
    category: sp.get('kategorie') || '',
    q: (sp.get('q') || '').trim(),
    available: sp.get('verfuegbar') === '1',
    sort: SORTS.some((s) => s.id === sort) ? sort : 'new',
  };
};
const filterKey = (f) => [f.franchise, f.category, f.q, f.available ? 1 : 0, f.sort].join('|');
const toQuery = (f) => shopPath(f).split('?')[1] || '';
const plural = (n) => `${n} ${n === 1 ? 'Produkt' : 'Produkte'}`;
const nPanelKey = (f) => `${f.franchise}|${f.category}|${f.available}`;

// White text needs ≥ 4.5:1 on the franchise colour; otherwise the banner falls back to ink.
function whiteOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05) >= 4.5;
}

// Facet counts: every dimension counted with all *other* active filters applied.
async function loadFacets({ franchise, category, q, available }) {
  const [cats, forFr, forCat, avail] = await Promise.all([
    getCategories(),
    listProducts({ category, q, available }),
    listProducts({ franchise, q, available }),
    listProducts({ franchise, category, q, available: true }),
  ]);
  const fr = { _all: forFr.length };
  forFr.forEach((p) => { const s = p.franchise?.slug; if (s) fr[s] = (fr[s] || 0) + 1; });
  const cat = { _all: forCat.length };
  cats.forEach((c) => {
    const fam = c.parent_id ? [c.slug] : [c.slug, ...cats.filter((k) => k.parent_id === c.id).map((k) => k.slug)];
    cat[c.slug] = forCat.filter((p) => p.category_slugs.some((s) => fam.includes(s))).length;
  });
  return { franchise: fr, category: cat, available: avail.length };
}

// ---------------------------------------------------------------------------
// Search field (page header + franchise banner) – refines within the current filters.
function SearchField({ value, onSubmit, placeholder, className = '' }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  return (
    <form
      className={`shop-search ${className}`}
      role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit(text.trim()); }}
    >
      <Search size={18} className="shop-search-ic" aria-hidden="true" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label="Im Shop suchen"
        enterKeyHint="search"
        autoComplete="off"
      />
      {text && (
        <button type="button" className="shop-search-clear" aria-label="Suchbegriff löschen" onClick={() => { setText(''); if (value) onSubmit(''); }}>
          <X size={16} />
        </button>
      )}
      <button type="submit" className="shop-search-go" aria-label="Suchen">
        <span>Suchen</span><ArrowRight size={16} />
      </button>
    </form>
  );
}

function Crumbs({ items }) {
  return (
    <nav className="breadcrumbs shop-crumbs" aria-label="Brotkrumen">
      {items.map((it, i) => (
        <span key={it.label} className="crumb">
          {i > 0 && <ChevronRight size={13} aria-hidden="true" />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Default header ("Alle Produkte", category or search results).
function ShopHero({ f, cat, count, onSearch }) {
  const title = f.q
    ? <>Suchergebnisse für <span className="shop-title-q">„{f.q}“</span></>
    : cat ? cat.name : 'Alle Produkte';
  const crumbs = [{ label: 'Start', to: R.home }, { label: 'Shop', to: f.q || cat ? R.shop : null }];
  if (cat && !f.q) crumbs.push({ label: cat.name });
  if (f.q) crumbs.push({ label: 'Suche' });
  return (
    <section className="page-hero shop-hero">
      <div className="container shop-head">
        <div className="shop-head-text">
          <Crumbs items={crumbs} />
          <h1 className="shop-title">{title}</h1>
          <p className="shop-head-count">{count == null ? 'Produkte werden geladen …' : plural(count)}</p>
        </div>
        <SearchField
          value={f.q}
          onSubmit={(q) => onSearch(q)}
          placeholder="Displays, Booster, Sleeves …"
          className={f.q ? '' : 'hide-sm'}
        />
      </div>
    </section>
  );
}

// Flat colour block for a selected franchise: name, count, scoped search.
function FranchiseBanner({ fr, f, count, onSearch, onClear }) {
  const brand = whiteOn(fr.c2);
  return (
    <section className={`shop-banner ${brand ? 'is-brand' : ''}`} style={brand ? { '--fb': fr.c2 } : undefined}>
      <div className="container shop-head">
        <div className="shop-head-text">
          <Crumbs items={[{ label: 'Start', to: R.home }, { label: 'Shop', to: R.shop }, { label: fr.name }]} />
          <h1 className="shop-title">{fr.name}</h1>
          {f.q && <p className="shop-banner-q">Suchergebnisse für „{f.q}“</p>}
          <p className="shop-head-count">
            <span className="shop-head-n">{count == null ? 'Produkte werden geladen …' : plural(count)}</span>
            <button type="button" className="shop-banner-clear" onClick={onClear}>Alle Franchises <X size={14} aria-hidden="true" /></button>
          </p>
        </div>
        <SearchField
          value={f.q}
          onSubmit={onSearch}
          placeholder={`In ${fr.short || fr.name} suchen …`}
          className={`is-inverse ${f.q ? '' : 'hide-sm'}`}
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Filter panel (desktop sidebar + phone sheet share it).
function Opt({ active, onClick, label, n, sub = false }) {
  return (
    <button
      type="button"
      className={`fopt ${sub ? 'is-sub' : ''} ${active ? 'is-active' : ''} ${n === 0 && !active ? 'is-zero' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="fopt-label">{label}</span>
      {n != null && <span className="fcount">{n}</span>}
    </button>
  );
}

function FilterPanel({ value, onChange, franchises, categories, facets, idPrefix }) {
  const roots = categories.filter((c) => !c.parent_id);
  const kids = (id) => categories.filter((c) => c.parent_id === id);
  const fc = facets?.franchise || {};
  const cc = facets?.category || {};
  const toggleId = `${idPrefix}-avail`;
  return (
    <div className="fpanel">
      <section className="fgroup" aria-labelledby={`${idPrefix}-av`}>
        <h3 className="fgroup-h" id={`${idPrefix}-av`}>Verfügbarkeit</h3>
        <label className="fcheck" htmlFor={toggleId}>
          <input
            id={toggleId}
            type="checkbox"
            checked={value.available}
            onChange={(e) => onChange({ available: e.target.checked })}
          />
          <span className="fcheck-box" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
          <span className="fcheck-label">Nur sofort lieferbar</span>
          {facets && <span className="fcount">{facets.available}</span>}
        </label>
      </section>

      <section className="fgroup" aria-labelledby={`${idPrefix}-fr`}>
        <h3 className="fgroup-h" id={`${idPrefix}-fr`}>Franchise</h3>
        <ul className="flist">
          <li><Opt active={!value.franchise} onClick={() => onChange({ franchise: '' })} label="Alle Franchises" n={fc._all} /></li>
          {franchises.map((fr) => (
            <li key={fr.slug}>
              <Opt
                active={value.franchise === fr.slug}
                onClick={() => onChange({ franchise: value.franchise === fr.slug ? '' : fr.slug })}
                label={fr.name}
                n={facets ? fc[fr.slug] || 0 : null}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="fgroup" aria-labelledby={`${idPrefix}-cat`}>
        <h3 className="fgroup-h" id={`${idPrefix}-cat`}>Kategorie</h3>
        <ul className="flist">
          <li><Opt active={!value.category} onClick={() => onChange({ category: '' })} label="Alle Kategorien" n={cc._all} /></li>
          {roots.map((c) => {
            const children = kids(c.id);
            return (
              <li key={c.slug}>
                <Opt
                  active={value.category === c.slug}
                  onClick={() => onChange({ category: value.category === c.slug ? '' : c.slug })}
                  label={c.name}
                  n={facets ? cc[c.slug] || 0 : null}
                />
                {children.length > 0 && (
                  <ul className="flist-sub">
                    {children.map((k) => (
                      <li key={k.slug}>
                        <Opt
                          sub
                          active={value.category === k.slug}
                          onClick={() => onChange({ category: value.category === k.slug ? '' : k.slug })}
                          label={k.name}
                          n={facets ? cc[k.slug] || 0 : null}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// Phone: bottom sheet with staged filters and an "N Produkte anzeigen" button.
function FilterSheet({ open, onClose, current, onApply, franchises, categories, returnFocus }) {
  const [draft, setDraft] = useState({ franchise: current.franchise, category: current.category, available: current.available });
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (open) setDraft({ franchise: current.franchise, category: current.category, available: current.available });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dk = [draft.franchise, draft.category, draft.available ? 1 : 0, current.q].join('|');
  const facets = useAsync(() => (open ? loadFacets({ ...draft, q: current.q }) : null), [dk, open]);
  const fc = facets.data?.franchise;
  const n = fc ? (draft.franchise ? fc[draft.franchise] || 0 : fc._all) : null;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const els = [...panelRef.current.querySelectorAll('button:not([disabled]), input, [href], select')].filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0]; const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      returnFocus?.current?.focus({ preventScroll: true });
    };
  }, [open, onClose, returnFocus]);

  // Close if the viewport grows into the desktop layout.
  useEffect(() => {
    if (!open || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => { if (mq.matches) onClose(); };
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [open, onClose]);

  const dirty = draft.franchise || draft.category || draft.available;
  return (
    <div className={`fsheet ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="fsheet-back" onClick={onClose} />
      <div className="fsheet-panel" role="dialog" aria-modal="true" aria-labelledby="fsheet-title" ref={panelRef}>
        <div className="fsheet-grip" aria-hidden="true" />
        <div className="fsheet-head">
          <h2 id="fsheet-title" className="fsheet-title">Filter</h2>
          <button type="button" className="icon-btn" ref={closeRef} onClick={onClose} aria-label="Filter schließen"><X size={20} /></button>
        </div>
        <div className="fsheet-body">
          <FilterPanel
            idPrefix="sheet"
            value={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            franchises={franchises}
            categories={categories}
            facets={facets.data}
          />
        </div>
        <div className="fsheet-foot">
          <button type="button" className="btn btn-ghost" onClick={() => setDraft(EMPTY_FILTERS)} disabled={!dirty}>
            <RotateCcw size={16} /> Zurücksetzen
          </button>
          <button type="button" className="btn btn-primary btn-lg fsheet-apply" onClick={() => onApply(draft)}>
            {n == null ? 'Produkte anzeigen' : n === 0 ? 'Keine Produkte' : `${plural(n)} anzeigen`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function Shop() {
  const [sp, setSp] = useSearchParams();
  const f = useMemo(() => readFilters(sp), [sp]);
  const key = filterKey(f);
  const [retry, setRetry] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const resultsRef = useRef(null);
  const filterBtnRef = useRef(null);
  const quickRef = useRef(null);
  const sideRef = useRef(null);
  const [sideEnd, setSideEnd] = useState(true);

  const frs = useAsync(getFranchises, []);
  const cats = useAsync(getCategories, []);
  const res = useAsync(() => listProducts(f).then((list) => ({ list, key })), [key, retry]);
  const facets = useAsync(() => loadFacets(f), [f.franchise, f.category, f.q, f.available, retry]);

  const franchises = frs.data || [];
  const categories = cats.data || [];
  const fr = franchises.find((x) => x.slug === f.franchise) || null;
  const cat = categories.find((c) => c.slug === f.category) || null;
  const list = res.data?.list || null;
  const count = list ? list.length : null;

  usePageMeta(
    f.q ? `Suche: ${f.q}` : fr ? fr.name : cat ? cat.name : 'Shop',
    fr
      ? `${fr.name} bei CardCompass: Booster, Displays, Kollektionen und Zubehör – original versiegelt und schnell geliefert.`
      : 'Alle Produkte bei CardCompass: Booster, Displays, Kollektionen und Zubehör für Pokémon, One Piece, Yu-Gi-Oh!, Magic und mehr.',
  );

  const update = useCallback((patch) => {
    const next = { ...f, ...patch };
    if (filterKey(next) === key) return;
    setSp(toQuery(next));
  }, [f, key, setSp]);
  const resetAll = () => setSp(toQuery({ sort: f.sort }));

  // New result set → back to the first page; scroll results into view
  // (also on browser back/forward) when the user is further down the page.
  const prevKey = useRef(key);
  useEffect(() => {
    if (prevKey.current === key) return;
    prevKey.current = key;
    setShown(PAGE);
    const el = resultsRef.current;
    if (!el) return;
    const hdr = document.querySelector('.hdr')?.offsetHeight || 72;
    const top = el.getBoundingClientRect().top;
    if (top < hdr + 8) {
      window.scrollTo({ top: Math.max(0, window.scrollY + top - hdr - 16), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, [key]);

  // Keep the active quick-chip visible in the horizontal row (phone).
  useEffect(() => {
    const row = quickRef.current;
    const chip = row?.querySelector('.is-active');
    if (!row || !chip) return;
    const target = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [f.franchise, franchises.length]);

  // Sidebar scrolls internally when taller than the viewport: hairline at the bottom until the end.
  useEffect(() => {
    const el = sideRef.current;
    if (!el) return undefined;
    const check = () => setSideEnd(el.scrollHeight - el.scrollTop - el.clientHeight < 6);
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [franchises.length, categories.length, nPanelKey(f)]);

  const chips = [];
  if (f.franchise) chips.push({ id: 'fr', label: fr?.name || f.franchise, clear: { franchise: '' } });
  if (f.category) chips.push({ id: 'cat', label: cat?.name || f.category, clear: { category: '' } });
  if (f.q) chips.push({ id: 'q', label: `„${f.q}“`, clear: { q: '' } });
  if (f.available) chips.push({ id: 'av', label: 'Sofort lieferbar', clear: { available: false } });
  const nPanel = (f.franchise ? 1 : 0) + (f.category ? 1 : 0) + (f.available ? 1 : 0);
  const closeSheet = useCallback(() => setSheet(false), []);

  // Paginate, but never leave a tiny remainder behind a "Mehr anzeigen" button.
  const limit = list && list.length - shown <= 6 ? list.length : shown;
  const visible = list ? list.slice(0, limit) : [];

  return (
    <div className="shop">
      {fr
        ? <FranchiseBanner key={fr.slug} fr={fr} f={f} count={count} onSearch={(q) => update({ q })} onClear={() => update({ franchise: '' })} />
        : <ShopHero f={f} cat={cat} count={count} onSearch={(q) => update({ q })} />}

      <div className="container shop-layout">
        <aside className={`shop-side ${sideEnd ? 'is-end' : ''}`} ref={sideRef} aria-label="Filter">
          <div className="shop-side-head">
            <span className="shop-side-title"><SlidersHorizontal size={15} aria-hidden="true" /> Filter</span>
            {nPanel > 0 && <button type="button" className="shop-linkbtn" onClick={() => update(EMPTY_FILTERS)}>Zurücksetzen</button>}
          </div>
          <FilterPanel
            idPrefix="side"
            value={f}
            onChange={update}
            franchises={franchises}
            categories={categories}
            facets={facets.data}
          />
        </aside>

        <section className="shop-main" ref={resultsRef} aria-labelledby="shop-results-title">
          <h2 id="shop-results-title" className="sr-only">Produkte</h2>

          <div className="shop-quick" ref={quickRef} role="group" aria-label="Franchise schnell wählen">
            <button type="button" className={`chip ${!f.franchise ? 'is-active' : ''}`} aria-pressed={!f.franchise} onClick={() => update({ franchise: '' })}>Alle</button>
            {franchises.map((x) => (
              <button
                key={x.slug}
                type="button"
                className={`chip ${f.franchise === x.slug ? 'is-active' : ''}`}
                aria-pressed={f.franchise === x.slug}
                onClick={() => update({ franchise: f.franchise === x.slug ? '' : x.slug })}
              >
                {x.short || x.name}
              </button>
            ))}
          </div>

          <div className="shop-bar">
            <div className="shop-bar-left">
              <p className="shop-count" aria-live="polite">
                {count == null ? <span className="skeleton shop-count-skel" /> : <><strong>{count}</strong> {count === 1 ? 'Produkt' : 'Produkte'}</>}
              </p>
              {chips.length > 0 && (
                <div className="shop-active" role="group" aria-label="Aktive Filter">
                  {chips.map((c) => (
                    <button key={c.id} type="button" className="chip shop-achip" onClick={() => update(c.clear)} aria-label={`Filter entfernen: ${c.label}`}>
                      <span>{c.label}</span>
                      <X size={14} className="shop-achip-x" aria-hidden="true" />
                    </button>
                  ))}
                  {chips.length > 1 && <button type="button" className="shop-linkbtn" onClick={resetAll}>Alle zurücksetzen</button>}
                </div>
              )}
            </div>
            <div className="shop-tools">
              <button type="button" className="shop-filter-btn" ref={filterBtnRef} onClick={() => setSheet(true)} aria-haspopup="dialog" aria-expanded={sheet}>
                <SlidersHorizontal size={16} aria-hidden="true" /> Filter
                {nPanel > 0 && <span className="shop-filter-n">{nPanel}</span>}
              </button>
              <label className="shop-sort">
                <span className="shop-sort-l">Sortieren</span>
                <span className="shop-sort-field">
                  <select value={f.sort} onChange={(e) => update({ sort: e.target.value })}>
                    {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={16} className="shop-sort-chev" aria-hidden="true" />
                </span>
              </label>
            </div>
          </div>

          <div className={`shop-results ${res.loading && list ? 'is-busy' : ''}`}>
            {res.error ? (
              <div className="shop-state" role="alert">
                <div className="empty-ic"><AlertTriangle size={30} /></div>
                <h3 className="shop-state-h">Die Produkte konnten nicht geladen werden</h3>
                <p className="muted">Prüfe deine Internetverbindung und versuch es gleich noch einmal.</p>
                <div className="shop-state-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setRetry((r) => r + 1)}><RotateCcw size={17} /> Erneut versuchen</button>
                </div>
              </div>
            ) : !list ? (
              <div className="grid-products shop-grid" aria-busy="true" aria-label="Produkte werden geladen">
                {Array.from({ length: 9 }, (_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : list.length === 0 ? (
              <div className="shop-state">
                <div className="empty-ic"><SearchX size={30} /></div>
                <h3 className="shop-state-h">Keine Produkte gefunden</h3>
                <p className="muted">
                  {f.q
                    ? <>Für „{f.q}“ haben wir mit diesen Filtern nichts gefunden. Prüfe die Schreibweise oder probier einen allgemeineren Begriff.</>
                    : 'Mit dieser Filterkombination gibt es gerade nichts. Setz die Filter zurück und entdecke das ganze Sortiment.'}
                </p>
                <div className="shop-state-actions">
                  <button type="button" className="btn btn-primary" onClick={resetAll}><RotateCcw size={17} /> Filter zurücksetzen</button>
                  {f.available && <button type="button" className="btn btn-outline" onClick={() => update({ available: false })}>Auch ausverkaufte zeigen</button>}
                </div>
                {franchises.length > 0 && (
                  <div className="shop-state-sugg">
                    <span className="muted">Beliebte Franchises:</span>
                    {franchises.slice(0, 4).map((x) => (
                      <Link key={x.slug} className="chip" to={shopPath({ franchise: x.slug })}>{x.short || x.name}</Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid-products shop-grid">
                  {visible.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {list.length > limit && (
                  <div className="shop-more">
                    <p className="muted">{limit} von {list.length} Produkten</p>
                    <div className="shop-more-bar" aria-hidden="true"><span style={{ width: `${(limit / list.length) * 100}%` }} /></div>
                    <button type="button" className="btn btn-outline btn-lg" onClick={() => setShown((s) => s + PAGE)}>
                      Mehr anzeigen <ChevronDown size={17} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <FilterSheet
        open={sheet}
        onClose={closeSheet}
        current={f}
        onApply={(d) => { setSheet(false); update(d); }}
        franchises={franchises}
        categories={categories}
        returnFocus={filterBtnRef}
      />
    </div>
  );
}
