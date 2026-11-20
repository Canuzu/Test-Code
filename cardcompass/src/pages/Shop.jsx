import '../styles/shop.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronRight, ArrowUpDown, SearchX, AlertTriangle,
  RotateCcw, Sparkles, LayoutGrid, Check, ArrowRight,
} from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import FranchiseLogo from '../components/FranchiseLogo.jsx';
import { logoUrl } from '../lib/logos.js';
import { listProducts, getFranchises, getCategories } from '../lib/catalog.js';
import { useAsync, usePageMeta, useTilt, prefersReducedMotion } from '../lib/hooks.js';
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
// Search field (hero + franchise banner) – refines within the current filters.
function SearchField({ value, onSubmit, placeholder, glass = false, className = '' }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  return (
    <form
      className={`shop-search ${glass ? 'is-glass' : ''} ${className}`}
      role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit(text.trim()); }}
    >
      <Search size={19} className="shop-search-ic" aria-hidden="true" />
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
        <span>Suchen</span><ArrowRight size={17} />
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
// Default hero ("Alle Produkte", category or search results).
function ShopHero({ f, cat, count, franchises, onSearch }) {
  const title = f.q
    ? <>Suchergebnisse für <span className="grad-text">„{f.q}“</span></>
    : cat ? cat.name : 'Alle Produkte';
  const crumbs = [{ label: 'Start', to: R.home }, { label: 'Shop', to: f.q || cat ? R.shop : null }];
  if (cat && !f.q) crumbs.push({ label: cat.name });
  if (f.q) crumbs.push({ label: 'Suche' });
  const art = franchises.slice(0, 3);
  return (
    <section className="page-hero shop-hero">
      <div className="shop-hero-orb" aria-hidden="true" />
      <div className="container shop-hero-row">
        <div className="shop-hero-text fade-up">
          <Crumbs items={crumbs} />
          <p className="eyebrow">{f.q ? 'Suche' : cat ? 'Kategorie' : 'Shop'}</p>
          <h1 className="h1 shop-title">{title}</h1>
          <p className={`lead shop-lead ${f.q ? 'is-q' : ''}`}>
            {f.q
              ? 'Nicht ganz das Richtige? Verfeinere deine Suche oder nutze die Filter.'
              : 'Booster, Displays, Kollektionen und Zubehör – such dir dein Spiel aus oder stöbere einfach los.'}
          </p>
          <div className="shop-hero-meta">
            <span className="shop-pill"><Sparkles size={15} />{count == null ? 'Lädt …' : plural(count)}</span>
          </div>
          <SearchField
            value={f.q}
            onSubmit={(q) => onSearch(q)}
            placeholder="Displays, Booster, Sleeves …"
            className={f.q ? '' : 'hide-sm'}
          />
        </div>
        <div className="shop-hero-art" aria-hidden="true">
          {art.map((fr, i) => (
            <div key={fr.slug} className={`shop-fan shop-fan-${i}`}>
              <ProductVisual visual={{ kind: 'booster', c1: fr.c1, c2: fr.c2, label: fr.short, sub: 'Booster', logo: logoUrl(fr) }} />
            </div>
          ))}
          <span className="shop-spark s1" /><span className="shop-spark s2" /><span className="shop-spark s3" />
        </div>
      </div>
    </section>
  );
}

