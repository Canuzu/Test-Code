import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';
import { getFranchises } from '../lib/catalog.js';
import { R, shopPath } from '../lib/routes.js';
import { SHOP } from '../lib/config.js';

// The shop's promises – only what the owner confirmed (fair prices / no
// scalping, fast shipping) plus the statutory withdrawal right.
export const TRUST = [
  { Icon: Scale, t: 'Faire Preise', d: 'Hype-Releases zum regulären Preis' },
  { Icon: ShieldCheck, t: 'Kein Scalping', d: 'Fair-Limit pro Bestellung bei gefragten Produkten' },
  { Icon: Truck, t: 'Schneller Versand', d: 'Deine Bestellung geht zügig raus' },
  { Icon: RotateCcw, t: '14 Tage Widerruf', d: 'Unkompliziert per Klick' },
];

export default function Footer() {
  const [fr, setFr] = useState([]);
  useEffect(() => { getFranchises().then(setFr).catch(() => {}); }, []);
  return (
    <footer className="ftr">
      <div className="container">
        <div className="ftr-grid">
          <div className="ftr-brand">
            <Logo size={32} light />
            <p>{SHOP.claim}</p>
            <Link to={R.widerruf} className="btn btn-glass btn-sm">Vertrag widerrufen</Link>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to={R.shop}>Alle Produkte</Link>
            <Link to={shopPath({ sort: 'new' })}>Neuheiten</Link>
            {fr.slice(0, 5).map((f) => <Link key={f.slug} to={shopPath({ franchise: f.slug })}>{f.name}</Link>)}
          </div>
          <div>
            <h4>Service</h4>
            <Link to={R.account}>Mein Konto</Link>
            <Link to={R.cart}>Warenkorb</Link>
            <Link to={R.contact}>Kontakt & FAQ</Link>
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
          <span>© {new Date().getFullYear()} CardCompass{SHOP.smallBusiness ? ' · Kleinunternehmer gem. § 19 UStG' : ''}</span>
          <span className="ftr-pay">Karte · PayPal · Klarna · Apple Pay · Google Pay · SEPA</span>
        </div>
        <p className="ftr-tm">Pokémon, One Piece, Yu-Gi-Oh!, Magic: The Gathering, Digimon und alle weiteren genannten Marken gehören ihren jeweiligen Rechteinhabern. CardCompass ist ein unabhängiger Händler.</p>
      </div>
    </footer>
  );
}
