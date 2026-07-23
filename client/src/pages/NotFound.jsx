import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ParticleField from '../components/ui/ParticleField.jsx';
import { floatY } from '../utils/animations.js';
import { pageTransition } from '../utils/animations.js';

export default function NotFound() {
  return (
    <motion.div
      {...pageTransition}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 40,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      <ParticleField count={60} />

      {/* Giant 404 */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          className="gradient-text"
          style={{
            fontSize: 'clamp(8rem, 25vw, 18rem)',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            lineHeight: 1,
            opacity: 0.15,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          404
        </div>

        {/* Floating clapperboard icon */}
        <motion.div
          variants={floatY}
          animate="animate"
          style={{ marginBottom: 32, position: 'relative' }}
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <path d="M7 4v3m3-3v3m3-3v3M4 8h16a1 1 0 011 1v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a1 1 0 011-1z" stroke="var(--gold-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 8l4-4h8l4 4" stroke="var(--gold-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)', position: 'relative' }}>
          Looks like this page got edited out.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 36, position: 'relative' }}>
          The scene you're looking for doesn't exist.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
          <Link to="/" className="btn-primary" data-cursor="pointer">Go Home</Link>
          <Link to="/dashboard" className="btn-ghost" data-cursor="pointer">Go to Dashboard</Link>
        </div>
      </div>
    </motion.div>
  );
}