// Striking banner tinted with the selected franchise's colours.
function FranchiseBanner({ fr, f, count, onSearch, onClear }) {
  const tilt = useTilt(14);
  return (
    <section className="shop-banner-wrap">
      <div className="container">
        <div className="shop-banner fade-up" style={{ '--c1': fr.c1, '--c2': fr.c2 }}>
          <div className="shop-banner-fx" aria-hidden="true"><span className="aur a1" /><span className="aur a2" /><span className="grid" /></div>
          <div className="shop-banner-text">
            <Crumbs items={[{ label: 'Start', to: R.home }, { label: 'Shop', to: R.shop }, { label: fr.name }]} />
            <FranchiseLogo franchise={fr} size="xl" className="shop-banner-logo" />
            <h1 className="h1 shop-banner-title">{fr.name}</h1>
            {f.q && <p className="shop-banner-q">Suchergebnisse für „{f.q}“</p>}
            <div className="shop-hero-meta">
              <span className="shop-pill is-glass"><Sparkles size={15} />{count == null ? 'Lädt …' : plural(count)}</span>
              <button type="button" className="shop-pill is-glass is-btn" onClick={onClear}><LayoutGrid size={15} />Alle Franchises</button>
            </div>
            <SearchField
              glass
              value={f.q}
              onSubmit={onSearch}
              placeholder={`In ${fr.short || fr.name} suchen …`}
              className={f.q ? '' : 'hide-sm'}
            />
          </div>
          <div className="shop-banner-art" ref={tilt} aria-hidden="true">
            <div className="shop-banner-stage">
              <div className="shop-banner-glow" />
              <ProductVisual className="art-back" visual={{ kind: 'display', c1: fr.c1, c2: fr.c2, label: fr.short, sub: 'Display', logo: logoUrl(fr) }} />
              <ProductVisual className="art-front" visual={{ kind: 'booster', c1: fr.c1, c2: fr.c2, label: fr.short, sub: 'Booster', logo: logoUrl(fr) }} />
            </div>
            <div className="shop-banner-shine" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Filter panel (desktop sidebar + phone sheet share it).
function Opt({ active, onClick, label, n, icon, sub = false }) {
  return (
    <li>
      <button
        type="button"
        className={`fopt ${sub ? 'is-sub' : ''} ${active ? 'is-active' : ''} ${n === 0 && !active ? 'is-zero' : ''}`}
        aria-pressed={active}
        onClick={onClick}
      >
        {icon || null}
        <span className="fopt-label">{label}</span>
        {active ? <Check size={15} className="fopt-check" aria-hidden="true" /> : n != null && <span className="fcount">{n}</span>}
      </button>
    </li>
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
      <section className="fgroup" aria-labelledby={`${idPrefix}-fr`}>
        <h3 className="fgroup-h" id={`${idPrefix}-fr`}>Franchise</h3>
        <ul className="flist">
          <Opt active={!value.franchise} onClick={() => onChange({ franchise: '' })} label="Alle Franchises" n={fc._all} icon={<LayoutGrid size={15} className="fopt-ic" />} />
          {franchises.map((fr) => (
            <Opt
              key={fr.slug}
              active={value.franchise === fr.slug}
              onClick={() => onChange({ franchise: value.franchise === fr.slug ? '' : fr.slug })}
              label={fr.name}
              n={facets ? fc[fr.slug] || 0 : null}
              icon={<FranchiseLogo franchise={fr} size="sm" />}
            />
          ))}
        </ul>
      </section>

      <section className="fgroup" aria-labelledby={`${idPrefix}-cat`}>
        <h3 className="fgroup-h" id={`${idPrefix}-cat`}>Kategorie</h3>
        <ul className="flist">
          <Opt active={!value.category} onClick={() => onChange({ category: '' })} label="Alle Kategorien" n={cc._all} icon={<LayoutGrid size={15} className="fopt-ic" />} />
          {roots.map((c) => {
            const children = kids(c.id);
            return (
              <li key={c.slug} className="ftree">
                <ul className="flist">
                  <Opt
                    active={value.category === c.slug}
                    onClick={() => onChange({ category: value.category === c.slug ? '' : c.slug })}
                    label={c.name}
                    n={facets ? cc[c.slug] || 0 : null}
                  />
                </ul>
                {children.length > 0 && (
                  <ul className="flist flist-sub">
                    {children.map((k) => (
                      <Opt
                        key={k.slug}
                        sub
                        active={value.category === k.slug}
                        onClick={() => onChange({ category: value.category === k.slug ? '' : k.slug })}
                        label={k.name}
                        n={facets ? cc[k.slug] || 0 : null}
                      />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="fgroup" aria-labelledby={`${idPrefix}-av`}>
        <h3 className="fgroup-h" id={`${idPrefix}-av`}>Verfügbarkeit</h3>
        <label className={`fswitch ${value.available ? 'is-on' : ''}`} htmlFor={toggleId}>
          <input
            id={toggleId}
            type="checkbox"
            role="switch"
            checked={value.available}
            aria-checked={value.available}
            onChange={(e) => onChange({ available: e.target.checked })}
          />
          <span className="fswitch-track" aria-hidden="true"><span className="fswitch-thumb" /></span>
          <span className="fswitch-label">Nur sofort lieferbar</span>
          {facets && <span className="fcount">{facets.available}</span>}
        </label>
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
          <h2 id="fsheet-title" className="h3">Filter</h2>
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

  // Sidebar scrolls internally when taller than the viewport: fade the bottom edge until the end.
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
  if (f.q) chips.push({ id: 'q', label: `„${f.q}“`, icon: <Search size={13} />, clear: { q: '' } });
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
        : <ShopHero f={f} cat={cat} count={count} franchises={franchises} onSearch={(q) => update({ q })} />}

      <div className="container shop-layout">
        <aside className={`shop-side ${sideEnd ? 'is-end' : ''}`} ref={sideRef} aria-label="Filter">
          <div className="shop-side-inner">
            <div className="shop-side-head">
              <span className="shop-side-title"><SlidersHorizontal size={17} /> Filter</span>
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
          </div>
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
                    <button key={c.id} type="button" className="shop-achip" onClick={() => update(c.clear)} aria-label={`Filter entfernen: ${c.label}`}>
                      {c.icon}
                      <span>{c.label}</span>
                      <X size={14} className="shop-achip-x" />
                    </button>
                  ))}
                  {chips.length > 1 && <button type="button" className="shop-linkbtn" onClick={resetAll}>Alle zurücksetzen</button>}
                </div>
              )}
            </div>
            <div className="shop-tools">
              <button type="button" className="shop-filter-btn" ref={filterBtnRef} onClick={() => setSheet(true)} aria-haspopup="dialog" aria-expanded={sheet}>
                <SlidersHorizontal size={17} /> Filter
                {nPanel > 0 && <span className="shop-filter-n">{nPanel}</span>}
              </button>
              <label className="shop-sort">
                <ArrowUpDown size={16} className="shop-sort-ic" aria-hidden="true" />
                <span className="sr-only">Sortieren nach</span>
                <select value={f.sort} onChange={(e) => update({ sort: e.target.value })}>
                  {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown size={16} className="shop-sort-chev" aria-hidden="true" />
              </label>
            </div>
          </div>

          <div className={`shop-results ${res.loading && list ? 'is-busy' : ''}`}>
            {res.error ? (
              <div className="shop-state" role="alert">
                <div className="empty-ic"><AlertTriangle size={32} /></div>
                <h3 className="h3">Die Produkte konnten nicht geladen werden</h3>
                <p className="muted">Prüfe deine Internetverbindung und versuch es gleich noch einmal.</p>
                <button type="button" className="btn btn-primary" onClick={() => setRetry((r) => r + 1)}><RotateCcw size={17} /> Erneut versuchen</button>
              </div>
            ) : !list ? (
              <div className="grid-products shop-grid" aria-busy="true" aria-label="Produkte werden geladen">
                {Array.from({ length: 9 }, (_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : list.length === 0 ? (
              <div className="shop-state">
                <div className="empty-ic"><SearchX size={34} /></div>
                <h3 className="h3">Keine Produkte gefunden</h3>
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
                <div className="grid-products shop-grid" key={res.data.key}>
                  {visible.map((p, i) => <ProductCard key={p.id} product={p} index={i % PAGE} />)}
                </div>
                {list.length > limit && (
                  <div className="shop-more">
                    <p className="muted">{limit} von {list.length} Produkten</p>
                    <div className="shop-more-bar"><span style={{ width: `${(limit / list.length) * 100}%` }} /></div>
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
