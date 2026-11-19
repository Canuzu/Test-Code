import { Link } from 'react-router-dom';

const LOGO = `${import.meta.env.BASE_URL}cardcompass-logo.png`;

// Original CardCompass mark + wordmark ("Card" ink, "Compass" purple).
export default function Logo({ size = 38, to = '/', onClick, light = false }) {
  return (
    <Link to={to} onClick={onClick} className={`logo ${light ? 'logo-light' : ''}`} aria-label="CardCompass – Startseite">
      <span className="logo-mark" style={{ width: size, height: size }}>
        <img src={LOGO} alt="" width={size} height={size} />
      </span>
      <span className="logo-word"><span>Card</span><span className="logo-accent">Compass</span></span>
    </Link>
  );
}
