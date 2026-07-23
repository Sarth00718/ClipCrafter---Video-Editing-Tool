import { motion } from 'framer-motion';
import { Edit3, Shield, Brain, Activity, History, Zap } from 'lucide-react';
import { staggerContainer, scaleIn } from '../../utils/animations.js';
import { FEATURES } from '../../utils/seedData.js';
import { useCardTilt } from '../../hooks/index.js';

const iconMap = { Edit3, Shield, Brain, Activity, History, Zap };

function FeatureCard({ feature, index }) {
  const tiltRef = useCardTilt();
  const Icon = iconMap[feature.icon] || Zap;

  return (
    <motion.div
      ref={tiltRef}
      variants={scaleIn}
      data-cursor="pointer"
      className="glass-card card-3d"
      style={{
        padding: '28px',
        display: 'flex', flexDirection: 'column', gap: 16,
        cursor: 'default',
        transformStyle: 'preserve-3d',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'var(--gradient-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px var(--gold-glow)',
        flexShrink: 0,
      }}>
        <Icon size={22} color="#0a0806" />
      </div>

      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          {feature.title}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {feature.desc}
        </p>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: 0, transition: 'opacity 0.2s' }} className="learn-more">
          Learn more →
        </span>
      </div>

      <style>{`
        .glass-card:hover .learn-more { opacity: 1 !important; }
      `}</style>
    </motion.div>
  );
}

export default function FeatureCards() {
  return (
    <section id="features" className="section" style={{ position: 'relative' }}>
      {/* background stripe pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(201,168,76,0.015) 40px, rgba(201,168,76,0.015) 80px)',
        pointerEvents: 'none',
      }} />
      <div className="container" style={{ position: 'relative' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <span className="section-label" style={{ marginBottom: 20, display: 'inline-flex' }}>Why ClipCrafters</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 16 }}>
            Built for <span className="gradient-text">Accuracy & Control</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
            Every feature designed around the needs of researchers, educators, and professionals who can't afford inaccurate AI output.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </motion.div>
      </div>
    </section>
  );
}
