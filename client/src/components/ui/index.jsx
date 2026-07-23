export function Badge({ variant = 'draft', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function ProgressBar({ value = 0, height = 6, showLabel = false }) {
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(value)}%</span>
        </div>
      )}
      <div className="progress-bar-track" style={{ height }}>
        <div className="progress-bar-fill" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export function Spinner({ size = 20, color = 'var(--gold-primary)' }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: '50%',
      border: `2px solid transparent`,
      borderTopColor: color,
      borderRightColor: color,
      animation: 'spin 0.6s linear infinite',
    }} />
  );
}

// Add spin keyframe if not in global CSS
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.head.querySelector('[data-spin]')) {
  style.setAttribute('data-spin', '1');
  document.head.appendChild(style);
}

export function SkeletonCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: 24,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div className="skeleton" style={{ height: 20, width: '70%' }} />
          <div className="skeleton" style={{ height: 14, width: '90%' }} />
          <div className="skeleton" style={{ height: 14, width: '60%' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="skeleton" style={{ height: 36, width: 100, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 36, width: 80, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}

// Export additional UI components
export { default as Loader } from './Loader.jsx';
export { default as ThemeToggle } from './ThemeToggle.jsx';
export { default as CustomCursor } from './CustomCursor.jsx';
export { default as ParticleField } from './ParticleField.jsx';
export { default as CommandPalette } from './CommandPalette.jsx';
export { default as RateLimitNotice } from './RateLimitNotice.jsx';
