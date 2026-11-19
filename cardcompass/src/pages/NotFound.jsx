import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { usePageMeta } from '../lib/hooks.js';
import { R } from '../lib/routes.js';

export default function NotFound() {
  usePageMeta('Seite nicht gefunden');
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <div className="empty-ic" style={{ margin: '0 auto 18px' }}><Compass size={34} /></div>
      <p className="eyebrow">Fehler 404</p>
      <h1 className="h1" style={{ marginTop: 8 }}>Hier führt der Kompass ins Leere.</h1>
      <p className="lead" style={{ maxWidth: 520, margin: '14px auto 28px' }}>Die Seite gibt es nicht (mehr). Aber im Shop wartet bestimmt etwas für dich.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={R.shop} className="btn btn-primary">Zum Shop <ArrowRight size={17} /></Link>
        <Link to={R.home} className="btn btn-outline">Startseite</Link>
      </div>
    </div>
  );
}
