// Speicherstand im localStorage (Auto-Save).
const KEY = 'beastlings_save_v1';

export function hasSave() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function saveGame(state) {
  try {
    const data = {
      version: 2,
      player: state.player,
      party: state.party,
      box: state.box,
      dexSeen: [...state.dexSeen],
      dexCaught: [...state.dexCaught],
      balls: state.balls,
      playerName: state.playerName || '',
      defeatedTrainers: [...(state.defeatedTrainers || [])],
      gender: state.gender || 'boy',
      playtime: state.playtime || 0,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Speichern fehlgeschlagen', e);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return {
      player: d.player,
      party: d.party || [],
      box: d.box || [],
      dexSeen: new Set(d.dexSeen || []),
      dexCaught: new Set(d.dexCaught || []),
      balls: d.balls ?? 10,
      playerName: d.playerName || '',
      defeatedTrainers: new Set(d.defeatedTrainers || []),
      gender: d.gender || 'boy',
      playtime: d.playtime || 0,
    };
  } catch (e) {
    console.warn('Laden fehlgeschlagen', e);
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
