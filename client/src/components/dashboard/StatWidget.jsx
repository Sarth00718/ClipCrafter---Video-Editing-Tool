import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAnimatedCounter } from '../../hooks/index.js';
import { scaleIn } from '../../utils/animations.js';

const StatWidget = memo(function StatWidget({ label, value, trend, iconName, IconComponent }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const { count, ref } = useAnimatedCounter(numericValue, 1500, true);
  const isUp = trend && !trend.startsWith('-');

  return (
    <motion.div
      variants={scaleIn}
      ref={ref}
      className="glass-card"
      style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}
    >
      {/* Icon */}
      {IconComponent && (
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gold-subtle)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconComponent size={20} color="var(--gold-primary)" />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 500, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 800 }} className="gradient-text">
          {count}
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: isUp ? '#4ade80' : '#f87171', marginTop: 2 }}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default StatWidget;
