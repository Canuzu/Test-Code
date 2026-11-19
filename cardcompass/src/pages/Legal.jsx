import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Building2, ChevronDown, ChevronRight, Clock, Cookie, FileText, ListTree, Printer, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { getLegalDoc, LEGAL_DOCS } from '../content/legal.js';
import { missingOperatorFields, Placeholder } from '../content/operator.js';
import { usePageMeta, prefersReducedMotion } from '../lib/hooks.js';
import { slugify } from '../lib/format.js';
import { HASH_ROUTER } from '../lib/config.js';
import { R } from '../lib/routes.js';
import '../styles/pages.css';

const DOC_ICONS = { agb: FileText, widerrufsbelehrung: RotateCcw, impressum: Building2, datenschutz: ShieldCheck, cookies: Cookie };
const DESCRIPTIONS = {
  agb: 'Allgemeine Geschäftsbedingungen von CardCompass: Vertragsschluss, Preise, Zahlung, Lieferung und Haftung.',
  widerrufsbelehrung: 'Widerrufsbelehrung und Muster-Widerrufsformular für Bestellungen bei CardCompass.',
  impressum: 'Impressum und Anbieterkennzeichnung von CardCompass.',
  datenschutz: 'Datenschutzerklärung von CardCompass: welche Daten wir wofür verarbeiten und welche Rechte du hast.',
  cookies: 'Welche Cookies und Browserspeicher CardCompass verwendet – ohne Tracking.',
};
const OPERATOR_DOCS = ['agb', 'widerrufsbelehrung', 'impressum', 'datenschutz'];

const plain = (s) => String(s).replace(/­/g, '');
const sectionId = (s) => s.id || `s-${slugify(plain(s.h))}`;

/* ---------- inline markup: [[Platzhalter]], [Text](href), **fett** ---------- */

function SmartLink({ href, children }) {
  if (href.startsWith('/')) return <Link to={href}>{children}</Link>;
  const external = /^https?:/i.test(href);
  return <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}

function Rich({ text }) {
  const out = [];
  const re = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g;
  const src = String(text ?? '');
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1]) out.push(<Placeholder key={k++}>{m[1]}</Placeholder>);
    else if (m[2]) out.push(<SmartLink key={k++} href={m[3]}>{m[2]}</SmartLink>);
    else if (m[4]) out.push(<strong key={k++}><Rich text={m[4]} /></strong>);
    last = re.lastIndex;
  }
  if (last < src.length) out.push(src.slice(last));
  return <>{out}</>;
}

function Block({ b }) {
  if (b.p) return <p><Rich text={b.p} /></p>;
  if (b.ul) return <ul>{b.ul.map((li, i) => <li key={i}><Rich text={li} /></li>)}</ul>;
  if (b.lines) return <p className="lg-lines">{b.lines.map((l, i) => <Fragment key={i}>{i > 0 && <br />}<Rich text={l} /></Fragment>)}</p>;
  if (b.form) return <div className="lg-form">{b.form.map((l, i) => <p key={i}><Rich text={l} /></p>)}</div>;
  if (b.note) return <p className="lg-note">{b.note}</p>;
  if (b.table) {
    return (
      <div className="lg-table-wrap">
        <table className="lg-table">
          <thead><tr>{b.table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {b.table.rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (i === 0
                  ? <th key={i} scope="row"><code>{cell}</code></th>
                  : <td key={i} data-label={b.table.head[i]}><Rich text={cell} /></td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

/* ---------- active section tracking ---------- */

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    setActive(ids[0]);
    if (!('IntersectionObserver' in window)) return undefined;
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id); });
      const first = ids.find((id) => visible.has(id));
      if (first) setActive(first);
    }, { rootMargin: '-96px 0px -62% 0px', threshold: 0 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids]);
  return [active, setActive];
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const h = el.querySelector('h2');
  if (h) h.focus({ preventScroll: true });
}

