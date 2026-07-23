import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Film, Play, ChevronDown, Cpu, Wand2, Stars } from 'lucide-react';
import ParticleField from '../ui/ParticleField.jsx';
import { IMAGES } from '../../utils/imageLoader.js';
import { fadeUpVariant } from '../../utils/animations.js';

export default function HeroSection() {
  const { scrollY } = useScroll();

  // Parallax effects
  const yImage = useTransform(scrollY, [0, 1000], [0, 400]);
  const opacityLayer = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <section style={{ position: 'relative', height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* 1. Underlying Particles */}
      <ParticleField />

      {/* 2. Parallax Cinematic Background */}
      <motion.div
        style={{ y: yImage, position: 'absolute', inset: 0, zIndex: 0, transformOrigin: 'center', userSelect: 'none', pointerEvents: 'none' }}
      >
        <img
          src={IMAGES.hero}
          alt="Cinematic Background"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }}
        />
        {/* 3. Dark gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, var(--bg-primary), rgba(10,8,6,0.8), var(--bg-primary))' }} />
      </motion.div>

      {/* 4. Content Layer */}
      <motion.div
        style={{ opacity: opacityLayer, position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 48 }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', marginBottom: 32, boxShadow: 'var(--shadow-glow)' }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>AI-Powered Video Creation</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 24, maxWidth: 900 }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {['Edit', 'Videos.', 'Like', 'A', 'Funded', 'Startup.'].map((word, i) => (
            <motion.span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '0.2em',
                ...(word === 'Startup.' || word === 'Videos.'
                  ? { background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
                  : { color: 'var(--text-primary)' }),
              }}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 40, maxWidth: 640, lineHeight: 1.7, fontFamily: 'var(--font-body)' }}
        >
          Transform structured research, papers, and ideas into cinematic video experiences with agentic AI constraints.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link
            to="/register"
            className="btn-primary"
            data-cursor="pointer"
            style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Start Creating <Film size={18} />
          </Link>
          <button
            style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontWeight: 700, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: '1rem' }}
            data-cursor="pointer"
          >
            Watch Demo <Play size={18} style={{ fill: 'currentColor' }} />
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Trusted by 10,000+ creators
          </p>
          <div style={{ display: 'flex' }}>
            {[
              '1535713875002-d1d0cf377fde',
              '1611532736597-de2d4265fba3',
              '1598899134739-24c46f58b8c0',
              '1574375927938-2b66ca05fed8',
              '1542744173-8e7e53415bb0',
            ].map((id, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--bg-primary)', background: 'var(--bg-elevated)', overflow: 'hidden', marginLeft: i === 0 ? 0 : -12 }}>
                <img
                  src={`https://images.unsplash.com/photo-${id}?w=100&h=100&fit=crop`}
                  alt="User"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* 5. Floating 3D Elements */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <FloatingIcon icon={Cpu} top="20%" left="15%" delay={0} />
        <FloatingIcon icon={Wand2} top="30%" right="20%" delay={1} />
        <FloatingIcon icon={Stars} top="70%" left="25%" delay={2} />
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'var(--text-muted)', zIndex: 10 }}
      >
        <ChevronDown size={24} style={{ animation: 'bounce 2s infinite' }} />
      </motion.div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
      `}</style>
    </section>
  );
}

function FloatingIcon({ icon: Icon, top, left, right, delay }) {
  const { scrollY } = useScroll();
  const yOffset = useTransform(scrollY, [0, 1000], [0, -150]);

  return (
    <motion.div
      style={{ position: 'absolute', top, left, right, y: yOffset }}
      animate={{ y: ['-15px', '15px', '-15px'], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
      className="hero-float-icon"
    >
      <Icon size={32} style={{ color: 'var(--gold-primary)', opacity: 0.5 }} />
      <style>{`.hero-float-icon { padding: 16px; background: rgba(255,255,255,0.04); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; display: none; } @media (min-width: 768px) { .hero-float-icon { display: block; } }`}</style>
    </motion.div>
  );
}
