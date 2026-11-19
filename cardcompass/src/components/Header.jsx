import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Moon, Sun, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import Logo from './Logo.jsx';
import { ProductImage } from './ProductVisual.jsx';
import { useCart } from '../lib/cart.jsx';
import { useTheme } from '../lib/hooks.js';
import { getFranchises, getCategories, suggest, minPrice } from '../lib/catalog.js';
import { money } from '../lib/format.js';
import { R, productPath, shopPath } from '../lib/routes.js';

function SearchBox({ autoFocus = false, onDone }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => { suggest(q, 6).then((r) => { if (alive) { setHits(r); setActive(-1); } }).catch(() => {}); }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);
  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const go = (path) => { setOpen(false); setQ(''); onDone?.(); nav(path); };
  const submit = (e) => {
    e.preventDefault();
    if (active >= 0 && hits[active]) return go(productPath(hits[active].slug));
    if (q.trim()) go(shopPath({ q: q.trim() }));
  };
  const onKey = (e) => {
    if (!hits.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + hits.length) % hits.length); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <form className="hsearch" role="search" onSubmit={submit} ref={boxRef}>
      <Search size={18} className="hsearch-icon" aria-hidden="true" />
      <input
        type="search" value={q} autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
        placeholder="Displays, Booster, Sleeves …" aria-label="Produkte suchen" autoComplete="off"
        role="combobox" aria-expanded={open && hits.length > 0} aria-controls="hsearch-list"
      />
      {open && q.trim().length >= 2 && (
        <div className="hsearch-pop" id="hsearch-list" role="listbox">
          {hits.length === 0 ? <div className="hsearch-empty">Keine Treffer für „{q}"</div> : hits.map((p, i) => (
            <button type="button" role="option" aria-selected={i === active} key={p.id} className={`hsearch-hit ${i === active ? 'is-active' : ''}`} onClick={() => go(productPath(p.slug))}>
              <span className="hsearch-thumb"><ProductImage product={p} /></span>
              <span className="hsearch-name"><span>{p.name}</span><small>{p.franchise?.name || p.product_type?.name}</small></span>
              <strong>{money(minPrice(p))}</strong>
            </button>
          ))}
          {hits.length > 0 && <button type="submit" className="hsearch-all">Alle Ergebnisse für „{q}" <ArrowRight size={15} /></button>}
        </div>
      )}
    </form>
  );
}

export default function Header() {
  const { count, setOpen, lastAdded } = useCart();
  const [theme, toggleTheme] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mega, setMega] = useState(false);
  const [franchises, setFranchises] = useState([]);
  const [cats, setCats] = useState([]);
  const [bump, setBump] = useState(false);
  const loc = useLocation();

  useEffect(() => { getFranchises().then(setFranchises).catch(() => {}); getCategories().then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setMenu(false); setMega(false); }, [loc.pathname, loc.search]);
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; }, [menu]);
  useEffect(() => {
    if (!lastAdded) return undefined;
    setBump(true); const t = setTimeout(() => setBump(false), 650);
    return () => clearTimeout(t);
  }, [lastAdded]);

  const roots = cats.filter((c) => !c.parent_id);
  const navCls = ({ isActive }) => `hdr-link ${isActive ? 'active' : ''}`;

  return (
    <header className={`hdr ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="hdr-usp">
        <div className="container hdr-usp-row">
          <span><strong>Faire Preise statt Scalping</strong> – Hype-Releases zum regulären Preis</span>
          <span className="hdr-usp-sep" aria-hidden="true" />
          <span className="hdr-usp-2"><strong>Schneller Versand</strong> – deine Bestellung geht zügig raus</span>
        </div>
      </div>
      <div className="container hdr-row">
        <button className="icon-btn hdr-burger" onClick={() => setMenu(true)} aria-label="Menü öffnen"><Menu size={22} /></button>
        <Logo size={34} />
        <nav className="hdr-nav" aria-label="Hauptnavigation">
          <NavLink to={R.shop} className={navCls} end>Shop</NavLink>
          <Link to={shopPath({ sort: 'new' })} className="hdr-link">Neuheiten</Link>
          <div className="hdr-mega-wrap" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
            <button type="button" className="hdr-link" aria-expanded={mega} onClick={() => setMega((m) => !m)} onFocus={() => setMega(true)}>Franchises <ChevronDown size={14} className="hdr-chev" /></button>
            {mega && (
              <div className="mega" role="menu">
                <div className="mega-col">
                  <div className="mega-h">Franchises</div>
                  {franchises.map((f) => <Link key={f.slug} to={shopPath({ franchise: f.slug })} className="mega-link">{f.name}</Link>)}
                </div>
                <div className="mega-col">
                  <div className="mega-h">Kategorien</div>
                  {roots.map((c) => <Link key={c.slug} to={shopPath({ category: c.slug })} className="mega-link">{c.name}</Link>)}
                </div>
                <Link to={shopPath({ available: true })} className="mega-promo">
                  <span className="mega-promo-k">Sofort lieferbar</span>
                  <strong>Was heute noch rausgehen kann.</strong>
                  <span className="mega-promo-l">Ansehen <ArrowRight size={15} /></span>
                </Link>
              </div>
            )}
          </div>
          <Link to={shopPath({ category: 'tcg-zubehoer' })} className="hdr-link">Zubehör</Link>
          <NavLink to={R.contact} className={navCls}>Kontakt</NavLink>
        </nav>
        <div className="hdr-search"><SearchBox /></div>
        <div className="hdr-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'} title={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}>
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link to={R.account} className="icon-btn hdr-account" aria-label="Mein Konto" title="Mein Konto"><User size={19} /></Link>
          <button className={`hdr-cart ${bump ? 'is-bump' : ''}`} onClick={() => setOpen(true)} aria-label={`Warenkorb, ${count} Artikel`}>
            <ShoppingBag size={19} />
            <span className="hdr-cart-label">Warenkorb</span>
            <span className={`hdr-count ${count ? '' : 'is-zero'}`} key={count}>{count}</span>
          </button>
        </div>
      </div>
      <div className="container hdr-msearch"><SearchBox /></div>

      {menu && (
        <div className="mmenu" role="dialog" aria-modal="true" aria-label="Menü">
          <div className="mmenu-back" onClick={() => setMenu(false)} />
          <div className="mmenu-panel">
            <div className="mmenu-top"><Logo size={32} onClick={() => setMenu(false)} /><button className="icon-btn" onClick={() => setMenu(false)} aria-label="Menü schließen"><X size={22} /></button></div>
            <nav className="mmenu-nav">
              <Link to={R.shop}>Shop</Link>
              <Link to={shopPath({ sort: 'new' })}>Neuheiten</Link>
              <Link to={shopPath({ category: 'tcg-zubehoer' })}>Zubehör</Link>
              <Link to={shopPath({ available: true })}>Sofort lieferbar</Link>
              <div className="mmenu-h">Franchises</div>
              {franchises.map((f) => <Link key={f.slug} to={shopPath({ franchise: f.slug })} className="mmenu-sub">{f.name}</Link>)}
              <div className="mmenu-h">Service</div>
              <Link to={R.account} className="mmenu-sub">Mein Konto</Link>
              <Link to={R.contact} className="mmenu-sub">Kontakt</Link>
              <Link to={R.widerruf} className="mmenu-sub">Vertrag widerrufen</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
