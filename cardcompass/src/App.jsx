import { Component, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Home from './pages/Home.jsx';
import { PREVIEW } from './lib/config.js';
import { R } from './lib/routes.js';

// After a deploy a stale tab may request chunks that no longer exist:
// retry once, then reload once (30 s guard) instead of showing a blank page.
const lazyPage = (imp) => lazy(() => imp().catch(() => new Promise((r) => setTimeout(r, 600)).then(imp)).catch((err) => {
  try {
    const last = Number(sessionStorage.getItem('cc_reload_at') || 0);
    if (Date.now() - last > 30000) { sessionStorage.setItem('cc_reload_at', String(Date.now())); window.location.reload(); return new Promise(() => {}); }
  } catch { /* ignore */ }
  throw err;
}));

const Shop = lazyPage(() => import('./pages/Shop.jsx'));
const Product = lazyPage(() => import('./pages/Product.jsx'));
const Cart = lazyPage(() => import('./pages/Cart.jsx'));
const Checkout = lazyPage(() => import('./pages/Checkout.jsx'));
const CheckoutResult = lazyPage(() => import('./pages/CheckoutResult.jsx'));
const Account = lazyPage(() => import('./pages/Account.jsx'));
const Auth = lazyPage(() => import('./pages/Auth.jsx'));
const Contact = lazyPage(() => import('./pages/Contact.jsx'));
const Legal = lazyPage(() => import('./pages/Legal.jsx'));
const Withdrawal = lazyPage(() => import('./pages/Withdrawal.jsx'));
const NotFound = lazyPage(() => import('./pages/NotFound.jsx'));

class Boundary extends Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(e) { console.error('[cardcompass]', e); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <div className="empty-ic" style={{ margin: '0 auto 16px' }}><AlertTriangle size={30} /></div>
        <h1 className="h2">Hier ist etwas schiefgelaufen</h1>
        <p className="lead" style={{ margin: '10px auto 24px', maxWidth: 520 }}>Lade die Seite neu – dein Warenkorb bleibt erhalten.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Neu laden</button>
          <Link className="btn btn-outline" to="/" onClick={() => this.setState({ error: null })}>Zur Startseite</Link>
        </div>
      </div>
    );
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const PageLoader = () => <div className="page-loader" aria-label="Lädt"><span className="loader-ring" /></div>;

export default function App() {
  const loc = useLocation();
  return (
    <>
      <a className="skip-link" href="#inhalt">Zum Inhalt springen</a>
      {PREVIEW && <div className="preview-bar">Vorschau des neuen CardCompass-Designs · Demo-Produkte · es werden keine echten Bestellungen ausgelöst</div>}
      <ScrollToTop />
      <Header />
      <main id="inhalt" className="main">
        <Boundary resetKey={loc.pathname}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={R.home} element={<Home />} />
              <Route path={R.shop} element={<Shop />} />
              <Route path="/produkt/:slug" element={<Product />} />
              <Route path={R.cart} element={<Cart />} />
              <Route path={R.checkout} element={<Checkout />} />
              <Route path={R.checkoutSuccess} element={<CheckoutResult status="success" />} />
              <Route path={R.checkoutCancel} element={<CheckoutResult status="cancel" />} />
              <Route path={R.account} element={<Account />} />
              <Route path={R.login} element={<Auth mode="login" />} />
              <Route path={R.register} element={<Auth mode="register" />} />
              <Route path={R.forgot} element={<Auth mode="forgot" />} />
              <Route path={R.resetPassword} element={<Auth mode="reset" />} />
              <Route path={R.contact} element={<Contact />} />
              <Route path={R.widerruf} element={<Withdrawal />} />
              <Route path={R.agb} element={<Legal doc="agb" />} />
              <Route path={R.widerrufsbelehrung} element={<Legal doc="widerrufsbelehrung" />} />
              <Route path={R.impressum} element={<Legal doc="impressum" />} />
              <Route path={R.datenschutz} element={<Legal doc="datenschutz" />} />
              <Route path={R.cookies} element={<Legal doc="cookies" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Boundary>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
