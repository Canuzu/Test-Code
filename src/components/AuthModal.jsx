import { useState } from 'react';
import { X, Copy, Check, LogOut, Users, Plus, LogIn } from 'lucide-react';
import { useStore } from '../store.jsx';
import { C } from '../lib/theme.js';
import { isConfigured } from '../lib/supabase.js';

export default function AuthModal({ onClose }) {
  const { user, team, profile, authLoading, signIn, signUp, signOut, createTeam, joinTeam, leaveTeam, showToast } = useStore();
  const [tab, setTab]         = useState('login');   // 'login' | 'register'
  const [teamTab, setTeamTab] = useState('create');  // 'create' | 'join'
  const [form, setForm]       = useState({ email: '', password: '', name: '', shopName: '', teamName: '', code: '' });
  const [err, setErr]         = useState('');
  const [done, setDone]       = useState(false);     // signup email-sent screen
  const [copied, setCopied]   = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (ev) => {
    ev.preventDefault(); setErr('');
    try { await signIn(form.email, form.password); onClose(); }
    catch (e) { setErr(e.message); }
  };

  const handleRegister = async (ev) => {
    ev.preventDefault(); setErr('');
    if (form.password.length < 6) { setErr('Passwort min. 6 Zeichen'); return; }
    try { await signUp(form.email, form.password, form.name, form.shopName); setDone(true); }
    catch (e) { setErr(e.message); }
  };

  const handleCreateTeam = async (ev) => {
    ev.preventDefault(); setErr('');
    try { await createTeam(form.teamName); }
    catch (e) { setErr(e.message); }
  };

  const handleJoinTeam = async (ev) => {
    ev.preventDefault(); setErr('');
    try { await joinTeam(form.code); }
    catch (e) { setErr(e.message); }
  };

  const handleLeave = async () => {
    const msg = team?.role === 'owner'
      ? 'Team löschen? Alle Team-Daten werden entfernt.'
      : 'Team verlassen?';
    if (!confirm(msg)) return;
    await leaveTeam();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(team?.invite_code || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (!isConfigured) {
    return (
      <Overlay onClose={onClose}>
        <Box>
          <Hdr title="Cloud-Sync" onClose={onClose} />
          <div style={{ padding: 28, textAlign: 'center', color: C.textDim }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 10 }}>Supabase nicht konfiguriert</div>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              Füge in den GitHub Secrets hinzu:<br />
              <code style={code}>VITE_SUPABASE_URL</code><br />
              <code style={code}>VITE_SUPABASE_ANON_KEY</code>
            </div>
          </div>
        </Box>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <Box>
        <Hdr title={user ? (profile?.name || user.email?.split('@')[0] || 'Profil') : 'Konto'} onClose={onClose} />

        {!user ? (
          <div style={{ padding: '0 22px 22px' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.textDim }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📧</div>
                <div style={{ fontWeight: 700, color: C.text }}>E-Mail bestätigen</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Wir haben dir einen Bestätigungslink geschickt.<br />Danach kannst du dich anmelden.</div>
                <button onClick={() => setDone(false)} style={{ ...ghost, marginTop: 16 }}>Zurück zur Anmeldung</button>
              </div>
            ) : (
              <>
                <Tabs items={[['login','Anmelden'],['register','Registrieren']]} active={tab} onChange={(v) => { setTab(v); setErr(''); }} />
                {tab === 'login' ? (
                  <form onSubmit={handleLogin}>
                    <Field label="E-Mail"    type="email"    value={form.email}    onChange={set('email')} />
                    <Field label="Passwort"  type="password" value={form.password} onChange={set('password')} />
                    {err && <Err msg={err} />}
                    <Btn loading={authLoading}>Anmelden</Btn>
                  </form>
                ) : (
                  <form onSubmit={handleRegister}>
                    <Field label="Name"                  value={form.name}     onChange={set('name')} />
                    <Field label="Shopname (optional)"   value={form.shopName} onChange={set('shopName')} placeholder="z.B. TCG-Corner Köln" required={false} />
                    <Field label="E-Mail"    type="email"    value={form.email}    onChange={set('email')} />
                    <Field label="Passwort"  type="password" value={form.password} onChange={set('password')} placeholder="min. 6 Zeichen" />
                    {err && <Err msg={err} />}
                    <Btn loading={authLoading}>Konto erstellen</Btn>
                  </form>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ padding: '0 22px 22px' }}>
            {/* Profile card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.bg2, borderRadius: 10, marginBottom: 20 }}>
              <Avatar letter={(profile?.name || user.email || '?')[0].toUpperCase()} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{profile?.name || '–'}</div>
                {profile?.shop_name && <div style={{ fontSize: 11, color: C.gold }}>{profile.shop_name}</div>}
                <div style={{ fontSize: 11, color: C.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <div title="Verbunden" style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            </div>

            {/* Team */}
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Team</div>
            {team ? (
              <div style={{ background: C.bg2, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Users size={15} color={C.blue} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{team.name}</span>
                  <span style={{ fontSize: 10, color: C.textFaint, marginLeft: 'auto' }}>
                    {team.role === 'owner' ? '👑 Besitzer' : '👤 Mitglied'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 6 }}>Einladungscode (für Teammates):</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 20, fontWeight: 800, letterSpacing: 4, color: C.gold, background: '#ffd70015', border: `1px solid ${C.gold}30`, borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    {team.invite_code}
                  </div>
                  <button onClick={copyCode} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: C.surface, color: C.text, cursor: 'pointer', display: 'flex' }}>
                    {copied ? <Check size={15} color={C.green} /> : <Copy size={15} />}
                  </button>
                </div>
                <button onClick={handleLeave} style={{ marginTop: 12, width: '100%', padding: 8, borderRadius: 8, border: `1px solid #ff525230`, background: '#ff525210', color: C.red, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {team.role === 'owner' ? '🗑️ Team löschen' : '← Team verlassen'}
                </button>
              </div>
            ) : (
              <div style={{ background: C.bg2, borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
                <Tabs items={[['create','+ Erstellen'],['join','→ Beitreten']]} active={teamTab} onChange={(v) => { setTeamTab(v); setErr(''); }} compact />
                <div style={{ padding: 12 }}>
                  {teamTab === 'create' ? (
                    <form onSubmit={handleCreateTeam}>
                      <Field label="Teamname (z.B. euer Shop)" value={form.teamName} onChange={set('teamName')} placeholder="TCG Corner Berlin" />
                      {err && <Err msg={err} />}
                      <Btn><Plus size={13} /> Team erstellen</Btn>
                    </form>
                  ) : (
                    <form onSubmit={handleJoinTeam}>
                      <Field label="6-stelliger Einladungscode" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ABC123" maxLength={6} />
                      {err && <Err msg={err} />}
                      <Btn><LogIn size={13} /> Team beitreten</Btn>
                    </form>
                  )}
                </div>
              </div>
            )}

            <button onClick={async () => { await signOut(); onClose(); }} style={ghost}>
              <LogOut size={14} /> Abmelden
            </button>
          </div>
        )}
      </Box>
    </Overlay>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function Overlay({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000080', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
function Box({ children }) {
  return <div style={{ width: '100%', maxWidth: 420, background: C.bg1, border: `1px solid ${C.lineStrong}`, borderRadius: 16, overflow: 'hidden' }}>{children}</div>;
}
function Hdr({ title, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.lineStrong}` }}>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      <button onClick={onClose} style={{ border: 'none', background: 'none', color: C.textFaint, cursor: 'pointer', padding: 4, display: 'flex' }}><X size={18} /></button>
    </div>
  );
}
function Tabs({ items, active, onChange, compact }) {
  return (
    <div style={{ display: 'flex', background: compact ? 'none' : C.bg2, borderRadius: compact ? 0 : 8, padding: compact ? 0 : 3, margin: compact ? 0 : '16px 0 14px', borderBottom: compact ? `1px solid ${C.lineStrong}` : 'none' }}>
      {items.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} style={{ flex: 1, padding: compact ? '8px 0' : '7px 0', border: 'none', borderRadius: compact ? 0 : 6, background: active === id ? (compact ? 'none' : C.surface) : 'transparent', color: active === id ? (compact ? C.gold : C.text) : C.textFaint, fontWeight: active === id ? 700 : 500, fontSize: 13, cursor: 'pointer', borderBottom: compact ? (active === id ? `2px solid ${C.gold}` : '2px solid transparent') : 'none' }}>
          {label}
        </button>
      ))}
    </div>
  );
}
function Field({ label, value, onChange, type = 'text', placeholder, maxLength, required = true }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} required={required} className="control" style={{ width: '100%' }} />
    </div>
  );
}
function Err({ msg }) {
  return <div style={{ fontSize: 12, color: C.red, marginBottom: 10, padding: '6px 10px', background: '#ff525215', borderRadius: 6 }}>{msg}</div>;
}
function Btn({ children, loading }) {
  return (
    <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#ffd700,#ff6b35)', color: '#0c0c1a', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {loading ? 'Laden…' : children}
    </button>
  );
}
function Avatar({ letter }) {
  return <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#448aff,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{letter}</div>;
}

const code = { background: '#ffffff12', padding: '2px 8px', borderRadius: 4, fontSize: 12, display: 'inline-block', margin: '2px 0' };
const ghost = { width: '100%', padding: 9, borderRadius: 8, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.textDim, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
