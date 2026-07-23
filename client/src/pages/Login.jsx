import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/index.js';
import { Spinner } from '../components/ui/index.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import ParticleField from '../components/ui/ParticleField.jsx';
import { staggerContainer, fadeInUp } from '../utils/animations.js';
import { unsplash } from '../utils/imageLoader.js';
import { pageTransition } from '../utils/animations.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null; // hide form during redirect

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const { token, refreshToken, user } = res.data.data;
      login(token, user, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const message = err.userMessage || err.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally { setLoading(false); }
  };

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* LEFT — Decorative panel */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }} className="desktop-only-flex">
        <ParticleField count={40} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.553-2.276A1 1 0 0121 8.67v6.66a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#0a0806" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>ClipCrafters</span>
          </div>

          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 28 }}>
            "The future of research communication is here."
          </blockquote>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={unsplash.avatar1} alt="Dr. Sarah Chen" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }} loading="lazy" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Dr. Sarah Chen</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Research Scientist, MIT</div>
              <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="var(--gold-primary)" color="var(--gold-primary)" />)}
              </div>
            </div>
          </div>

          {/* floating badges */}
          {[
            { label: '98% Accuracy', top: '15%', right: 0 },
            { label: 'Scene Editing', bottom: '20%', left: 0 },
            { label: 'AI Grounded', bottom: '30%', right: 0 },
          ].map(({ label, ...pos }) => (
            <div
              key={label}
              className="glass-card"
              style={{ position: 'absolute', ...pos, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-primary)', whiteSpace: 'nowrap' }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--bg-primary)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.553-2.276A1 1 0 0121 8.67v6.66a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#0a0806" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>ClipCrafters</span>
            </Link>
            <ThemeToggle size="sm" />
          </div>

          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.h1 variants={fadeInUp} style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
              Welcome back
            </motion.h1>
            <motion.p variants={fadeInUp} style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
              Sign in to continue creating
            </motion.p>

            {/* Email */}
            <motion.div variants={fadeInUp} className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  className="input-neu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ paddingLeft: 44 }}
                  data-cursor="text"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeInUp} className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-neu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                  data-cursor="text"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} data-cursor="pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.button
              variants={fadeInUp}
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary"
              data-cursor="pointer"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginBottom: 24, fontSize: '1rem' }}
            >
              {loading ? <><Spinner size={18} /> Signing in...</> : 'Sign In'}
            </motion.button>

            <motion.div variants={fadeInUp} style={{ textAlign: 'center', marginBottom: 16 }}>
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: 'var(--gold-primary)', 
                  fontSize: '0.85rem', 
                  textDecoration: 'none',
                  fontWeight: 500
                }} 
                data-cursor="pointer"
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: 'var(--gold-primary)', fontWeight: 600 }} data-cursor="pointer">
                  Start free →
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`@media (max-width: 767px) { .desktop-only-flex { display: none; } }`}</style>
    </motion.div>
  );
}
