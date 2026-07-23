import { useState, useEffect } from 'react';
import { Snowflake } from 'lucide-react';

export default function SnowfallToggle({ onToggle }) {
  const [enabled, setEnabled] = useState(
    localStorage.getItem('snowfall') !== 'false'
  );

  const toggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    localStorage.setItem('snowfall', newState);
    onToggle?.(newState);
  };

  return (
    <button
      onClick={toggle}
      className="btn-icon hover-glow"
      title={enabled ? 'Disable Snowfall' : 'Enable Snowfall'}
      data-cursor="pointer"
    >
      <Snowflake 
        size={18} 
        style={{ 
          color: enabled ? 'var(--primary)' : 'var(--text-muted)',
          fill: enabled ? 'var(--primary-subtle)' : 'none',
          transition: 'all 0.3s ease'
        }} 
      />
    </button>
  );
}
