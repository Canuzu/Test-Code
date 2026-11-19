import { useEffect, useRef, useState } from 'react';

// Run an async loader and expose { data, error, loading }; re-runs on deps.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve().then(fn).then(
      (data) => { if (alive) setState({ data, error: null, loading: false }); },
      (error) => { if (alive) setState({ data: null, error, loading: false }); },
    );
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

// Sets document.title (+ meta description) per page.
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · CardCompass` : 'CardCompass – Trading Cards, Displays & Zubehör';
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}

// Pointer-driven tilt/shine: writes --rx/--ry/--mx/--my on the element.
export function useTilt(max = 10) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    let raf = 0; let ev = null;
    const apply = () => {
      raf = 0; if (!ev) return;
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width; const y = (ev.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    };
    const move = (e) => { if (e.pointerType === 'touch') return; ev = e; if (!raf) raf = requestAnimationFrame(apply); };
    const leave = () => { ev = null; ['--rx', '--ry'].forEach((k) => el.style.setProperty(k, '0deg')); el.style.setProperty('--mx', '50%'); el.style.setProperty('--my', '30%'); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); if (raf) cancelAnimationFrame(raf); };
  }, [max]);
  return ref;
}

// Reveal-on-scroll: adds .is-in when the element enters the viewport.
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) { el.classList.add('is-in'); return undefined; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function useTheme() {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  useEffect(() => {
    if (theme === 'dark') document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('cc_theme', theme); } catch { /* ignore */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d0718' : '#8b00ff');
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}
