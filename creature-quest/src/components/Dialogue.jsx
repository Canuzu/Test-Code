import { useEffect, useState } from 'react';

// Einfache Textbox: zeigt eine Zeile nach der anderen, weiter per Klick/Enter/Leertaste.
export default function Dialogue({ name, lines, onDone }) {
  const [idx, setIdx] = useState(0);

  function advance() {
    if (idx < lines.length - 1) setIdx((i) => i + 1);
    else onDone();
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <div className="dialogue-wrap" onClick={advance}>
      <div className="dialogue-box">
        {name && <div className="dialogue-name">{name}</div>}
        <div className="dialogue-text">{lines[idx]}</div>
        <div className="tiny" style={{ textAlign: 'right' }}>
          {idx < lines.length - 1 ? '▼ weiter' : '▼ schließen'}
        </div>
      </div>
    </div>
  );
}
