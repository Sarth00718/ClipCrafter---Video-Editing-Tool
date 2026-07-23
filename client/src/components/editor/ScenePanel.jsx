import { ProgressBar } from '../ui/index.jsx';

const statusDot = {
  completed: '#4ade80',
  processing: '#fbbf24',
  pending: 'var(--text-muted)',
  failed: '#f87171',
};

export default function ScenePanel({ scenes = [], selectedId, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Scenes</h3>
        <span className="badge badge-gold">{scenes.length}</span>
      </div>

      {/* Scene list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {scenes.map((scene) => {
          const isSelected = scene._id === selectedId;

          return (
            <button
              key={scene._id}
              onClick={() => onSelect(scene)}
              data-cursor="pointer"
              style={{
                width: '100%', display: 'flex', flexDirection: 'column', gap: 6,
                padding: '12px 14px', borderRadius: 10, border: 'none',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 4,
                background: isSelected ? 'var(--gold-subtle)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--gold-primary)' : '3px solid transparent',
                boxShadow: isSelected ? 'inset 0 0 20px rgba(201,168,76,0.05)' : 'none',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                  {String(scene.sceneNumber).padStart(2, '0')}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot[scene.status] || 'var(--text-muted)', flexShrink: 0 }} />
              </div>

              {/* Script preview */}
              {scene.scriptText && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                  {scene.scriptText}
                </p>
              )}

              {/* Confidence */}
              {scene.confidenceScore != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProgressBar value={scene.confidenceScore * 100} height={3} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {Math.round(scene.confidenceScore * 100)}%
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
