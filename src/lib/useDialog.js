import { useEffect, useRef } from 'react';

// Accessibility for modal dialogs: move focus into the dialog on open, trap Tab
// within it, close on Escape, and restore focus to the trigger on close. Attach
// the returned ref to the dialog's content element and give it
// role="dialog" aria-modal="true" tabIndex={-1} plus an aria-label.
const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useDialog(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    const prevFocus = document.activeElement;
    const focusables = () => (node ? [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null) : []);
    // Focus the first control (or the dialog itself) so keyboard users start inside.
    (focusables()[0] || node)?.focus?.();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
      if (e.key === 'Tab' && node) {
        const f = focusables();
        if (!f.length) { e.preventDefault(); node.focus?.(); return; }
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      try { prevFocus?.focus?.(); } catch { /* ignore */ }
    };
  }, [onClose]);
  return ref;
}
