import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';
import { getFranchises } from '../lib/catalog.js';
import { R, shopPath } from '../lib/routes.js';
import { SHOP } from '../lib/config.js';

export const TRUST = [
  { Icon: ShieldCheck, t: 'Sicher bezahlen', d: 'Karte, PayPal, Klarna & mehr über Stripe' },
  { Icon: Truck, t: 'Schneller Versand', d: 'Sicher verpackt mit DHL' },
  { Icon: Sparkles, t: '100 % Originalware', d: 'Neu & original versiegelt' },
  { Icon: RotateCcw, t: '14 Tage Widerruf', d: 'Unkompliziert per Klick' },
];

export default function Footer() {
  const [fr, setFr] = useState([]);
  useEffect(() => { getFranchises().then(setFr).catch(() => {}); }, []);
  return (
    <footer className="ftr">
      <div className="ftr-trust">
        <div className="container ftr-trust-row">
          {TRUST.map(({ Icon, t, d }) => (
            <div key={t} className="trust-item"><span className="trust-ic"><Icon size={20} /></span><div><strong>{t}</strong><span>{d}</span></div></div>
          ))}
        </div>
      </div>
      <div className="container ftr-grid">
        <div className="ftr-brand">
          <Logo />
          <p>{SHOP.claim}</p>
          <Link to={R.widerruf} className="btn btn-outline btn-sm ftr-withdraw">Vertrag widerrufen</Link>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to={R.shop}>Alle Produkte</Link>
          {fr.slice(0, 6).map((f) => <Link key={f.slug} to={shopPath({ franchise: f.slug })}>{f.name}</Link>)}
        </div>
        <div>
          <h4>Service</h4>
          <Link to={R.account}>Mein Konto</Link>
          <Link to={R.cart}>Warenkorb</Link>
          <Link to={R.contact}>Kontakt</Link>
          <Link to={R.widerrufsbelehrung}>Versand & Rückgabe</Link>
        </div>
        <div>
          <h4>Rechtliches</h4>
          <Link to={R.agb}>AGB</Link>
          <Link to={R.widerrufsbelehrung}>Widerrufsbelehrung</Link>
          <Link to={R.impressum}>Impressum</Link>
          <Link to={R.datenschutz}>Datenschutz</Link>
          <Link to={R.cookies}>Cookies</Link>
        </div>
      </div>
      <div className="ftr-bottom">
        <div className="container ftr-bottom-row">
          <span>© {new Date().getFullYear()} CardCompass{SHOP.smallBusiness ? ' · Kleinunternehmer gem. § 19 UStG' : ''}</span>
          <span className="ftr-pay" aria-label="Zahlarten">
            {['Visa', 'Mastercard', 'PayPal', 'Klarna', 'Apple Pay', 'Google Pay', 'SEPA'].map((p) => <span key={p} className="pay-chip">{p}</span>)}
          </span>
        </div>
      </div>
      <p className="container ftr-tm">Pokémon, One Piece, Yu-Gi-Oh!, Magic: The Gathering, Digimon und alle weiteren genannten Marken gehören ihren jeweiligen Rechteinhabern. CardCompass ist ein unabhängiger Händler.</p>
    </footer>
  );
}
