import React from 'react';
import { motion } from 'framer-motion';
import { useIntersection } from '../../hooks/useIntersection.js';
import useAnimatedCounter from '../../hooks/useAnimatedCounter.js';
import { Film, Users2, Zap, Star } from 'lucide-react';

const stats = [
  { id: 1, label: 'Videos Generated', value: 2400,  prefix: '', suffix: 'k+', icon: Film },
  { id: 2, label: 'Active Creators',   value: 10000, prefix: '', suffix: '+',  icon: Users2 },
  { id: 3, label: 'Processing Speed',  value: 10,    prefix: '', suffix: 'x',  icon: Zap },
  { id: 4, label: 'Satisfaction',      value: 99,    prefix: '', suffix: '%',  icon: Star },
];

export default function StatsSection() {
  const { elementRef, isIntersecting } = useIntersection({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={elementRef} style={{ padding: '80px 0', position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
      {/* Decorative skewed accent */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(201,168,76,0.04)', transform: 'skewY(3deg)', transformOrigin: 'bottom left', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="stats-section-grid">
          {stats.map((stat, idx) => (
            <StatCard key={stat.id} stat={stat} isIntersecting={isIntersecting} delay={idx * 0.1} />
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .stats-section-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
    </section>
  );
}

function StatCard({ stat, isIntersecting, delay }) {
  const count = useAnimatedCounter(stat.value, 2000, isIntersecting);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isIntersecting ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      style={{
        padding: 24,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(8px)',
        borderRadius: 'var(--radius-card, 16px)',
        borderTop: '4px solid var(--gold-primary)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        transition: 'transform 0.3s ease',
        cursor: 'default',
      }}
      whileHover={{ y: -8 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: '50%', marginBottom: 16, border: '1px solid var(--border-default)' }}>
          <stat.icon size={24} style={{ color: 'var(--gold-primary)' }} />
        </div>
        <div className="gradient-text" style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: 8 }}>
          {stat.prefix}{typeof count === 'number' ? count.toLocaleString() : count}{stat.suffix}
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
          {stat.label}
        </div>
      </div>
    </motion.div>
  );
}
