import { useState } from 'react';

export default function NameEntry({ onConfirm }) {
  const [name, setName] = useState('');
  const trimmed = name.trim().slice(0, 12);

  function submit() {
    if (trimmed) onConfirm(trimmed);
  }

  return (
    <div className="screen-center">
      <div className="title-big" style={{ fontSize: 16 }}>Wie heißt du?</div>
      <div className="tiny" style={{ maxWidth: 260 }}>
        Trainer:innen und Weggefährt:innen in der Naturwelt werden dich bei
        diesem Namen ansprechen.
      </div>
      <input
        className="name-input"
        type="text"
        value={name}
        maxLength={12}
        autoFocus
        placeholder="Dein Name…"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
      />
      <button
        className="btn primary"
        disabled={!trimmed}
        onClick={submit}
        style={{ width: 220, textAlign: 'center' }}
      >
        Weiter
      </button>
    </div>
  );
}
