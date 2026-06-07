import CreatureSprite from './CreatureSprite.jsx';

export default function TitleScreen({ onNew, onContinue, canContinue }) {
  return (
    <div className="screen-center">
      <div className="title-big title-glow" style={{ fontSize: 22, letterSpacing: 1 }}>
        BEASTLINGS<br />QUEST
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <span className="title-creature"><CreatureSprite id={3}  type="feuer"   body="beast" size={80} /></span>
        <span className="title-creature"><CreatureSprite id={6}  type="wasser"  body="fish"  size={80} /></span>
        <span className="title-creature"><CreatureSprite id={9}  type="pflanze" body="beast" size={80} /></span>
      </div>
      <div className="tiny" style={{ lineHeight: 2 }}>
        Ein Monster-Sammel-Abenteuer<br />in der Naturwelt
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 230 }}>
        {canContinue && (
          <button className="btn good" onClick={onContinue} style={{ textAlign: 'center' }}>
            ▶ Spiel fortsetzen
          </button>
        )}
        <button className="btn primary" onClick={onNew} style={{ textAlign: 'center' }}>
          ★ Neues Abenteuer
        </button>
      </div>
      <div className="title-press-start">▸ Drücke Start ◂</div>
      <div className="tiny" style={{ marginTop: 4 }}>
        Pfeiltasten · WASD · Touch-Pad
      </div>
    </div>
  );
}
