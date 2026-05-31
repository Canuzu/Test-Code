// Game registry — the catalogue of TCGs the app can track.
//
// Each game can have its own price provider (live data), a sample dataset, a
// snapshot path (the daily-built JSON for that game) and brand metadata for the
// landing page. Adding a new TCG = add an entry here (+ a sample dataset, and
// later a provider/snapshot). `enabled: false` shows it as "coming soon".
import * as pokemon from './pokemon.js';
import * as onepiece from './onepiece.js';

export const GAMES = [
  {
    id: 'pokemon',
    label: 'Pokémon',
    emoji: '⚡',
    enabled: true,
    provider: pokemon,
    accent: '#ffd700',
    accent2: '#ff6b35',
    tagline: 'Cardmarket EU · 19.000+ Karten',
    blurb: 'Vollständiges Pokémon-Archiv mit Live-Preisen, Charts, Sammlung & Alerts.',
    // Pokémon keeps the original snapshot path so the existing daily crawler and
    // committed data file stay untouched.
    snapshot: 'data/cards.json',
  },
  {
    id: 'onepiece',
    label: 'One Piece',
    emoji: '🏴‍☠️',
    enabled: true,
    provider: onepiece,
    accent: '#e23b3b',
    accent2: '#ffb300',
    tagline: 'Alle Sets · 4.300+ Karten · offizielle Bilder',
    blurb: 'Vollständiges One-Piece-Archiv: jedes Set & jede Karte mit offiziellem Artwork. Preise als Schätzung (Cardmarket-Link je Karte) bis zur MKM-API.',
    snapshot: 'data/onepiece.json',
  },
  {
    id: 'magic',
    label: 'Magic: The Gathering',
    emoji: '🔮',
    enabled: false,
    provider: null,
    accent: '#8b5cf6',
    accent2: '#3b82f6',
    tagline: 'Bald verfügbar',
    blurb: 'In Vorbereitung.',
    snapshot: null,
  },
  {
    id: 'yugioh',
    label: 'Yu-Gi-Oh!',
    emoji: '🐉',
    enabled: false,
    provider: null,
    accent: '#f59e0b',
    accent2: '#b45309',
    tagline: 'Bald verfügbar',
    blurb: 'In Vorbereitung.',
    snapshot: null,
  },
];

export const getGame = (id) => GAMES.find((g) => g.id === id) || GAMES[0];
export const getProvider = (id) => {
  const g = getGame(id);
  return g.enabled ? g.provider : null;
};
// Snapshot URL for a game's daily-built dataset (null if it has none yet).
export const gameSnapshot = (id) => getGame(id).snapshot;