function Toc({ sections, active, onGo, compact = false }) {
  return (
    <ol className={`lg-toc-list ${compact ? 'is-compact' : ''}`}>
      {sections.map((s) => {
        const id = sectionId(s);
        return (
          <li key={id}>
            <a
              href={HASH_ROUTER ? undefined : `#${id}`}
              role={HASH_ROUTER ? 'button' : undefined}
              tabIndex={0}
              className={active === id ? 'is-active' : ''}
              aria-current={active === id ? 'location' : undefined}
              onClick={(e) => { e.preventDefault(); onGo(id); }}
              onKeyDown={(e) => { if (HASH_ROUTER && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onGo(id); } }}
            >
              {plain(s.h)}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export default function Legal({ doc = 'impressum' }) {
  const data = useMemo(() => getLegalDoc(doc), [doc]);
  const loc = useLocation();
  const title = plain(data.title);
  usePageMeta(data.short === 'AGB' ? 'AGB' : title, DESCRIPTIONS[doc]);

  const ids = useMemo(() => data.sections.map(sectionId), [data]);
  const [active, setActive] = useActiveSection(ids);
  const mobileToc = useRef(null);

  const words = useMemo(() => JSON.stringify(data.sections).split(/\s+/).length, [data]);
  const minutes = Math.max(1, Math.round(words / 200));
  const missing = OPERATOR_DOCS.includes(doc) ? missingOperatorFields() : [];

  const go = (id) => {
    setActive(id);
    scrollToSection(id);
    if (mobileToc.current) mobileToc.current.open = false;
  };

  // Deep link (/datenschutz#s-…) – only with pretty URLs.
  useEffect(() => {
    if (HASH_ROUTER || !loc.hash) return undefined;
    const id = decodeURIComponent(loc.hash.slice(1));
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [loc.hash, doc]);

  const others = LEGAL_DOCS.filter((d) => d.key !== doc);

  return (
    <div className="lg-page pg-print">
      <section className="page-hero lg-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Brotkrumen">
            <Link to={R.home}>Start</Link><ChevronRight size={14} aria-hidden="true" />
            <span>Rechtliches</span><ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">{data.short}</span>
          </nav>
          <div className="lg-hero-row">
            <div className="lg-hero-text">
              <p className="eyebrow">Rechtliches</p>
              <h1 className="lg-title" id="lg-title">{data.title}</h1>
              <p className="lg-meta">
                <span className="lg-stamp"><Clock size={15} aria-hidden="true" />{data.updated}</span>
                <span className="lg-meta-dot" aria-hidden="true" />
                <span>{data.sections.length} Abschnitte</span>
                <span className="lg-meta-dot lg-meta-opt" aria-hidden="true" />
                <span className="lg-meta-opt">ca. {minutes} Min. Lesezeit</span>
              </p>
            </div>
            <div className="lg-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <Printer size={16} aria-hidden="true" /> Drucken
              </button>
            </div>
          </div>
          <nav className="lg-docnav" aria-label="Rechtstexte">
            {LEGAL_DOCS.map((d) => (
              <Link key={d.key} to={d.path} className={`chip ${d.key === doc ? 'is-active' : ''}`} aria-current={d.key === doc ? 'page' : undefined}>{d.label}</Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="container lg-layout">
        <aside className="lg-toc" aria-label="Inhaltsverzeichnis">
          <div className="lg-toc-inner">
            <p className="lg-toc-h"><ListTree size={15} aria-hidden="true" /> Inhalt</p>
            <Toc sections={data.sections} active={active} onGo={go} />
          </div>
        </aside>

        <article className="lg-doc" aria-labelledby="lg-title">

          {missing.length > 0 && (
            <div className="lg-ph-banner" role="note">
              <TriangleAlert size={18} aria-hidden="true" />
              <p>
                <strong>Platzhalter:</strong> Einige Angaben zum Betreiber sind noch nicht hinterlegt und gelb markiert.
                Vor dem Livegang in <code>src/content/operator.js</code> bzw. per <code>VITE_OPERATOR_*</code> ausfüllen.
              </p>
            </div>
          )}

          <details className="lg-toc-m" ref={mobileToc}>
            <summary><ListTree size={16} aria-hidden="true" /> Inhalt · {data.sections.length} Abschnitte <ChevronDown size={16} className="lg-toc-m-chev" aria-hidden="true" /></summary>
            <Toc sections={data.sections} active={active} onGo={go} compact />
          </details>

          <div className="prose lg-prose">
            {data.intro?.map((b, i) => <Block key={`i${i}`} b={b} />)}
            {data.cta && (
              <div className="lg-cta">
                <div className="lg-cta-ic"><RotateCcw size={20} aria-hidden="true" /></div>
                <p>{data.cta.text}</p>
                <Link to={data.cta.to} className="btn btn-primary btn-sm">{data.cta.label} <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            )}
            {data.sections.map((s) => {
              const id = sectionId(s);
              return (
                <section key={id} id={id} className={`lg-section ${s.draft ? 'is-draft' : ''}`} aria-labelledby={`${id}-h`}>
                  <h2 id={`${id}-h`} tabIndex={-1}>
                    {plain(s.h)}
                    {s.draft && <span className="op-ph lg-draft">Neu · vor Livegang rechtlich prüfen</span>}
                  </h2>
                  {s.blocks.map((b, i) => <Block key={i} b={b} />)}
                </section>
              );
            })}
            <p className="lg-updated">{data.updated}</p>
          </div>
        </article>
      </div>

      <section className="container lg-cross" aria-labelledby="lg-cross-h">
        <div className="lg-cross-head">
          <h2 id="lg-cross-h" className="h3">Weitere Rechtstexte</h2>
          <Link to={R.contact} className="link-arrow">Fragen? Schreib uns <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="lg-cross-grid">
          {others.map((d) => {
            const Icon = DOC_ICONS[d.key];
            return (
              <Link key={d.key} to={d.path} className="lg-cross-card">
                <span className="lg-cross-ic"><Icon size={20} aria-hidden="true" /></span>
                <span className="lg-cross-txt"><strong>{d.label}</strong><span>{d.desc}</span></span>
                <ArrowRight size={17} className="lg-cross-arrow" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
