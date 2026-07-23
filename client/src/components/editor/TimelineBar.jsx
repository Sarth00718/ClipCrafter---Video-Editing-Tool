const statusColor = {
  completed: '#c9a84c',
  processing: '#fbbf24',
  pending: 'var(--text-muted)',
  failed: '#f87171',
};

export default function TimelineBar({ scenes = [], selectedId, onSelect }) {
  return (
    <div style={{
      height: 80,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-default)',
      display: 'flex', alignItems: 'center',
      overflowX: 'auto', overflowY: 'hidden',
      padding: '0 16px', gap: 8,
    }}>
      {scenes.map((scene) => {
        const isSelected = scene._id === selectedId;
        const statusC = statusColor[scene.status] || 'var(--text-muted)';

        return (
          <button
            key={scene._id}
            onClick={() => onSelect(scene)}
            data-cursor="pointer"
            title={`Scene ${scene.sceneNumber}`}
            style={{
              flexShrink: 0,
              minWidth: 80,
              height: 52,
              borderRadius: 8,
              border: `2px solid ${isSelected ? 'var(--gold-primary)' : statusC + '30'}`,
              background: isSelected ? 'var(--gold-subtle)' : `${statusC}15`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              transform: isSelected ? 'scaleY(1.08)' : 'scaleY(1)',
              boxShadow: isSelected ? '0 0 12px var(--gold-glow)' : 'none',
              position: 'relative',
            }}
          >
            {/* Playhead */}
            {isSelected && (
              <div style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                width: 2, height: 8, background: 'var(--gold-primary)', borderRadius: 1,
              }} />
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, color: isSelected ? 'var(--gold-primary)' : 'var(--text-muted)' }}>
              S{String(scene.sceneNumber).padStart(2, '0')}
            </span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusC }} />
          </button>
        );
      })}
    </div>
  );
}
