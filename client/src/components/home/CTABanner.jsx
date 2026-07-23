// CTABanner — particles pre-computed at module level (React purity compliant)
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

// Pre-generate stable random particle data at module level (never changes on re-render)
const PARTICLES = Array.from({ length: 8 }, () => ({
  width:          Math.random() * 6 + 4,
  height:         Math.random() * 6 + 4,
  opacity:        Math.random() * 0.4 + 0.1,
  left:           `${Math.random() * 100}%`,
  top:            `${Math.random() * 100}%`,
  animDuration:   `${Math.random() * 3 + 3}s`,
  animDelay:      `${Math.random() * 2}s`,
}));

export default function CTABanner() {
  const { isAuthenticated } = useAuth();

  return (
    <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Animated gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(10,8,6,0.9), rgba(232,201,122,0.1), rgba(10,8,6,0.9))',
        backgroundSize: '300% 300%',
        animation: 'gradient-shift 6s ease infinite',
      }} />

      {/* Decorative particles — data pre-computed at module level to satisfy React purity rules */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: p.width,
            height: p.height,
            borderRadius: '50%',
            background: 'var(--gold-primary)',
            opacity: p.opacity,
            left: p.left,
            top: p.top,
            animation: `float ${p.animDuration} ease-in-out infinite`,
            animationDelay: p.animDelay,
          }}
        />
      ))}

      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ maxWidth: 680, margin: '0 auto' }}
        >
          <span className="section-label" style={{ marginBottom: 20, display: 'inline-flex' }}>
            {isAuthenticated ? 'Ready to Create?' : 'Get Started Today'}
          </span>

          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', marginBottom: 20, fontFamily: 'var(--font-display)', fontWeight: 900 }}>
            {isAuthenticated ? (
              <>
                Start Creating Your{' '}
                <span className="gradient-text">Next Video</span>
              </>
            ) : (
              <>
                Ready to Transform Your{' '}
                <span className="gradient-text">Research?</span>
              </>
            )}
          </h2>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7 }}>
            {isAuthenticated
              ? 'Access your dashboard and create professional AI-powered videos in minutes.'
              : 'Join 10,000+ researchers, educators, and experts who trust ClipCrafters for accurate, AI-powered video creation.'
            }
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-primary" data-cursor="pointer" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                  <LayoutDashboard size={18} />
                  Go to Dashboard
                </Link>
                <Link to="/projects/create" className="btn-ghost" data-cursor="pointer" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                  <PlusCircle size={18} />
                  Create Project
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary" data-cursor="pointer" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                  Start Creating Free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-ghost" data-cursor="pointer" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>

          {!isAuthenticated && (
            <p style={{ marginTop: 20, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No credit card required • 3 free projects per month
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
