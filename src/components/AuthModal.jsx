import { useState } from 'react';
import { X, User, LogOut, ShieldCheck } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';

export default function AuthModal({ onClose }) {
  const { account, login, register, logout, cloudEnabled } = useStore();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const field = { width: '100%', marginTop: 4, marginBottom: 10, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none' };
  const label = { fontSize: 11, color: C.textFaint, fontWeight: 700 };

  const submit = async () => {
    setError(''); setBusy(true);
    const res = mode === 'login' ? await login({ email, password }) : await register({ email, name, password });
    setBusy(false);
    if (res?.error) setError(res.error);
    else onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(8px)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-in" style={{ background: C.surface, border: `1px solid ${C.lineStrong}`, borderRadius: 16, maxWidth: 420, width: '100%', padding: 22, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#ffffff15', border: 'none', color: C.textSoft, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

        {account ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#ffd700,#ff6b35)', color: '#0c0c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                {(account.name || account.email).slice(0, 1).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{account.name}</div>
                <div style={{ fontSize: 12, color: C.textDim, overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6, marginBottom: 16 }}>
              Du bist angemeldet. Watchlist, Sammlung, Buylist, Alerts und Einstellungen werden für dieses Konto gespeichert
              {cloudEnabled ? ' und geräteübergreifend synchronisiert.' : ' (separat je Konto, nur in diesem Browser).'}
            </div>
            <button onClick={() => { logout(); onClose(); }} className="control" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 11, color: C.red, borderColor: '#ff525240' }}>
              <LogOut size={15} /> Abmelden
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <User size={18} style={{ color: C.gold }} />
              <div style={{ fontSize: 17, fontWeight: 800 }}>{mode === 'login' ? 'Anmelden' : 'Konto erstellen'}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: C.bg2, border: `1px solid ${C.lineStrong}`, borderRadius: 10, padding: 3, margin: '12px 0 16px' }}>
              {[['login', 'Anmelden'], ['register', 'Registrieren']].map(([m, lbl]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: mode === m ? '#ffd70022' : 'transparent', color: mode === m ? C.gold : C.textFaint }}>{lbl}</button>
              ))}
            </div>

            {mode === 'register' && (
              <label style={label}>Name (optional)
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Mein Laden" style={field} />
              </label>
            )}
            <label style={label}>E-Mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="du@beispiel.de" style={field} />
            </label>
            <label style={label}>Passwort
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} placeholder="mind. 6 Zeichen" style={field} />
            </label>

            {error && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{error}</div>}

            <button className="btn-primary" onClick={submit} disabled={busy} style={{ width: '100%', padding: 11 }}>
              {busy ? '…' : mode === 'login' ? 'Anmelden' : 'Konto erstellen & anmelden'}
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 10.5, color: C.textGhost, marginTop: 14, lineHeight: 1.6 }}>
              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{cloudEnabled
                ? 'Sicheres Konto über Supabase: Anmeldung serverseitig, deine Sammlung wird verschlüsselt übertragen und geräteübergreifend synchronisiert.'
                : 'Lokales Konto: Daten und Passwort (PBKDF2-gehasht) bleiben nur in diesem Browser — kein Server. Für echte Konten über Geräte hinweg wird später ein Backend angebunden.'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
