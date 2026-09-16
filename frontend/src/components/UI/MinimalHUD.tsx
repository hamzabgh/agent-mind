import type { AppState } from '@/state/store';

interface MinimalHUDProps {
  view: AppState['view'];
  onNavigate: (view: AppState['view']) => void;
}

const NAV: { label: string; view: AppState['view'] }[] = [
  { label: 'MIND', view: 'FACE' },
  { label: 'WORK', view: 'WORLD' },
  { label: 'EXPLORE', view: 'WORLD' },
];

/**
 * Almost no traditional UI: identity top-left, three quiet nav words
 * top-right. No cards, no sidebar, no dashboard chrome.
 */
export function MinimalHUD({ view, onNavigate }: MinimalHUDProps) {
  return (
    <div className="hud-top" style={{ position: 'absolute', top: 24, left: 24, right: 24, pointerEvents: 'none' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '0.04em', color: '#eef4f6' }}>
          HAMZA BOUGHANIM
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(238,244,246,0.5)', marginTop: 4 }}>
          AI/ML ENGINEER &amp; FULL-STACK DEVELOPER
        </div>
      </div>

      <nav className="hud-nav" style={{ display: 'flex', gap: 22, paddingTop: 4, pointerEvents: 'auto' }}>
        {NAV.map((item, i) => {
          const active = item.view === view && (i !== 0 || view === 'FACE');
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className="mono"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: '0.16em',
                color: active ? '#ffd08a' : 'rgba(238,244,246,0.55)',
                transition: 'color 0.3s ease',
                padding: 4,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
