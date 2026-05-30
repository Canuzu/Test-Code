// Tiny media-query hook. Lets components render a layout that adapts to the
// viewport (e.g. a compact phone header) without a separate mobile site — the
// same URL simply reflows. Client-only SPA, so window.matchMedia exists at
// first render (no SSR/hydration mismatch).
import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    // addEventListener is the modern API; addListener is the Safari/old fallback.
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

// Phones: matches the 719px breakpoint used by the CSS (bottom-nav etc.).
export const useIsMobile = () => useMediaQuery('(max-width: 719px)');
