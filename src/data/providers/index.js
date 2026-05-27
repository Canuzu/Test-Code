// Game registry. Adding a new TCG later = implement a provider module with the
// same shape as pokemon.js (meta + async search()) and flip `enabled` to true.
import * as pokemon from './pokemon.js';

export const GAMES = [
  { id: 'pokemon', label: 'Pokémon', emoji: '⚡', enabled: true, provider: pokemon },
  { id: 'magic', label: 'Magic: The Gathering', emoji: '🔮', enabled: false, provider: null },
  { id: 'yugioh', label: 'Yu-Gi-Oh!', emoji: '🐉', enabled: false, provider: null },
  { id: 'onepiece', label: 'One Piece', emoji: '🏴‍☠️', enabled: false, provider: null },
];

export const getGame = (id) => GAMES.find((g) => g.id === id) || GAMES[0];
export const getProvider = (id) => {
  const g = getGame(id);
  return g.enabled ? g.provider : null;
};
