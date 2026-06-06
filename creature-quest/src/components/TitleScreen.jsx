import PixelSprite from './PixelSprite.jsx';

export default function TitleScreen({ onNew, onContinue, canContinue }) {
  return (
    <div className="screen-center">
      <div style={{ display: 'flex', gap: 8 }}>
        <PixelSprite id={3} type="feuer" body="beast" size={64} />
        <PixelSprite id={6} type="wasser" body="fish" size={64} />
        <PixelSprite id={9} type="pflanze" body="beast" size={64} />
      </div>
      <div className="title-big">BEASTLINGS<br />QUEST</div>
      <div className="tiny">Ein Monster-Sammel-Abenteuer<br />in der Naturwelt</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 220 }}>
        {canContinue && (
          <button className="btn good" onClick={onContinue} style={{ textAlign: 'center' }}>
            Spiel fortsetzen
          </button>
        )}
        <button className="btn primary" onClick={onNew} style={{ textAlign: 'center' }}>
          Neues Abenteuer
        </button>
      </div>
      <div className="tiny" style={{ marginTop: 8 }}>
        Steuerung: Pfeiltasten / WASD · Touch-Pad unten
      </div>
    </div>
  );
}
